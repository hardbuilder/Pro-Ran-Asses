import { Link } from 'react-router-dom'
import { useAssessment } from '../store/AssessmentContext.jsx'
import ShapBars from '../charts/ShapBars.jsx'
import { Badge, Notice } from '../components/ui.jsx'
import { DIMENSION_META } from '../constants.js'

function Row({ label, value }) {
  return (
    <tr>
      <td style={{ color: '#8e9bbd', width: '38%' }}>{label}</td>
      <td style={{ fontWeight: 600 }}>{value}</td>
    </tr>
  )
}

export default function Report() {
  const { assessment } = useAssessment()

  return (
    <div>
      <div className="no-print flex-between wrap mb-4">
        <h1 style={{ margin: 0 }}>Assessment Report</h1>
        <div className="btn-group">
          <button className="btn primary row" onClick={() => window.print()}>
            🖨 Print / Save as PDF
          </button>
          <Link to="/results" className="btn ghost row">Back to Results</Link>
        </div>
      </div>

      {!assessment ? (
        <Notice tone="warn">
          No assessment has been calculated yet. <Link to="/assessment">Start an assessment</Link>{' '}
          to generate a report.
        </Notice>
      ) : (
        <div className="report-print">
          <div className="flex-between wrap" style={{ marginBottom: 6 }}>
            <div className="page-title">Ransomware Readiness Assessment Report</div>
            <span className="mono muted" style={{ fontSize: 12 }}>
              {new Date(assessment.timestamp || Date.now()).toLocaleString()}
            </span>
          </div>

          <div className="flex-between wrap mb-4">
            <div>
              <h2 className="mb-0">{Math.round(assessment.overall_score)} / 100</h2>
              <div className="muted">Overall framework-grounded readiness score</div>
            </div>
            <Badge tone={assessment.classification}>{assessment.classification} Readiness</Badge>
          </div>

          <div className="meta-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, margin: '12px 0' }}>
            <div className="stat"><div className="stat-label">Framework score</div><div className="stat-value" style={{ fontSize: 18 }}>{assessment.framework_score.equal}</div></div>
            <div className="stat"><div className="stat-label">ML prediction ({assessment.ml_model})</div><div className="stat-value" style={{ fontSize: 18 }}>{assessment.ml_prediction}</div></div>
            <div className="stat"><div className="stat-label">Weak dimensions</div><div className="stat-value" style={{ fontSize: 18 }}>{assessment.weak_dimensions.length}</div></div>
            <div className="stat"><div className="stat-label">ML confidence</div><div className="stat-value" style={{ fontSize: 18 }}>{Math.round(assessment.ml_confidence * 100)}%</div></div>
          </div>

          <div className="grid cols-3" style={{ margin: '14px 0' }}>
            {Object.entries(assessment.model_probabilities).map(([label, prob]) => (
              <div key={label}>
                <div className="flex-between" style={{ marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
                  <span className="mono" style={{ fontSize: 12 }}>{Math.round(prob * 100)}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${prob * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title">Dimension Scores</div>
            <table>
              <thead>
                <tr><th>Dimension</th><th>Score (0–100)</th><th>Level</th></tr>
              </thead>
              <tbody>
                {Object.entries(assessment.dimension_scores).map(([key, value]) => (
                  <tr key={key}>
                    <td>{(DIMENSION_META[key] || {}).name || key}</td>
                    <td className="mono">{value}</td>
                    <td>
                      <Badge tone={value < 50 ? 'Low' : value < 80 ? 'Moderate' : 'High'}>
                        {value < 50 ? 'Low' : value < 80 ? 'Moderate' : 'High'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-title">Model Prediction & Explainability (SHAP)</div>
            <table>
              <tbody>
                <Row label="ML model" value={assessment.ml_model} />
                <Row label="Predicted class" value={assessment.ml_prediction} />
                <Row label="Probabilities" value={Object.entries(assessment.model_probabilities).map(([l, p]) => `${l}: ${Math.round(p * 100)}%`).join(' · ')} />
                <Row
                  label="Explanation method"
                  value={assessment.shap_values?.label || assessment.feature_importance?.label || 'n/a'}
                />
              </tbody>
            </table>
            <div style={{ marginTop: 14 }}>
              <div className="card-title">Top Contributing Factors</div>
              <ShapBars contributions={(assessment.feature_importance?.contributions || assessment.shap_values?.contributions || []).slice(0, 8)} />
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-title">Recommendations</div>
            {assessment.recommendations.length === 0 ? (
              <p className="muted">No weak dimensions — no priority recommendations.</p>
            ) : (
              assessment.recommendations.map((r, i) => (
                <div className="rec" key={i}>
                  <div className="rec-title">{r.dimension}</div>
                  <div className="rec-body">{r.recommendation}</div>
                </div>
              ))
            )}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-title">Methodology Note</div>
            <p className="muted" style={{ fontSize: 12.5 }}>
              Scoring uses an equal-weight (configurable) framework-grounded engine mapped to
              0–100. ML models are Logistic Regression and Random Forest with stratified 5-fold
              cross-validation. SHAP (TreeExplainer / LinearExplainer) provides feature-level
              explanation. Expert-derived AHP weights, framework-vs-SHAP ranking comparison,
              and expert-labelled validation are pending next-phase research.
            </p>
          </div>

          <div className="disclaimer">
            <strong>Synthetic / prototype data disclaimer:</strong>{' '}
            {assessment.disclaimer}
          </div>
        </div>
      )}
    </div>
  )
}