import { Link } from 'react-router-dom'
import { DIMENSION_META } from '../constants.js'

const DIM_ICONS = ['▦', '⌘', '⊞', '∿', '⌬', '◉', '⚑', '✎']

const TECH = [
  ['Frontend', 'React · Vite · Recharts'],
  ['Backend', 'Python · Flask · REST API'],
  ['Machine learning', 'scikit-learn · pandas · numpy'],
  ['Explainability', 'SHAP · joblib'],
]

const ARCH = [
  { label: '19-Question Survey', sub: 'UI · 0–3 scale', hl: false },
  { label: 'Framework Scoring', sub: 'configurable weights', hl: false },
  { label: 'ML Prediction', sub: 'LR · Random Forest', hl: true },
  { label: 'SHAP Explanation', sub: 'local + global', hl: false },
  { label: 'Dashboard & Report', sub: 'results · recommendations', hl: false },
]

export default function Home() {
  return (
    <div>
      <section className="hero">
        <div className="hero-title">
          Ransomware <span className="grad-text">Readiness Assessment</span>
        </div>
        <div className="hero-sub" style={{ fontStyle: 'italic' }}>
          “An Explainable AI Approach to Organizational Ransomware Readiness
          Assessment”
        </div>
        <p className="muted" style={{ maxWidth: 780 }}>
          This system evaluates organizational ransomware preparedness using
          framework-grounded scoring, machine-learning classification, and
          explainable AI. It is a defensive readiness-assessment research
          prototype — it does not detect, simulate, or exploit ransomware, and
          it does not guarantee protection.
        </p>
        <div className="btn-group" style={{ marginTop: 10 }}>
          <Link to="/assessment" className="btn primary row">▶ Start Assessment</Link>
          <Link to="/methodology" className="btn ghost row">View Methodology</Link>
        </div>
        <div style={{ marginTop: 14 }} className="flex wrap">
          {['Framework-grounded scoring', 'Logistic Regression', 'Random Forest', 'SHAP explainability', 'Defensive recommendations'].map((t) => (
            <span className="chip accent" key={t}>{t}</span>
          ))}
        </div>
      </section>

      <h2 className="card-title" style={{ marginTop: 26 }}>8 Assessment Dimensions</h2>
      <div className="grid dims">
        {Object.entries(DIMENSION_META).map(([key, meta], i) => (
          <div className="dim-card" key={key}>
            <div className="dim-ico" style={{ color: meta.color }}>{DIM_ICONS[i % DIM_ICONS.length]}</div>
            <div>
              <h4>{meta.name}</h4>
              <p>Rated across {key.includes('incident') ? 3 : key.includes('backup') ? 3 : key.includes('iam') ? 3 : 2} questions, each scored 0–3.</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid cols-2" style={{ marginTop: 26 }}>
        <div className="card">
          <div className="card-title">Technology Stack</div>
          <table>
            <tbody>
              {TECH.map(([layer, stack]) => (
                <tr key={layer}>
                  <td style={{ color: '#22d3ee', width: '30%' }}>{layer}</td>
                  <td>{stack}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-title">System Architecture</div>
          <div className="arch">
            {ARCH.map((node, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && <span className="arch-arrow">→</span>}
                <div className={`arch-node${node.hl ? ' hl' : ''}`}>
                  {node.label}
                  <small>{node.sub}</small>
                </div>
              </div>
            ))}
          </div>
          <div className="notice" style={{ marginTop: 14 }}>
            The live demonstration runs every assessment through the actual
            backend: scoring → model prediction → SHAP explanation →
            recommendations.
          </div>
        </div>
      </div>

      <div className="disclaimer">
        <strong>Research integrity note:</strong> The current dataset is
        synthetic with provisional proxy labels. Reported model metrics and any
        SHAP insights are preliminary results for the prototype, not validated
        research findings. Independent expert-labelled data, expert-derived
        weights, and final validation are planned next-phase work.
      </div>
    </div>
  )
}