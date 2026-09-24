"""Framework-grounded scoring engine.

Transparent scoring pipeline:

    19 question scores (0-3)
          -> 8 dimension scores (0-100)
          -> overall readiness score (0-100)

Weighting is configurable via backend/config/weights.json. The current
weighting is an EQUAL-weight prototype. Official "framework-grounded
expert-derived weights" (e.g. from an AHP pairwise-comparison study) are
planned future work and must never be fabricated.
"""

import json
import os

from .questionnaire import (
    DIMENSION_KEY_ORDER,
    QUESTION_KEY_ORDER,
    QUESTION_TO_DIMENSION,
)

_CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config", "weights.json")


def load_config():
    with open(_CONFIG_PATH, "r", encoding="utf-8") as fh:
        return json.load(fh)


def validate_answers(answers):
    """Validate a raw answers mapping. Returns (normalized dict, errors)."""
    if not isinstance(answers, dict):
        return None, ["answers must be a JSON object"]
    errors = []
    normalized = {}
    seen = set()
    for qkey in QUESTION_KEY_ORDER:
        if qkey not in answers:
            errors.append(f"Missing answer for {qkey}")
            continue
        raw = answers[qkey]
        if not isinstance(raw, (int, float)) or isinstance(raw, bool):
            errors.append(f"Answer for {qkey} must be a number")
            continue
        value = int(raw)
        if raw != value or value not in (0, 1, 2, 3):
            errors.append(f"Answer for {qkey} must be one of 0,1,2,3 (got {raw})")
            continue
        normalized[qkey] = value
        seen.add(qkey)
    # quiet lint guard (unused here on purpose)
    _ = seen
    return (normalized, errors) if not errors else (None, errors)


def _weights_for(weighting):
    """Return (dimension_weights, question_weights, note).

    Both default to equal weights until the AHP expert study is completed.
    """
    cfg = load_config()
    weighting_cfg = cfg.get("weighting", {})
    note = weighting_cfg.get("note", "")

    if weighting == "expert":
        dim_weights = weighting_cfg.get("dimension_weights")
        if dim_weights is None:
            note = (
                "Expert-derived (AHP) weights are PENDING. Falling back to equal "
                "weights for the prototype. " + note
            )
            dim_weights = {k: 1.0 for k in DIMENSION_KEY_ORDER}
        q_weights = weighting_cfg.get("question_weights") or {}
    else:
        dim_weights = {k: 1.0 for k in DIMENSION_KEY_ORDER}
        q_weights = {}

    return dim_weights, q_weights, note


def compute_scores(answers, weighting="equal"):
    """Compute dimension + overall readiness scores.

    Returns a dict with dimension_scores, overall_score, question_scores.
    weighting: "equal" (default) or "expert" (falls back to equal while pending).
    """
    normalized, _ = validate_answers(answers)
    cfg = load_config()

    from .questionnaire import DIMENSIONS, QUESTION_BY_KEY

    dim_weights, q_weights, note = _weights_for(weighting)

    total_weight = 0.0
    weighted_total = 0.0
    dimension_scores = {}
    question_scores = {}

    for dim in DIMENSIONS:
        dim_key = dim["key"]
        q_keys = [q["key"] for q in dim["questions"]]
        dim_weight_sum = 0.0
        dim_weighted = 0.0
        dim_values = {}
        for qkey in q_keys:
            value = normalized[qkey]
            qw = q_weights.get(dim_key, {}).get(qkey, 1.0)
            dim_weighted += value * qw
            dim_weight_sum += qw
            dim_values[qkey] = value
            question_scores[qkey] = value
        dim_score = (dim_weighted / dim_weight_sum) * (100.0 / 3.0) if dim_weight_sum else 0.0
        dimension_scores[dim_key] = round(dim_score, 1)
        dw = dim_weights.get(dim_key, 1.0)
        total_weight += dw
        weighted_total += dim_score * dw

    overall = (weighted_total / total_weight) if total_weight else 0.0
    overall = round(overall, 1)

    thresholds = cfg["thresholds"]
    cls = classify(overall, thresholds["low"], thresholds["high"])

    return {
        "dimension_scores": dimension_scores,
        "question_scores": question_scores,
        "overall_score": overall,
        "classification": cls,
        "weighting_note": note,
        "weighting": weighting,
    }


def classify(overall_score, low_threshold=50.0, high_threshold=80.0):
    """Map a 0-100 readiness score to a Low/Moderate/High class."""
    if overall_score < low_threshold:
        return "Low"
    if overall_score < high_threshold:
        return "Moderate"
    return "High"


def weak_dimensions(dimension_scores, threshold=None):
    """Return dimension keys whose score is below the weak threshold."""
    cfg = load_config()
    if threshold is None:
        threshold = cfg.get("weak_dimension_threshold", 60)
    return [k for k, v in dimension_scores.items() if v < threshold]


def framework_payload(answers):
    """Result of the transparent scoring engine (no ML involved)."""
    equal = compute_scores(answers, weighting="equal")
    expert = compute_scores(answers, weighting="expert")
    return {
        "framework_score": {
            "equal": equal["overall_score"],
            "expert": expert["overall_score"],
            "weighting_requested": "equal",
            "note": expert["weighting_note"],
            "config": "backend/config/weights.json",
        },
        "overall_score": equal["overall_score"],
        "classification": equal["classification"],
        "dimension_scores": equal["dimension_scores"],
        "question_scores": equal["question_scores"],
        "weak_dimensions": weak_dimensions(equal["dimension_scores"]),
    }


# Re-export for convenience
def all_question_keys():
    return list(QUESTION_KEY_ORDER) if QUESTION_KEY_ORDER else list(QUESTION_TO_DIMENSION.keys())