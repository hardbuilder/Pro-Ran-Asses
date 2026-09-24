"""Quick API smoke test (no server needed; uses Flask's test client).

Run: python scripts/smoke_test.py  (from backend/)
"""

import json
import os
import sys

_SRC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _SRC not in sys.path:
    sys.path.insert(0, _SRC)

from app import app  # noqa: E402


def _answers():
    from assessment.questionnaire import QUESTION_KEY_ORDER

    a = {q: 3 for q in QUESTION_KEY_ORDER}
    a["Q1.1"], a["Q1.3"], a["Q2.1"], a["Q5.2"], a["Q7.2"], a["Q8.2"] = 0, 1, 2, 1, 2, 2
    return a


def main():
    client = app.test_client()
    failures = []

    def check(name, ok, extra=""):
        status = "OK" if ok else "FAIL"
        print(f"[{status}] {name} {extra}")
        if not ok:
            failures.append(name)

    r = client.get("/api/health")
    check("health", r.status_code == 200 and r.get_json()["status"] == "ok")

    r = client.get("/api/questionnaire")
    body = r.get_json()
    check("questionnaire", r.status_code == 200 and body["count"] == 19)

    r = client.get("/api/model-info")
    body = r.get_json()
    check("model-info trained", r.status_code == 200 and body.get("status") == "trained")
    check("model-info metrics", "logistic_regression" in body["evaluation"]["models"])

    answers = _answers()
    r = client.post("/api/assess", json={"answers": answers})
    check("assess 200", r.status_code == 200)
    body = r.get_json()
    check("assess overall score", 0 <= body["overall_score"] <= 100, f"({body['overall_score']})")
    check("assess dims", len(body["dimension_scores"]) == 8)
    check("assess ml prediction", body["ml_prediction"] in ("Low", "Moderate", "High"))
    check("assess probs", set(body["model_probabilities"]) == {"Low", "Moderate", "High"})
    check("assess shap method", body["feature_importance"]["type"] in ("local", "global_fallback"))
    check("assess recommendations", isinstance(body["recommendations"], list))

    r = client.post("/api/assess", json={"answers": {q: 0 for q in answers}, "model": "lr"})
    check("assess lr model", r.status_code == 200 and r.get_json()["ml_model"] == "Logistic Regression")

    r = client.post("/api/assess", json={"answers": {q: 3 for q in answers}})
    check("assess all high", r.get_json()["classification"] in ("High", "Moderate"))

    r = client.post("/api/assess", json={"answers": {"Q1.1": 5}})
    check("assess invalid value rejected", r.status_code == 400)

    r = client.post("/api/assess", json={"answers": {}})
    check("assess missing answers rejected", r.status_code == 400)

    r = client.post("/api/assess", json={"nope": 1})
    check("assess missing answers key rejected", r.status_code == 400)

    r = client.post("/api/explain", json={"answers": answers})
    check("explain 200", r.status_code == 200)
    body = r.get_json()["explanation"]
    check("explain contributions additive",
          body.get("additive") is True and len(body["contributions"]) > 0)

    r = client.get("/api/methodology")
    body = r.get_json()
    check("methodology", r.status_code == 200 and len(body["pipeline"]) == 8)

    r = client.post("/api/recommendations", json={"answers": answers})
    check("recommendations endpoint", r.status_code == 200)

    print()
    if failures:
        print(f"{len(failures)} FAILED: {failures}")
        return 1
    print("ALL BACKEND SMOKE TESTS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())