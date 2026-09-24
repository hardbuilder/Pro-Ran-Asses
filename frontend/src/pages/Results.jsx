import { Link, useNavigate } from 'react-router-dom'
import { useAssessment } from '../store/AssessmentContext.jsx'
import { CLASS_META, DIMENSION_META } from '../constants.js'
import { StatCard, Badge, Notice, Chip } from '../components/ui.jsx'
import DimensionRadar from '../charts/DimensionRadar.jsx'
import DimensionBar from '../charts/DimensionBar.jsx'

export default function Results() {
  const { assessment } = useAssessment()
  const navigate = useNavigate()

  if (!assessment) {
    return (
      <div>
        <Notice tone="warn">
          No assessment has been calculated yet.{' '}
          <Link to="/assessment">Start the assessment</Link> to generate results.
        </Notice>
        <button className="btn primary mt-4" onClick={() => navigate('/assessment')}>
          Go to Assessment
        </button>
      </div>
    )
  }

  const {
    overall_score,
    classification,
    framework_score,
    dimension_scores,
    ml_prediction,
    ml_model,
    model_probabilities,
    weak_dimensions,
    recommendations,
  } = assessment

  const cls = CLASS_META[classification] || { color: '#22d3ee' }

  return (
    <div>
      <div className="flex-between wrap mb-4">
        <h1 style={{ margin: 0 }}>Results Dashboard</h1>
        <Badge tone={classification}>{classification} Readiness</Badge>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 2.2fr', marginBottom: 20 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card-title">Overall Readiness Score</div>
          <div className="score-ring">
            <div
              style={{
                width: 170,
                height: 170,
                background:
                  `conic-gradient(${cls.color} ${(overall_score / 100) * 360}deg, rgba(255,255,255,0.07) 0deg)`,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <div
                style={{
                  width: 148,
                  height: 148,
                  borderRadius: '50%',
                  background: '#0d1530',
                  display: 'grid',
                  placeItems: 'center',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1 }}>{overall_score}</div>
                  <div className="muted" style={{ fontSize: 12 }}>/ 100</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex wrap">
            <span className="chip">Framework score: {framework_score.equal}</span>
            <span className="chip accent">ML ({ml_model}): {ml_prediction}</span>
          </div>
          <div className="muted" style={{ fontSize: 12.5 }}>
            Weak dimensions: {weak_dimensions.length > 0 ? weak_dimensions.join(', ') : 'none'}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Readiness Classification & Predictions</div>
          <div className="grid cols-3" style={{ marginBottom: 14 }}>
            <StatCard
              label="Classification"
              value={<Badge tone={classification}>{classification}</Badge>}
              note="0–49 Low · 50–79 Moderate · 80–100 High"
            />
            <StatCard
              label="Framework-grounded score"
              value={framework_score.equal}
              note="equal weighting · expert AHP weights pending"
            />
            <StatCard
              label="ML prediction"
              value={<Badge tone={ml_prediction}>{ml_prediction}</Badge>}
              note={`${ml_model}`}
            />
          </div>
          <div className="card-title" style={{ marginTop: 6 }}>Model probabilities</div>
          <div style={{ display: 'flex', gap: 20 }}>
            {Object.entries(model_probabilities).map(([label, prob]) => {
              const meta = CLASS_META[label]
              const pct = Math.round(prob * 100)
              return (
                <div key={label} style={{ flex: 1 }}>
                  <div className="flex-between" style={{ marginBottom: 4 }}>
                    <span style={{ color: meta.color, fontSize: 13, fontWeight: 600 }}>{label}</span>
                    <span className="mono" style={{ fontSize: 12 }}>{pct}%</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${pct}%`, background: meta.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid cols-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">Dimension Radar</div>
          <DimensionRadar dimensionScores={dimension_scores} />
        </div>
        <div className="card">
          <div className="card-title">Dimension Scores (0–100)</div>
          <DimensionBar dimensionScores={dimension_scores} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">Dimension Breakdown</div>
        <div className="grid cols-4">
          {Object.entries(dimension_scores).map(([key, value]) => {
            const meta = DIMENSION_META[key] || { name: key }
            return (
              <div className="stat" key={key}>
                <div className="stat-label" style={{ color: meta.color }}>{meta.name}</div>
                <div className="stat-value" style={{ color: meta.color }}>{Math.round(value)}</div>
                <div className="stat-note">/ 100</div>
              </div>
            )
          })}
        </div>
      </div>

      {recommendations && recommendations.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">Top Recommendations ({recommendations.length})</div>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            {recommendations.slice(0, 4).map((r, i) => (
              <li key={i} className="muted" style={{ marginBottom: 6, fontSize: 13.5 }}>
                <strong style={{ color: '#dfe7f8' }}>{r.dimension}:</strong> {r.recommendation}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="btn-group" style={{ marginBottom: 22 }}>
        <Link to="/explain" className="btn primary row">✧ View AI Explanation</Link>
        <Link to="/recommendations" className="btn row">⚑ View Recommendations</Link>
        <Link to="/report" className="btn ghost row">🖨 Generate Assessment Report</Link>
      </div>

      <div className="disclaimer">
        <strong>About this prototype:</strong> {assessment.disclaimer}
      </div>
    </div>
  )
}