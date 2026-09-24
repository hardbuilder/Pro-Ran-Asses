"""Questionnaire definition for the Ransomware Readiness Assessment.

Contains the 19 questions grouped into 8 readiness dimensions.
Question keys are stable identifiers (e.g. "Q1.1") used across scoring,
machine learning and explainability.
"""

QUESTION_KEY_ORDER = [
    "Q1.1", "Q1.2", "Q1.3",
    "Q2.1", "Q2.2", "Q2.3",
    "Q3.1", "Q3.2",
    "Q4.1", "Q4.2",
    "Q5.1", "Q5.2",
    "Q6.1", "Q6.2",
    "Q7.1", "Q7.2", "Q7.3",
    "Q8.1", "Q8.2",
]

DIMENSIONS = [
    {
        "id": "d1",
        "key": "backup_recovery",
        "name": "Backup & Recovery",
        "description": "Offline/immutable backups, defined backup schedules and tested restoration.",
        "questions": [
            {
                "key": "Q1.1",
                "text": "Are offline or immutable backups maintained for critical systems?",
            },
            {
                "key": "Q1.2",
                "text": "Are critical data and systems backed up according to a defined backup schedule?",
            },
            {
                "key": "Q1.3",
                "text": "Has full restoration from backup been tested in the last 12 months?",
            },
        ],
    },
    {
        "id": "d2",
        "key": "iam",
        "name": "IAM / Privileged Access",
        "description": "MFA coverage, privileged-account separation and periodic access review.",
        "questions": [
            {
                "key": "Q2.1",
                "text": "Is MFA enforced for remote access and privileged accounts?",
            },
            {
                "key": "Q2.2",
                "text": "Are privileged accounts separated from normal user accounts?",
            },
            {
                "key": "Q2.3",
                "text": "Are user and privileged access rights regularly reviewed and removed when no longer required?",
            },
        ],
    },
    {
        "id": "d3",
        "key": "endpoint",
        "name": "Endpoint Security",
        "description": "Endpoint protection coverage and active monitoring of alerts.",
        "questions": [
            {
                "key": "Q3.1",
                "text": "Are security/endpoint protection tools deployed on critical endpoints and servers?",
            },
            {
                "key": "Q3.2",
                "text": "Are endpoint security alerts monitored and acted upon?",
            },
        ],
    },
    {
        "id": "d4",
        "key": "patching",
        "name": "Patch & Vulnerability Management",
        "description": "Vulnerability identification/prioritisation and patching within a defined timeframe.",
        "questions": [
            {
                "key": "Q4.1",
                "text": "Are critical security vulnerabilities identified and prioritized?",
            },
            {
                "key": "Q4.2",
                "text": "Are critical security patches applied within a defined timeframe?",
            },
        ],
    },
    {
        "id": "d5",
        "key": "network",
        "name": "Network Segmentation",
        "description": "Separation of critical systems and restriction of lateral movement paths.",
        "questions": [
            {
                "key": "Q5.1",
                "text": "Are critical systems separated from general user networks?",
            },
            {
                "key": "Q5.2",
                "text": "Are unnecessary network connections and lateral movement paths restricted?",
            },
        ],
    },
    {
        "id": "d6",
        "key": "monitoring",
        "name": "Security Monitoring",
        "description": "Log collection and continuous monitoring of security events.",
        "questions": [
            {
                "key": "Q6.1",
                "text": "Are security logs collected from critical systems and network devices?",
            },
            {
                "key": "Q6.2",
                "text": "Are security events continuously or regularly monitored for suspicious activity?",
            },
        ],
    },
    {
        "id": "d7",
        "key": "incident_response",
        "name": "Incident Response & Business Continuity",
        "description": "Ransomware-specific IR plan, regular testing and business continuity.",
        "questions": [
            {
                "key": "Q7.1",
                "text": "Is there a documented ransomware-specific incident-response plan?",
            },
            {
                "key": "Q7.2",
                "text": "Are incident-response procedures regularly tested or exercised?",
            },
            {
                "key": "Q7.3",
                "text": "Does the organization have a business-continuity/recovery plan for critical operations?",
            },
        ],
    },
    {
        "id": "d8",
        "key": "awareness",
        "name": "Security Awareness",
        "description": "Regular security-awareness training and anti-phishing education.",
        "questions": [
            {
                "key": "Q8.1",
                "text": "Do employees receive regular cybersecurity/security-awareness training?",
            },
            {
                "key": "Q8.2",
                "text": "Are employees trained to recognize phishing, suspicious links, attachments, and other common ransomware delivery methods?",
            },
        ],
    },
]

SCORE_OPTIONS = [
    {"value": 0, "label": "Not implemented"},
    {"value": 1, "label": "Partially implemented / ad hoc"},
    {"value": 2, "label": "Mostly implemented / defined"},
    {"value": 3, "label": "Fully implemented / consistently maintained and tested"},
]

DIMENSION_BY_KEY = {dim["key"]: dim for dim in DIMENSIONS}
QUESTION_BY_KEY = {q["key"]: q for dim in DIMENSIONS for q in dim["questions"]}
QUESTION_TO_DIMENSION = {q["key"]: dim for dim in DIMENSIONS for q in dim["questions"]}
DIMENSION_KEY_ORDER = [dim["key"] for dim in DIMENSIONS]


def human_feature_name(qkey):
    """Return a human-readable feature name such as 'Backup & Recovery — Q1.1'."""
    q = QUESTION_BY_KEY.get(qkey)
    if not q:
        return qkey
    dim = QUESTION_TO_DIMENSION[qkey]
    return f"{dim['name']} — {qkey}"


def feature_name_map():
    """Map every question key to its human-readable feature name."""
    return {qkey: human_feature_name(qkey) for qkey in QUESTION_KEY_ORDER}