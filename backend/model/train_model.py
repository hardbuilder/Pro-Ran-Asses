"""Train the ransomware-readiness ML models.

Usage (from the backend/ directory):

    python model/train_model.py

Pipeline:
    1. Load/generate the synthetic organizational-profile dataset
    2. Prepare the 19 questionnaire features + labels
    3. Train Logistic Regression and Random Forest
    4. Evaluate with stratified 5-fold cross-validation (accuracy, macro-F1)
    5. Compute majority-class baseline
    6. Save trained pipelines (joblib), evaluation metrics, model card
    7. Compute & save global SHAP feature importance

IMPORTANT: The dataset is synthetic with provisional proxy labels. Metrics
reported here are PRELIMINARY and not validated research results.
"""

import json
import os
import sys

# Allow running as a plain script from the backend/ directory
_SRC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _SRC not in sys.path:
    sys.path.insert(0, _SRC)

import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score
from sklearn.model_selection import StratifiedKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from assessment.questionnaire import QUESTION_KEY_ORDER, feature_name_map
from data.generate_dataset import N_SAMPLES, generate_profiles, load_dataset, save_dataset

MODELS_DIR = os.path.join(_SRC, "model", "models")
DATA_CSV = os.path.join(_SRC, "data", "synthetic_data.csv")

FEATURE_KEY = "feature"
LABEL_KEY = "label"

CLASSES = ["Low", "Moderate", "High"]


def _class_to_index(name):
    return CLASSES.index(name)


def prepare_data():
    """Load dataset if present, otherwise generate + save it."""
    if os.path.exists(DATA_CSV):
        df = load_dataset(DATA_CSV)
    else:
        df = generate_profiles()
        save_dataset(df)
    X = df[list(QUESTION_KEY_ORDER)].astype(int).values
    y = df[LABEL_KEY].map(_class_to_index).values
    return X, y, df


def train(models_dir=MODELS_DIR, dataset_csv=DATA_CSV):
    X, y, df = prepare_data()
    n_samples, n_features = X.shape

    print(f"Dataset: {n_samples} synthetic profiles, {n_features} features")
    print("Label distribution: ", df[LABEL_KEY].value_counts().to_dict())

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=7)

    learners = {
        "logistic_regression": LogisticRegression(
            random_state=7, max_iter=2000, C=1.0, solver="lbfgs"
        ),
        "random_forest": RandomForestClassifier(
            random_state=7, n_estimators=200, max_depth=8, min_samples_leaf=3
        ),
    }

    results = {}
    agg_confusions = {}

    for name, learner in learners.items():
        accs, f1s = [], []
        conf_sum = np.zeros((3, 3), dtype=int)
        for train_idx, test_idx in cv.split(X, y):
            model = make_pipeline(StandardScaler(), learner.__class__(**learner.get_params()))
            model.fit(X[train_idx], y[train_idx])
            pred = model.predict(X[test_idx])
            accs.append(accuracy_score(y[test_idx], pred))
            f1s.append(f1_score(y[test_idx], pred, average="macro", zero_division=0))
            conf_sum += confusion_matrix(y[test_idx], pred, labels=[0, 1, 2])
        agg_confusions[name] = conf_sum.tolist()
        results[name] = {
            "accuracy": round(float(np.mean(accs)) * 100, 1),
            "macro_f1": round(float(np.mean(f1s)) * 100, 1),
            "n_folds": cv.get_n_splits(),
        }
        print(f"{name:>18}: accuracy={results[name]['accuracy']}%  macro-F1={results[name]['macro_f1']}%")

    # Majority-class baseline
    majority_class = pd_labels_majority(df)
    results["majority_baseline"] = {
        "accuracy": round(float(majority_class["accuracy_pct"]), 1),
        "macro_f1": round(float(majority_class["macro_f1_pct"]), 1),
        "majority_class": majority_class["class"],
        "note": "Predicts the most frequent class for every sample.",
    }
    print(
        "majority_baseline   : accuracy=%s%%  macro-F1=%s%%"
        % (results["majority_baseline"]["accuracy"], results["majority_baseline"]["macro_f1"])
    )

    # Fit the final models used by the live API
    X_scaled = StandardScaler().fit_transform(X)

    lr = make_pipeline(
        StandardScaler(),
        LogisticRegression(random_state=7, max_iter=2000, C=1.0, solver="lbfgs"),
    )
    rf = make_pipeline(
        StandardScaler(),
        RandomForestClassifier(random_state=7, n_estimators=200, max_depth=8, min_samples_leaf=3),
    )
    lr.fit(X, y)
    rf.fit(X, y)

    os.makedirs(models_dir, exist_ok=True)

    joblib.dump(lr, os.path.join(models_dir, "lr_pipeline.joblib"))
    joblib.dump(rf, os.path.join(models_dir, "rf_pipeline.joblib"))
    joblib.dump(lr.steps[-1][1], os.path.join(models_dir, "lr_model.joblib"))
    joblib.dump(rf.steps[-1][1], os.path.join(models_dir, "rf_model.joblib"))
    joblib.dump(lr.steps[0][1], os.path.join(models_dir, "lr_scaler.joblib"))
    joblib.dump(rf.steps[0][1], os.path.join(models_dir, "rf_scaler.joblib"))

    # Reference data (scaled) used as the SHAP linear masker
    np.save(os.path.join(models_dir, "reference_masker.npy"), X_scaled)

    human_names = feature_name_map()
    model_card = {
        "feature_keys": list(QUESTION_KEY_ORDER),
        "human_feature_names": human_names,
        "classes": CLASSES,
        "n_samples": int(n_samples),
        "n_features": int(n_features),
        "cv": {"method": "stratified_kfold", "n_folds": cv.get_n_splits(), "shuffle": True, "random_state": 7},
        "dataset": {
            "source": "synthetic",
            "n_profiles": int(n_samples),
            "description": "Synthetic organizational profiles with provisional proxy labels.",
        },
    }
    with open(os.path.join(models_dir, "model_card.json"), "w", encoding="utf-8") as fh:
        json.dump(model_card, fh, indent=2)

    evaluation = {
        "models": results,
        "confusion_matrices": agg_confusions,
        "classes": CLASSES,
        "n_samples": int(n_samples),
        "n_features": int(n_features),
        "cv": model_card["cv"],
        "note": (
            "Preliminary evaluation using synthetic proxy labels. Independent expert-labelled "
            "data will be incorporated in the next research phase. Results are NOT validated "
            "research findings."
        ),
    }
    with open(os.path.join(models_dir, "evaluation.json"), "w", encoding="utf-8") as fh:
        json.dump(evaluation, fh, indent=2)

    # Global SHAP importance (saved once; the API reads these files)
    global_importance = compute_global_shap(X, y, lr, rf, models_dir)
    with open(os.path.join(models_dir, "shap_global.json"), "w", encoding="utf-8") as fh:
        json.dump(global_importance, fh, indent=2)

    print("\nSaved models + evaluation to:", models_dir)
    return evaluation, model_card


