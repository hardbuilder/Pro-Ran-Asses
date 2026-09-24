"""SHAP-based explainability for the live API.

For a submitted assessment:
  1. Transform questionnaire answers into the model's feature format.
  2. Run the model.
  3. Generate a real SHAP explanation.
  4. Return actual SHAP values.

Supported:
  - Random Forest  -> shap.TreeExplainer  (probability-space SHAP)
  - Logistic Reg.  -> shap.LinearExplainer (logit-space SHAP converted to
                      probability contributions with an exact cumulative
                      softmax decomposition)

If a local SHAP explanation cannot be produced, the module falls back to the
saved global mean-|SHAP| importance, clearly labelled as a fallback.

Never invents SHAP values.
"""

import json
import os

import numpy as np

from assessment.questionnaire import QUESTION_KEY_ORDER, feature_name_map
from model.predict import ensure_artifacts

_SRC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(_SRC, "model", "models")

try:
    import shap  # noqa: F401  (kept as a module dependency marker)

    _SHAP_AVAILABLE = True
except Exception:  # noqa: BLE001
    _SHAP_AVAILABLE = False


def _softmax(z):
    z = z - np.max(z)
    e = np.exp(z)
    return e / e.sum()


def as_classes_samples_features(sv, n_classes):
    """Normalise shap_values() output to (classes, samples, features).

    Handles the modern shap API shape (samples, features, classes) and the
    legacy per-class list [(samples, features), ...].
    """
    arr = np.asarray(sv)
    if arr.ndim == 3:
        s, f, c = arr.shape
        if c == n_classes:
            return arr.transpose(2, 0, 1).copy()
        if s == n_classes:
            return arr
    if isinstance(sv, (list, tuple)):
        return np.stack([np.asarray(x) for x in sv])
    raise ValueError(f"Unsupported shap_values shape: {arr.shape}")


def global_importance(model_key="rf"):
    """Load saved mean-|SHAP| feature importance for a model."""
    path = os.path.join(MODELS_DIR, "shap_global.json")
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as fh:
        data = json.load(fh)
    return data.get(model_key)


def _fallback_explanation(answers, model_key):
    """Clearly-labelled global mean-|SHAP| fallback (not a local explanation)."""
    human = feature_name_map()
    gi = global_importance(model_key)
    contributions = []
    if gi and "error" not in gi:
        ordered = sorted(gi.items(), key=lambda kv: -float(kv[1]))
        max_abs = max((float(v) for _, v in ordered), default=1.0) or 1.0
        for k, v in ordered:
            contributions.append(
                {
                    "feature": k,
                    "question": k,
                    "name": human.get(k, k),
                    "value": float(v),
                    "normalized": float(v) / max_abs,
                }
            )
    return {
        "method": "global_fallback",
        "label": "Global feature-importance fallback (local SHAP unavailable)",
        "base_value": None,
        "contributions": contributions,
        "additive": False,
    }


def explain_local(answers, model_key="random_forest", predicted_class=None):
    """Produce an additive SHAP explanation for a single assessment.

    Returns a dict with method/base_value/contributions where the summed
    contributions + base_value equal the model's probability for the
    predicted class.
    """
    artifact = ensure_artifacts()
    human = feature_name_map()
    X = np.array([[answers[q] for q in QUESTION_KEY_ORDER]], dtype=float)
    alias = {"random_forest": "rf", "logistic_regression": "lr", "lr": "lr"}.get(model_key, "rf")
    model_key = alias

    if not _SHAP_AVAILABLE:
        return _fallback_explanation(answers, model_key)

    try:
        if model_key == "rf":
            # The RF inside the pipeline was trained on SCALED features, so the
            # TreeExplainer must receive the same scaled representation.
            x_model = artifact["rf"]["scaler"].transform(X)
            explainer = shap.TreeExplainer(artifact["rf"]["model"])
            sv_raw = explainer.shap_values(x_model)
            expected = np.asarray(explainer.expected_value).reshape(-1)
            sv = as_classes_samples_features(sv_raw, n_classes=len(artifact["model_card"]["classes"]))
            vals = sv[:, 0, :]  # (classes, features)
            base = expected
            method = "shap_tree"
        else:
            if artifact.get("masker") is None:
                return _fallback_explanation(answers, model_key)
            x_scaled = artifact["lr"]["scaler"].transform(X)
            masker = shap.maskers.Independent(artifact["masker"], max_samples=len(artifact["masker"]))
            explainer = shap.LinearExplainer(artifact["lr"]["model"], masker=masker)
            sv_raw = explainer.shap_values(x_scaled)
            expected = np.asarray(explainer.expected_value).reshape(-1)
            sv = as_classes_samples_features(sv_raw, n_classes=len(artifact["model_card"]["classes"]))
            vals = sv[:, 0, :]  # (classes, features)
            base = expected  # base logits
            # Convert logit SHAP to exact probability-space contributions
            vals, base = _logit_to_prob_space(vals, base)
            method = "shap_linear"

        labels = artifact["model_card"]["classes"]
        if predicted_class is None:
            predicted_class = labels[int(artifact[model_key]["pipeline"].predict(X)[0])]
        cidx = labels.index(predicted_class)

        feats = vals[cidx]
        base_value = float(base[cidx]) if base.ndim else float(base)
        probs = artifact[model_key]["pipeline"].predict_proba(X)[0]
        predicted_prob = float(probs[cidx])

        contributions = [
            {
                "feature": qkey,
                "question": qkey,
                "name": human[qkey],
                "value": float(feats[i]),
            }
            for i, qkey in enumerate(QUESTION_KEY_ORDER)
        ]
        contributions.sort(key=lambda c: -abs(c["value"]))

        return {
            "method": method,
            "label": (
                "Local SHAP explanation (TreeExplainer)"
                if method == "shap_tree"
                else "Local SHAP explanation (LinearExplainer)"
            ),
            "base_value": base_value,
            "predicted_class": predicted_class,
            "predicted_probability": predicted_prob,
            "contributions": contributions,
            "additive": True,
            "feature_count": len(QUESTION_KEY_ORDER),
        }
    except Exception as exc:  # noqa: BLE001
        fallback = _fallback_explanation(answers, model_key)
        fallback["error"] = f"local SHAP failed ({exc}); showing global fallback."
        return fallback


def _logit_to_prob_space(vals_logit, base_logit):
    """Exact cumulative-softmax conversion of logit SHAP to probability space.

    Features are applied in a deterministic order (by summed absolute logit
    influence across classes). After each step the probability vector is
    re-softmaxed, so per-class contributions sum exactly to the difference
    between the final predicted probability and the base probability.
    """
    p_base = _softmax(base_logit)
    order = np.argsort(-np.abs(vals_logit).sum(axis=0))
    cum = np.zeros(base_logit.shape[0])
    p_before = p_base
    prob_contrib = np.zeros_like(vals_logit)
    for col in order:
        cum = cum + vals_logit[:, col]
        p_after = _softmax(base_logit + cum)
        prob_contrib[:, col] = p_after - p_before
        p_before = p_after
    return prob_contrib, p_base