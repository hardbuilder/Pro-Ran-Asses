"""Synthetic organizational profile generator.

Generates ~200 PLAUSIBLE synthetic profiles of security readiness.

Design:
  - A latent organisational 'maturity' drives 8 correlated dimension factors.
  - Question-level features are drawn from their dimension factor plus noise
    and discretized to 0..3, so practices naturally co-vary (e.g. strong
    monitoring tends to co-occur with strong backup/incident-response
    practice).
  - Provisional proxy labels are derived from a SEPARATE latent index (a
    different weight mix + noise + threshold) than the equal-weighted
    framework scoring formula used by the live assessor.

Documented limitation:
  The current dataset is synthetic and uses provisional proxy labels.
  Independent expert-labelled data will be incorporated in the next research
  phase. Do NOT treat resulting metrics as validated research results.
"""

import os

import numpy as np
import pandas as pd

from assessment.questionnaire import QUESTION_KEY_ORDER

N_SAMPLES = 200
SEED = 42

OUTPUT_CSV = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "synthetic_data.csv")


# Question -> owning dimension index (0-based), aligned with QUESTION_KEY_ORDER
def _question_dimension_index(qkey):
    return int(qkey.split(".")[0][1]) - 1


def generate_profiles(n=N_SAMPLES, seed=SEED):
    rng = np.random.default_rng(seed)

    # Latent overall maturity
    maturity = rng.normal(0.0, 1.2, size=n)

    # Dimension factors correlated with overall maturity
    dim_corrs = np.array([0.80, 0.78, 0.72, 0.74, 0.68, 0.76, 0.79, 0.70])
    noise_dim = rng.normal(0.0, 1.0, size=(n, 8))
    dim_factors = dim_corrs * maturity[:, None] + np.sqrt(1 - dim_corrs ** 2) * noise_dim

    qkeys = list(QUESTION_KEY_ORDER)
    n_feat = len(qkeys)
    qnoise = rng.normal(0.0, 0.38, size=(n, n_feat))
    latent = np.zeros((n, n_feat))
    for i, qkey in enumerate(qkeys):
        d = _question_dimension_index(qkey)
        # Question strength: each question is a noisy view of its dimension factor
        latent[:, i] = 0.9 * dim_factors[:, d] + qnoise[:, i]

    # discretize latent -> {0,1,2,3}
    scores = np.zeros((n, n_feat), dtype=int)
    for i in range(n_feat):
        col = latent[:, i]
        q1, q2, q3 = np.percentile(col, [18, 45, 72])  # per-question thresholds
        scores[:, i] = np.select(
            [col < q1, col < q2, col < q3],
            [0, 1, 2],
            default=3,
        )

    # Provisional proxy labels from a DIFFERENT latent index than the scoring formula.
    axes_w = np.array([0.30, 0.22, 0.12, 0.14, 0.08, 0.16, 0.24, 0.14])  # (backup, iam, ...)
    label_index = (
        0.55 * maturity
        + 0.06 * (dim_factors @ axes_w)
        + rng.normal(0.0, 0.30, size=n)
    )

    labels_raw = np.where(label_index < -0.35, 0, np.where(label_index > 0.42, 2, 1))

    # inject label noise so the mapping is not trivially separable
    flip_mask = rng.random(n) < 0.06
    for j in range(n):
        if flip_mask[j]:
            labels_raw[j] = int(rng.integers(0, 3))

    label_names = np.where(labels_raw == 0, "Low", np.where(labels_raw == 2, "High", "Moderate"))

    df = pd.DataFrame(scores, columns=qkeys)
    df["label_raw"] = labels_raw
    df["label"] = label_names
    df["latent_maturity"] = np.round(maturity, 3)
    return df


def save_dataset(df, path=OUTPUT_CSV):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    df.to_csv(path, index=False)
    return path


def load_dataset(path=OUTPUT_CSV):
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Dataset not found at {path}. Run the dataset generator / model training first."
        )
    return pd.read_csv(path)


if __name__ == "__main__":
    data = generate_profiles()
    out = save_dataset(data)
    print(f"Generated {len(data)} synthetic organizational profiles -> {out}")
    print(data["label"].value_counts().to_string())