def pd_labels_majority(df):
    """Baseline metrics for a constant majority-class classifier over the dataset."""
    counts = df[LABEL_KEY].value_counts().to_dict()
    majority_cls, majority_n = max(counts.items(), key=lambda kv: kv[1])
    n = len(df)
    recall = majority_n / n  # recall of the chosen class when predicting it always
    per_class_f1 = [0.0, 0.0, 0.0]
    idx = CLASSES.index(majority_cls)
    per_class_f1[idx] = 2 * recall / (1 + recall)  # precision for the chosen class is 1.0
    macro_f1 = float(np.mean(per_class_f1) * 100)
    return {
        "class": majority_cls,
        "accuracy_pct": recall * 100,
        "macro_f1_pct": macro_f1,
    }


def compute_global_shap(X, y, lr, rf, models_dir):
    """Mean |SHAP| per feature over a training subsample, for both models."""
    import shap  # imported lazily so training remains optional

    rng = np.random.default_rng(11)
    idx = rng.choice(len(X), size=min(80, len(X)), replace=False)
    X_sub = X[idx]
    X_scaled_sub = StandardScaler().fit(X).transform(X_sub)

    out = {}
    scaler = lr.steps[0][1]
    lr_model = lr.steps[-1][1]
    rf_model = rf.steps[-1][1]

    from explainability.shap_explainer import as_classes_samples_features

    # Logistic Regression (LinearExplainer on scaled features)
    try:
        lin = shap.LinearExplainer(lr_model, masker=shap.maskers.Independent(X_scaled_sub))
        sv_raw = lin.shap_values(X_scaled_sub)
        sv = as_classes_samples_features(sv_raw, n_classes=3)
        out["lr"] = {
            k: float(np.abs(sv).mean(axis=(0, 1))[i])
            for i, k in enumerate(QUESTION_KEY_ORDER)
        }
    except Exception as exc:  # noqa: BLE001
        out["lr"] = {"error": f"global shap unavailable: {exc}"}

    # Random Forest (TreeExplainer on scaled features, matching pipeline internals)
    try:
        tree = shap.TreeExplainer(rf_model)
        sv_raw = tree.shap_values(X_scaled_sub)
        sv = as_classes_samples_features(sv_raw, n_classes=3)
        out["rf"] = {
            k: float(np.abs(sv).mean(axis=(0, 1))[i])
            for i, k in enumerate(QUESTION_KEY_ORDER)
        }
    except Exception as exc:  # noqa: BLE001
        out["rf"] = {"error": f"global shap unavailable: {exc}"}

    return out


if __name__ == "__main__":
    metrics, card = train()
    print("\n=== DONE ===")
    print(json.dumps(metrics, indent=2))