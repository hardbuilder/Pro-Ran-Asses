# Ransomware-readiness simulation study — reproducibility bundle

## Contents

- `paper/main.tex`: manuscript source.
- `paper/paper_built.pdf`: compiled manuscript with generated tables inlined.
- `sim.py`: seeded simulation phases (`main`, `shap`, `shift`, `scaling`, `ahp`, `nonlinear`).
- `pilot_analysis.py`: reproducible analysis of the 50-profile single-rater workbook (repeated CV, bootstrap AUC intervals and SHAP-style attributions).
- `analyze.py`, `build_tables.py`, `build_paper.py`: generate analysis summaries, figures, tables, and PDF.
- `data/expert_labeling_sheet_completed_AHP.xlsx`: source workbook containing 50 labeled profiles and all 28 AHP pairwise judgments.
- `results/`: result CSV/JSON files and package-version records.
- `figs/`: generated figures.

## AHP input and calculation

The AHP phase reads the workbook's `AHP_Weights` sheet and reconstructs the 8×8 reciprocal matrix directly from the 28 judgments. It computes principal-eigenvector weights and the consistency ratio from that matrix. Perturbation uses 2,000 independent multiplicative lognormal perturbations for each of σ = 0.2, 0.4, and 0.6, resetting reciprocal entries after each perturbation. The resulting values are saved to `results/ahp_perturbation.json`; the regenerated LaTeX table is `paper/tables/ahp_pert.tex`.

## Environment

The revision was prepared with Python 3.13.5 and these package versions (also recorded in `results/environment_versions.json`):

- numpy 2.3.5
- pandas 2.2.3
- scipy 1.17.0
- scikit-learn 1.8.0
- matplotlib 3.10.8
- openpyxl 3.1.5

Install with `python -m pip install -r requirements.txt`.

## Full rerun

From this directory, run `bash run_all.sh`. It clears generated simulation outputs and runs each seeded phase before regenerating analysis, tables, figures, and the PDF. Runtime depends on hardware because the experiment fits many cross-validated random forests. For a targeted AHP rerun only, use `python sim.py ahp`, followed by `python analyze.py`, `python build_tables.py`, and `python build_paper.py`. To rerun the separate 50-profile pilot analysis, run `python pilot_analysis.py`; its deterministic summary is written to `results/pilot_analysis.json`.

## Validation note for this delivered revision

All six computational phases (`main`, `shap`, `shift`, `scaling`, `ahp`, and `nonlinear`) were freshly rerun from the included scripts using the uploaded workbook, followed by `analyze.py`, `build_tables.py`, and `build_paper.py`. The run log is included at `results/full_run.log`. The regenerated outputs contain 1,200 main-grid rows, 80 SHAP rows, 100 shift rows, 250 scaling rows, 30 AHP weight-effect rows, and 400 nonlinear rows. The AHP phase uses the workbook's 28 judgments; the recalculated base consistency ratio is 0.0105996. The LaTeX build completed with no compilation errors, overfull boxes, or undefined references. The log contains minor underfull horizontal-box notices in the appendix questionnaire table; these do not clip or overflow text. Python warnings about undefined correlations in the equal-weight null scenario are expected because correlations against a constant vector are mathematically undefined; those values are treated as missing in the analysis. The manuscript text was checked against the regenerated SHAP summary outputs and updated where older numerical summaries remained. The pilot analysis was separately rerun from the exact uploaded workbook; its results are recorded in `results/pilot_analysis.json` and the corresponding manuscript metrics were updated to match.
