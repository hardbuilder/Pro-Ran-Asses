"""Flask REST API for the Ransomware Readiness Assessment prototype.

Endpoints:
    GET  /api/health
    GET  /api/questionnaire
    POST /api/assess
    POST /api/explain
    GET  /api/model-info
    GET  /api/methodology
    POST /api/recommendations

This is a defensive readiness-assessment prototype. It does not detect,
simulate or exploit ransomware.
"""

import json
import os
import uuid
from datetime import datetime, timezone

from flask import Flask, jsonify, request
from flask_cors import CORS

from assessment.recommendations import generate_recommendations
from assessment.scoring import validate_answers, framework_payload
from assessment.questionnaire import (
    DIMENSIONS,
    SCORE_OPTIONS,
    feature_name_map,
)
from explainability.shap_explainer import explain_local, global_importance
from model.predict import ensure_artifacts, predict

_SRC = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(_SRC, "model", "models")

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

DISCLAIMER = (
    "Research prototype for organizational ransomware readiness assessment. "
    "Scoring is framework-grounded; ML results are preliminary and derived from a "
    "synthetic dataset with provisional proxy labels. This tool does not guarantee "
    "ransomware protection and is not a certified security assessment."
)


def _read_json(name):
    path = os.path.join(MODELS_DIR, name)
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def _json_body():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        raise ValueError("Request body must be a JSON object.")
    return body


def _extract_answers(body):
    answers = body.get("answers")
    if not isinstance(answers, dict):
        raise ValueError("'answers' must be an object mapping question keys to 0-3 scores.")
    normalized, errors = validate_answers(answers)
    if errors:
        raise ValueError("; ".join(errors[:5]) + (f" (+{len(errors)-5} more)" if len(errors) > 5 else ""))
    return normalized


@app.errorhandler(ValueError)
def _value_error(err):
    return jsonify({"error": str(err)}), 400


@app.errorhandler(Exception)
def _internal_error(err):
    app.logger.exception("Unhandled error")
    return jsonify({"error": "Internal server error", "detail": str(err)}), 500


# --------------------------------------------------------------------------
# Endpoints
# --------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "service": "ransomware-readiness-assessment-api",
            "version": "prototype-1.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )


@app.get("/api/questionnaire")
def questionnaire():
    return jsonify(
        {
            "dimensions": DIMENSIONS,
            "score_options": SCORE_OPTIONS,
            "count": sum(len(d["questions"]) for d in DIMENSIONS),
            "scale": {"min": 0, "max": 3},
        }
    )


@app.post("/api/assess")
def assess():
    body = _json_body()
    answers = _extract_answers(body)
    model_name = body.get("model", "random_forest")
    if model_name not in ("random_forest", "lr"):
        raise ValueError("'model' must be 'random_forest' or 'lr'.")
    weighting = body.get("weighting", "equal")
    if weighting not in ("equal", "expert"):
        raise ValueError("'weighting' must be 'equal' or 'expert'.")

    framework = framework_payload(answers)
    ml = predict(answers, model_name=model_name)

    explanation = explain_local(answers, model_key=model_name, predicted_class=ml["prediction"])
    gi = global_importance(model_name)
    recs = generate_recommendations(
        answers, framework["dimension_scores"], framework["question_scores"], include_sources=True
    )

    if explanation["contributions"] and explanation.get("additive"):
        feature_importance = {
            "type": "local",
            "method": explanation["method"],
            "label": explanation["label"],
            "base_value": explanation.get("base_value"),
            "contributions": explanation["contributions"][:10],
        }
    else:
        feature_importance = {
            "type": "global_fallback",
            "method": "global_fallback",
            "label": "Global feature-importance fallback (local SHAP unavailable)",
            "contributions": explanation["contributions"][:10],
        }

    response = {
        "request_id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "overall_score": framework["overall_score"],
        "classification": framework["classification"],
        "framework_score": framework["framework_score"],
        "dimension_scores": framework["dimension_scores"],
        "question_scores": framework["question_scores"],
        "weak_dimensions": framework["weak_dimensions"],
        "ml_prediction": ml["prediction"],
        "ml_model": ml["model"],
        "model_probabilities": ml["probabilities"],
        "ml_confidence": ml["confidence"],
        "shap_values": explanation,
        "feature_importance": feature_importance,
        "global_feature_importance": gi,
        "recommendations": recs["recommendations"],
        "quick_wins": recs["quick_wins"],
        "sources": recs["sources"],
        "rag": recs["rag"],
        "weighting": weighting,
        "disclaimer": DISCLAIMER,
    }
    return jsonify(response)


@app.post("/api/explain")
def explain():
    body = _json_body()
    answers = _extract_answers(body)
    model_name = body.get("model", "random_forest")
    if model_name not in ("random_forest", "lr"):
        raise ValueError("'model' must be 'random_forest' or 'lr'.")
    ml = predict(answers, model_name=model_name)
    explanation = explain_local(answers, model_key=model_name, predicted_class=ml["prediction"])
    return jsonify(
        {
            "explanation": explanation,
            "model": ml["model"],
            "prediction": ml["prediction"],
            "probabilities": ml["probabilities"],
            "global_feature_importance": global_importance(model_name),
            "disclaimer": DISCLAIMER,
        }
    )


