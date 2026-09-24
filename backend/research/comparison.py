"""Infrastructure for the future 'framework weights vs AI importance' experiment.

Compares the framework-grounded expert-derived weight ranking against the
SHAP feature-importance ranking using Spearman's rank correlation and
Kendall's tau.

IMPORTANT: Expert-derived AHP weights are NOT yet available. This module only
provides the machinery (it returns PENDING when inputs are missing). No
correlation values are invented.
"""

from scipy.stats import kendalltau, spearmanr


def _rank(ordered_keys):
    """Return {key: rank} with 1 = most important."""
    return {k: i + 1 for i, k in enumerate(ordered_keys)}


def compare_weight_and_shap_rankings(weight_ranks, shap_ranks):
    """Returns Spearman rho and Kendall tau when both rankings are available.

    weight_ranks: {question_key: rank} from expert-derived weights (or None)
    shap_ranks:   {question_key: rank} from SHAP feature importance (or None)
    """
    if not weight_ranks or not shap_ranks:
        return {
            "status": "pending",
            "message": "Pending expert-derived weighting study. Correlation values will be "
            "computed when AHP-based expert weights become available.",
            "spearman": None,
            "kendall": None,
        }

    keys = sorted(set(weight_ranks) & set(shap_ranks))
    a = [weight_ranks[k] for k in keys]
    b = [shap_ranks[k] for k in keys]
    rho, _ = spearmanr(a, b)
    tau, _ = kendalltau(a, b)
    return {
        "status": "computed",
        "spearman": float(rho),
        "kendall": float(tau),
        "n_shared": len(keys),
    }