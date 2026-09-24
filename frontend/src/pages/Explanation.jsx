import { Link, useNavigate } from 'react-router-dom'
import { useAssessment } from '../store/AssessmentContext.jsx'
import ShapBars from '../charts/ShapBars.jsx'
import { StatCard, Badge, Notice, Chip } from '../components/ui.jsx'

export default function Explanation() {
  const { assessment } = useAssessment()
  const navigate = useNavigate()

  if (!assessment) {
    return (
      <div>
        <Notice tone="warn">
          No assessment has been calculated yet.{' '}
          <Link to="/assessment">Start the assessment</Link> to generate a SHAP
          explanation.
        </Notice>
        <button className="btn primary mt-4" onClick={() => navigate('/assessment')}>
          Go to Assessment
        </button>
      </div>
    )
  }

  const { feature_importance, shap_values, ml_prediction, ml_model } = assessment

  const local = Array.isArray(feature_importance?.contributions)
    ? feature_importance.contributions
    : []
  const globalAll = shap_values?.contributions || []
  const method = feature_importance?.label || shap_values?.label || 'SHAP'

  const isFallback = feature_importance?.type === 'global_fallback' || !shap_values?.additive

  return (
    <div>
      <h1 className="mb-2">Why did the AI make this prediction?</h1>
      <p className="muted mb-4" style={{ maxWidth: 820 }}>
        SHAP values indicate how individual features contributed to the model's
        prediction for this assessment. Bars on the right push the predicted
        class probability up; bars on the left push it down.
      </p>

      <div className="grid cols-3" style={{ marginBottom: 20 }}>
        <StatCard label="ML model" value={ml_model} note="model used for this assessment" />
        <StatCard label="Prediction" value={<Badge tone={ml_prediction}>{ml_prediction}</Badge>} note="predicted class" />
        <StatCard
          label="Explanation method"
          value={<span style={{ fontSize: 16 }}>{method}</span>}
          note={isFallback ? 'global fallback is being shown' : 'local additive explanation'}
        />
      </div>

      {isFallback && (
        <Notice tone="warn">
          Local SHAP values were not available for this request. The global
          feature-importance fallback is shown below (mean |SHAP| over the
          synthetic training sample).
        </Notice>
      )}

      {shap_values?.additive && (
        <Notice tone="">
          Additive property: base value {shap_values.base_value.toFixed(3)} + sum of
          contributions = {shap_values.predicted_probability.toFixed(3)} — the model's
          probability for the <strong>{shap_values.predicted_class}</strong> class.
        </Notice>
      )}

      <div className="grid cols-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">Local Contribution — Top Factors</div>
          <ShapBars contributions={local} />
        </div>
        <div className="card">
          <div className="card-title">All Feature Contributions (local)</div>
          <ShapBars contributions={globalAll} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">What this means</div>
        <p className="muted" style={{ fontSize: 13.5, maxWidth: 860 }}>
          Each factor represents one of the 19 questionnaire items. A positive
          value means that factor supported the predicted readiness class;
          a negative value means it pushed the prediction towards another class.
          This lets a reviewer see exactly <em>which questionnaire answers</em> the
          model leaned on.
        </p>
        <div className="flex wrap mt-4">
          <Chip tone="done">Framework-grounded score available</Chip>
          <Chip tone="accent">SHAP: local + global</Chip>
          <Chip tone="pending">Framework-vs-SHAP ranking: pending expert weights</Chip>
        </div>
      </div>

      <div className="btn-group">
        <Link to="/results" className="btn row">← Back to Results</Link>
        <Link to="/recommendations" className="btn primary row">⚑ View Recommendations</Link>
      </div>
    </div>
  )
}