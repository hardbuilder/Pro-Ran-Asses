import { useEffect, useState } from 'react'
import { api } from '../services/api.js'
import { Spinner, ErrorBox, Notice, Chip } from '../components/ui.jsx'
import ConfusionMatrix from '../charts/ConfusionMatrix.jsx'

const MODEL_LABELS = {
  logistic_regression: 'Logistic Regression',
  random_forest: 'Random Forest',
  majority_baseline: 'Majority-Class Baseline',
}

export default function ModelEvaluation() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .modelInfo()
      .then((info) => {
        if (info.status === 'untrained') {
          setError(info.error || 'Models not trained.')
          return
        }
        setData(info)
      })
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <ErrorBox message={error} />
  if (!data) return <Spinner text="Loading model evaluation…" />

  const { evaluation, model_card } = data
  const rows = [
    evaluation.models.logistic_regression,
    evaluation.models.random_forest,
    evaluation.models.majority_baseline,
  ]

  return (
    <div>
      <h1 className="mb-2">Preliminary Model Evaluation</h1>
      <p className="muted mb-4" style={{ maxWidth: 820 }}>
        Machine-learning models are evaluated on the synthetic organizational
        profile dataset using stratified 5-fold cross-validation.
      </p>

      <Notice tone="warn">
        <strong>Preliminary evaluation using synthetic proxy labels.</strong> The
        numbers below are prototype results and are <em>not</em> validated research
        findings. Independent expert-labelled data will be incorporated in the
        next research phase.
      </Notice>

      <div className="grid cols-3" style={{ margin: '18px 0' }}>
        <div className="stat">
          <div className="stat-label">Samples (synthetic profiles)</div>
          <div className="stat-value">{model_card.n_samples}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Features (questionnaire)</div>
          <div className="stat-value">{model_card.n_features}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Cross-validation</div>
          <div className="stat-value">{evaluation.cv.n_folds}-fold</div>
          <div className="stat-note">stratified · shuffled · seed {evaluation.cv.random_state}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">Model Comparison</div>
        <table>
          <thead>
            <tr>
              <th>Model</th>
              <th>Accuracy</th>
              <th>Macro-F1</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(MODEL_LABELS).map((key) => {
              const m = evaluation.models[key]
              return (
                <tr key={key}>
                  <td style={{ fontWeight: 600 }}>{MODEL_LABELS[key]}</td>
                  <td className="mono">{m.accuracy}%</td>
                  <td className="mono">{m.macro_f1}%</td>
                  <td className="muted" style={{ fontSize: 12 }}>
                    {m.note || `5-fold CV · multiclass ${evaluation.classes.join(' / ')}`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
          Accuracy = correctly classified / total. Macro-F1 = unweighted mean of per-class F1
          scores (equally weights rare classes).
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <div className="card-title">Confusion Matrix — Logistic Regression</div>
          <ConfusionMatrix
            matrix={evaluation.confusion_matrices.logistic_regression}
            classes={evaluation.classes}
          />
          <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            Aggregated over all 5 folds. Rows = true class, columns = predicted class.
          </div>
        </div>
        <div className="card">
          <div className="card-title">Confusion Matrix — Random Forest</div>
          <ConfusionMatrix
            matrix={evaluation.confusion_matrices.random_forest}
            classes={evaluation.classes}
          />
          <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            Aggregated over all 5 folds. Rows = true class, columns = predicted class.
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-title">Dataset & Label Detail</div>
        <p style={{ fontSize: 13.5, maxWidth: 900 }}>
          The dataset contains {model_card.n_samples} synthetic organizational
          profiles. Each profile is described by {model_card.n_features} questionnaire
          features scored 0–3, with provisional proxy labels (Low / Moderate / High).
          Features are correlated through a latent maturity model so the profiles
          resemble plausible organizations rather than independent random vectors.
        </p>
        <div className="flex wrap mt-4">
          <Chip tone="done">LR + RF + baseline</Chip>
          <Chip tone="done">5-fold stratified CV</Chip>
          <Chip tone="accent">SHAP global importance</Chip>
          <Chip tone="pending">expert-labelled data: next phase</Chip>
        </div>
      </div>

      <div className="disclaimer">
        <strong>Research disclaimer:</strong> {evaluation.note}
      </div>
    </div>
  )
}