@app.get("/api/model-info")
def model_info():
    evaluation = _read_json("evaluation.json")
    model_card = _read_json("model_card.json")
    if evaluation is None or model_card is None:
        return (
            jsonify(
                {
                    "error": "Model evaluation artifacts not found. Run 'python model/train_model.py' from the backend/ directory.",
                    "status": "untrained",
                }
            ),
            200,
        )
    return jsonify(
        {
            "status": "trained",
            "evaluation": evaluation,
            "model_card": model_card,
            "human_feature_names": feature_name_map(),
            "global_shap_importance": {
                "lr": global_importance("lr"),
                "rf": global_importance("rf"),
            },
            "note": (
                "Preliminary evaluation using synthetic proxy labels. Independent expert-"
                "labelled data will be incorporated in the next research phase."
            ),
        }
    )


@app.get("/api/methodology")
def methodology():
    pipeline = [
        {
            "step": 1,
            "title": "Questionnaire",
            "detail": "19 questions across 8 ransomware-readiness dimensions, each scored 0-3.",
            "status": "completed",
            "phase": "prototype",
        },
        {
            "step": 2,
            "title": "Framework-grounded scoring",
            "detail": "Transparent, configurable weighting (equal-weight prototype; AHP expert weights pending).",
            "status": "completed",
            "phase": "prototype",
        },
        {
            "step": 3,
            "title": "Synthetic organizational profiles",
            "detail": "200 plausible synthetic profiles with provisional proxy labels.",
            "status": "completed",
            "phase": "prototype",
        },
        {
            "step": 4,
            "title": "Machine-learning classification",
            "detail": "Logistic Regression & Random Forest with 5-fold cross-validation and majority baseline.",
            "status": "completed",
            "phase": "prototype",
        },
        {
            "step": 5,
            "title": "SHAP explainability",
            "detail": "Local + global feature importance via TreeExplainer / LinearExplainer.",
            "status": "completed",
            "phase": "prototype",
        },
        {
            "step": 6,
            "title": "Framework-weight vs ML-importance comparison",
            "detail": "Spearman rank correlation & Kendall's tau between expert-derived weight ranking and SHAP ranking.",
            "status": "pending",
            "phase": "future",
            "note": "Pending expert-derived weighting study.",
        },
        {
            "step": 7,
            "title": "Independent expert validation",
            "detail": "3-5 independent experts label a subset of profiles; majority labels become reference labels; agreement measured.",
            "status": "pending",
            "phase": "future",
            "note": "Next research phase. No expert data has been fabricated or collected yet.",
        },
        {
            "step": 8,
            "title": "Optional RAG recommendation pilot",
            "detail": "Ground recommendations in an approved guidance corpus (CIS Controls v8.1, NIST IR 8374r1, CISA Ransomware Guide).",
            "status": "planned",
            "phase": "future",
            "note": "Experimental / planned.",
        },
    ]
    return jsonify(
        {
            "title": "Research methodology",
            "pipeline": pipeline,
            "completed": [p for p in pipeline if p["status"] == "completed"],
            "future": [p for p in pipeline if p["status"] != "completed"],
            "expert_validation": {
                "status": "next_phase",
                "plan": [
                    "Generate synthetic organizational profiles.",
                    "Select a subset for expert labelling.",
                    "Have 3-5 independent cybersecurity/IT experts evaluate each profile.",
                    "Experts classify each profile as Low / Moderate / High without seeing rule-based labels.",
                    "Experts answer independently (no knowledge of each other's responses).",
                    "Majority label becomes the reference label.",
                    "Inter-rater agreement is calculated.",
                    "ML models are evaluated against the independent labels.",
                ],
                "completed": False,
            },
            "rag": {
                "status": "experimental/planned",
                "corpus": ["CIS Controls v8.1", "NIST IR 8374r1", "CISA Ransomware Guide"],
                "note": "RAG is an auxiliary pilot, not the central contribution.",
            },
            "weighting_study": {
                "status": "pending",
                "message": "Pending expert-derived weighting study. No AHP weights have been produced or fabricated.",
            },
            "prototype_scope": "COMPLETED PROTOTYPE WORK",
            "future_scope": "FUTURE RESEARCH VALIDATION",
            "architecture": {
                "label": "Questionnaire -> Framework scoring + ML prediction -> SHAP -> Recommendations -> Dashboard",
                "components": ["React frontend", "Flask REST API", "scikit-learn models", "SHAP", "framework scoring engine"],
            },
        }
    )


@app.post("/api/recommendations")
def recommendations():
    body = _json_body()
    answers = _extract_answers(body)
    framework = framework_payload(answers)
    recs = generate_recommendations(
        answers, framework["dimension_scores"], framework["question_scores"], include_sources=True
    )
    return jsonify(
        {
            "overall_score": framework["overall_score"],
            "classification": framework["classification"],
            **recs,
            "disclaimer": DISCLAIMER,
        }
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="127.0.0.1", port=port, debug=False)