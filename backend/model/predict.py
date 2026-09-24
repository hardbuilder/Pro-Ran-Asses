"""Prediction helpers for the live API.

Loads the trained pipelines (joblib) and produces actual predictions for a
submitted questionnaire. Never hard-codes predictions.
"""

import json
import os

import joblib
import numpy as np

from assessment.questionnaire import QUESTION_KEY_ORDER

_SRC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(_SRC, "model", "models")


def _load(name):
    path = os.path.join(MODELS_DIR, name)
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Model artifact '{name}' is missing. Run 'python model/train_model.py' from backend/ first."
        )
    return joblib.load(path)


_artifacts = None


def ensure_artifacts():
    """Load all model artifacts once (cached)."""
    global _artifacts
    if _artifacts is None:
        _artifacts = {}
        for cls in ("lr", "rf"):
            _artifacts[cls] = {
                "pipeline": _load(f"{cls}_pipeline.joblib"),
                "model": _load(f"{cls}_model.joblib"),
                "scaler": _load(f"{cls}_scaler.joblib"),
            }
        masker_path = os.path.join(MODELS_DIR, "reference_masker.npy")
        _artifacts["masker"] = (
            np.load(masker_path) if os.path.exists(masker_path) else None
        )
        with open(os.path.join(MODELS_DIR, "model_card.json"), "r", encoding="utf-8") as fh:
            _artifacts["model_card"] = json.load(fh)
    return _artifacts


def answers_to_vector(answers):
    """Map {'Q1.1': 2, ...} to a numpy feature vector in questionnaire order."""
    return np.array([[answers[q] for q in QUESTION_KEY_ORDER]], dtype=float)


def classes():
    artifact = ensure_artifacts()
    return artifact["model_card"]["classes"]


def predict(answers, model_name="random_forest"):
    """Return {prediction, probabilities, model} for a validated answers dict."""
    artifact = ensure_artifacts()
    alias = {"random_forest": "rf", "logistic_regression": "lr", "lr": "lr"}.get(model_name, "rf")
    X = answers_to_vector(answers)
    pipe = artifact[alias]["pipeline"]
    probs = pipe.predict_proba(X)[0]
    pred_idx = int(pipe.predict(X)[0])
    labels = artifact["model_card"]["classes"]
    probabilities = {labels[i]: round(float(probs[i]), 4) for i in range(len(labels))}
    return {
        "prediction": labels[pred_idx],
        "probabilities": probabilities,
        "model": "Logistic Regression" if alias == "lr" else "Random Forest",
        "model_key": alias,
        "confidence": float(probs[pred_idx]),
    }


def available_models():
    return ["lr", "rf"]