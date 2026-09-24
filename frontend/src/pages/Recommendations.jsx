import { Link, useNavigate } from 'react-router-dom'
import { useAssessment } from '../store/AssessmentContext.jsx'
import { StatCard, Notice, Chip } from '../components/ui.jsx'
import { DIMENSION_META } from '../constants.js'

export default function Recommendations() {
  const { assessment } = useAssessment()
  const navigate = useNavigate()

  if (!assessment) {
    return (
      <div>
        <Notice tone="warn">
          No assessment has been calculated yet.{' '}
          <Link to="/assessment">Start the assessment</Link> to generate recommendations.
        </Notice>
        <button className="btn primary mt-4" onClick={() => navigate('/assessment')}>
          Go to Assessment
        </button>
      </div>
    )
  }

  const { recommendations = [], quick_wins = [], dimension_scores, overall_score, classification, sources = {}, rag } = assessment

  const strongDims = Object.entries(dimension_scores).filter(([, v]) => v >= 80).map(([k]) => k)

  return (
    <div>
      <h1 className="mb-2">Defensive Ransomware Recommendations</h1>
      <p className="muted mb-4" style={{ maxWidth: 820 }}>
        Recommendations are generated from the actual weak dimensions of this
        assessment. They are defensive guidance only.
      </p>

      <div className="grid cols-3" style={{ marginBottom: 20 }}>
        <StatCard label="Overall score" value={Math.round(overall_score)} note="/ 100" />
        <StatCard label="Classification" value={classification} />
        <StatCard label="Recommendations" value={recommendations.length} note="from weak dimensions" />
      </div>

      {strongDims.length > 0 && (
        <Notice tone="">
          <strong>Strengths to maintain:</strong>{' '}
          {strongDims.map((k) => DIMENSION_META[k]?.name || k).join(', ')}
        </Notice>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">Priority Recommendations</div>
        {recommendations.length === 0 ? (
          <p className="muted">No weak dimensions detected — no priority recommendations.</p>
        ) : (
          recommendations.map((r, i) => (
            <div className={`rec ${r.priority === 'High' ? 'high' : 'medium'}`} key={i}>
              <div className="rec-title">
                {r.dimension} <span className="chip">{r.priority} priority</span>{' '}
                <span className="chip accent">{Math.round(r.score)} / 100</span>
              </div>
              <div className="rec-body">{r.recommendation}</div>
              <div className="rec-why"><strong>Why:</strong> {r.rationale}</div>
            </div>
          ))
        )}
      </div>

      {quick_wins.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">Targeted Quick Wins (weakest individual questions)</div>
          {quick_wins.map((q, i) => (
            <div className="rec medium" key={i}>
              <div className="rec-title">[{q.question}] <span className="muted" style={{ fontWeight: 400 }}>{q.dimension}</span></div>
              <div className="rec-body">{q.text}</div>
              <div className="rec-why"><strong>Current rating:</strong> {q.value} / 3 — {q.recommendation}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-title">Guidance Sources</div>
        {Object.keys(sources).length === 0 ? (
          <p className="muted" style={{ fontSize: 13 }}>No weak dimensions, so no sources were pulled.</p>
        ) : (
          Object.entries(sources).map(([dimKey, refs]) => (
            <div key={dimKey} style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 4 }}>
                {DIMENSION_META[dimKey]?.name || dimKey}
              </div>
              <ul className="muted" style={{ margin: 0, paddingLeft: 18, fontSize: 12.5 }}>
                {refs.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          ))
        )}
        <div className="notice" style={{ marginTop: 12 }}>
          <strong>RAG status:</strong> {rag?.note || 'Experimental / planned'}. Sources above are
          from an embedded defensive-guidance knowledge base (CIS Controls v8.1, NIST IR 8374r1,
          CISA Ransomware Guide) used as a mini-RAG pilot.
        </div>
      </div>

      <div className="btn-group mt-4">
        <Link to="/explain" className="btn row">← Back to AI Explanation</Link>
        <Link to="/report" className="btn primary row">🖨 Generate Assessment Report</Link>
      </div>
    </div>
  )
}