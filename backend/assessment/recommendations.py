"""Defensive recommendations generated from actual weak readiness dimensions.

All content is defensive guidance. No attack instructions are ever produced.
Optional knowledge-grounded retrieval (mini-RAG) is an EXPERIMENTAL / PLANNED
pilot that surfaces authoritative defensive guidance alongside recommendations.
"""

from .questionnaire import DIMENSIONS, DIMENSION_BY_KEY

# Defensive, dimension-level recommendation templates.
# (recommendation, rationale)
DIMENSION_RECOMMENDATIONS = {
    "backup_recovery": (
        "Review whether critical systems have offline or immutable backups and periodically "
        "test restoration procedures. Maintain a defined backup schedule and validate full "
        "restores at least annually so recovery does not depend on untested assumptions.",
        "Ransomware frequently targets backup copies first; reliable, testable backups are a "
        "primary recovery lever.",
    ),
    "iam": (
        "Review MFA coverage, privileged-account separation, and periodic access reviews. "
        "Require MFA for remote access and privileged accounts, keep administrative accounts "
        "separate from day-to-day accounts, and remove stale access rights on a defined cycle.",
        "Stolen or over-privileged credentials are a common initial-access path for ransomware.",
    ),
    "endpoint": (
        "Extend endpoint/security protection coverage to critical endpoints and servers, and "
        "define a process to monitor and act on security alerts within agreed timeframes.",
        "Endpoint visibility allows early detection of the tools and behaviours commonly used "
        "before encryption occurs.",
    ),
    "patching": (
        "Adopt a vulnerability management process that identifies and prioritises critical "
        "vulnerabilities and applies critical patches within a defined timeframe.",
        "Known, unpatched vulnerabilities are routinely exploited to deploy ransomware.",
    ),
    "network": (
        "Segment critical systems from general user networks and restrict unnecessary network "
        "connections and lateral-movement paths.",
        "Network segmentation limits the blast radius of an infection and slows lateral movement.",
    ),
    "monitoring": (
        "Collect security logs from critical systems and network devices and monitor security "
        "events continuously for suspicious activity.",
        "Gaps in logging and monitoring delay detection, increasing dwell time before "
        "encryption or data theft.",
    ),
    "incident_response": (
        "Develop and regularly exercise incident-response and business-continuity procedures, "
        "including a ransomware-specific response plan with defined roles and escalation paths.",
        "Organizations with tested response and continuity plans recover faster and with less "
        "data loss.",
    ),
    "awareness": (
        "Deliver regular security-awareness training and phishing-specific education so "
        "employees can recognise suspicious links, attachments and common ransomware delivery "
        "methods.",
        "Phishing remains one of the most common delivery mechanisms for ransomware.",
    ),
}

# Experimental knowledge-grounded sources (mini-RAG pilot).
KNOWLEDGE_BASE = {
    "backup_recovery": [
        "CIS Controls v8.1 - Control 11 (Data Recovery): establish and maintain data recovery practices.",
        "CISA Ransomware Guide - prepare: develop and test contingency plans including backups.",
    ],
    "iam": [
        "CIS Controls v8.1 - Control 4 (Controlled Use of Administrative Privileges) and Control 5 (Account Management).",
        "NIST IR 8374r1 - restrict and manage administrator privileges as a ransomware preparedness goal.",
    ],
    "endpoint": [
        "CIS Controls v8.1 - Control 13 (Network Monitoring and Defense) and Control 10 (Malware Defenses).",
    ],
    "patching": [
        "CIS Controls v8.1 - Control 7 (Continuous Vulnerability Management).",
        "NIST IR 8374r1 - keep systems patched as a ransomware preparedness goal.",
    ],
    "network": [
        "CIS Controls v8.1 - Control 3 (Data Protection) and Control 12 (Network Infrastructure Management).",
    ],
    "monitoring": [
        "CIS Controls v8.1 - Control 8 (Audit Log Management) and Control 13 (Network Monitoring and Defense).",
    ],
    "incident_response": [
        "CIS Controls v8.1 - Control 17 (Incident Response Management).",
        "NIST IR 8374r1 - ransomware-specific incident response planning and testing.",
    ],
    "awareness": [
        "CIS Controls v8.1 - Control 14 (Security Awareness and Skills Training).",
        "CISA Ransomware Guide - train employees to recognise phishing and common delivery vectors.",
    ],
}


def _overview_recommendations(dimension_scores, question_scores):
    """Generate per-dimension recommendations from actual weak dimensions."""
    items = []
    for dim in DIMENSIONS:
        dim_key = dim["key"]
        score = dimension_scores.get(dim_key, 100.0)
        if score < 60:
            rec, rationale = DIMENSION_RECOMMENDATIONS[dim_key]
            items.append(
                {
                    "dimension": dim["name"],
                    "dimension_key": dim_key,
                    "score": score,
                    "priority": "High" if score < 40 else "Medium",
                    "recommendation": rec,
                    "rationale": rationale,
                }
            )
    return items


def _quick_wins(question_scores):
    """Surface lowest-scoring individual questions as quick wins."""
    weak_q = [(k, v) for k, v in question_scores.items() if v <= 1]
    weak_q.sort(key=lambda kv: (kv[1], kv[0]))
    return weak_q[:4]


def generate_recommendations(answers, dimension_scores, question_scores, include_sources=True):
    """Build ready-to-display recommendations, fully derived from the assessment."""
    items = _overview_recommendations(dimension_scores, question_scores)

    quick_wins = _quick_wins(question_scores)
    quick_win_items = []
    for qkey, value in quick_wins:
        q = DIMENSION_BY_KEY[question_dimension(qkey)]["questions"]
        text = next((qq["text"] for qq in q if qq["key"] == qkey), qkey)
        quick_win_items.append(
            {
                "question": qkey,
                "text": text,
                "value": value,
                "dimension": DIMENSION_BY_KEY[question_dimension(qkey)]["name"],
                "recommendation": (
                    f"{text} is rated '{value}'. Address this control as a targeted quick win "
                    "within the related dimension programme."
                ),
            }
        )

    payload = {
        "strong_dimensions": [d["name"] for d in DIMENSIONS if dimension_scores.get(d["key"], 100) >= 80],
        "weak_dimensions": [d["name"] for d in DIMENSIONS if dimension_scores.get(d["key"], 100) < 60],
        "recommendations": items,
        "quick_wins": quick_win_items,
        "rag": {
            "status": "experimental/planned",
            "note": (
                "Recommendations are currently rule-based over assessed dimensions. A retrieval-"
                "augmented generation (RAG) pilot that grounds recommendations in an approved "
                "guidance corpus (CIS Controls v8.1, NIST IR 8374r1, CISA Ransomware Guide) is "
                "planned for the next research phase."
            ),
        },
    }
    if include_sources:
        payload["sources"] = {
            d["key"]: KNOWLEDGE_BASE.get(d["key"], [])
            for d in DIMENSIONS
            if dimension_scores.get(d["key"], 100) < 60
        }
    return payload


def question_dimension(qkey):
    from .questionnaire import QUESTION_TO_DIMENSION

    return QUESTION_TO_DIMENSION[qkey].get("key") if QUESTION_TO_DIMENSION[qkey] else ""


def full_dimension_names():
    return [(d["key"], d["name"]) for d in DIMENSIONS]