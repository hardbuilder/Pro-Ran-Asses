import { useEffect, useState } from 'react'
import { api } from '../services/api.js'
import { Spinner, ErrorBox, Chip, Notice } from '../components/ui.jsx'

export default function Methodology() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .methodology()
      .then(setData)
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <ErrorBox message={error} />
  if (!data) return <Spinner text="Loading methodology…" />

  const { pipeline, expert_validation, rag, weighting_study } = data

  return (
    <div>
      <h1 className="mb-2">Research Methodology</h1>
      <p className="muted mb-4" style={{ maxWidth: 820 }}>
        The research pipeline combines framework-grounded scoring, machine
        learning, and SHAP explainability. The diagram below shows the runtime
        data path.
      </p>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">Architecture (runtime data path)</div>
        <div className="arch">
          {['Questionnaire', 'Framework scoring', 'ML prediction', 'SHAP', 'Recommendations'].map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <span className="arch-arrow">→</span>}
              <div className={`arch-node${label === 'ML prediction' ? ' hl' : ''}`}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">Pipeline — Completed vs Future</div>
        {pipeline.map((step) => (
          <div className={`pipeline-step ${step.status === 'completed' ? 'done' : 'future'}`} key={step.step}>
            <div className="step-num">{step.step}</div>
            <div style={{ flex: 1 }}>
              <div className="flex-between wrap">
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{step.title}</div>
                <Chip tone={step.status === 'completed' ? 'done' : 'future'}>
                  {step.status === 'completed' ? 'completed' : step.phase === 'future' ? 'future research' : step.status}
                </Chip>
              </div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                {step.detail}
                {step.note ? <span style={{ color: '#fbbf24' }}> — {step.note}</span> : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid cols-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">Independent Expert Validation — Next Research Phase</div>
          <ol className="muted" style={{ margin: 0, paddingLeft: 20, fontSize: 13.5 }}>
            {expert_validation.plan.map((item, i) => (
              <li key={i} style={{ marginBottom: 5 }}>{item}</li>
            ))}
          </ol>
          <Notice tone="warn" style={{ marginTop: 12 }}>
            This phase has <strong>not</strong> been completed. No expert labels,
            agreement statistics, or expert-derived weights are fabricated or
            claimed.
          </Notice>
        </div>

        <div className="card">
          <div className="card-title">Framework Weights vs AI Importance</div>
          <p style={{ fontSize: 13.5, maxWidth: 520 }}>
            Step 6 will compare the framework-grounded expert-derived weight
            ranking with the SHAP feature-importance ranking using Spearman's
            rank correlation and Kendall's tau.
          </p>
          <div className="stat" style={{ marginBottom: 10 }}>
            <div className="stat-label">Status</div>
            <div className="stat-value" style={{ fontSize: 18, color: '#fbbf24' }}>Pending</div>
            <div className="stat-note">{weighting_study.message}</div>
          </div>
          <div className="flex wrap">
            <Chip tone="pending">Spearman ρ</Chip>
            <Chip tone="pending">Kendall τ</Chip>
            <Chip tone="pending">AHP expert weights</Chip>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">RAG Recommendation Pilot (Experimental / Planned)</div>
        <p style={{ fontSize: 13.5, maxWidth: 900 }}>
          RAG is an auxiliary component, not the central contribution. The pilot
          retrieves defensive guidance from an approved corpus —{' '}
          {rag.corpus.join(', ')} — and grounds generated recommendations in the
          retrieved context, citing the source. Arbitrary web content is not
          allowed as a recommendation source.
        </p>
        <div className="flex wrap mt-4">
          <Chip tone="accent">retrieval from approved corpus</Chip>
          <Chip tone="pending">grounded LLM generation</Chip>
          <Chip tone="pending">source citation</Chip>
        </div>
      </div>

      <div className="grid cols-2" style={{ marginTop: 20 }}>
        <div className="notice" style={{ borderLeftColor: '#34d399' }}>
          <strong>COMPLETED PROTOTYPE WORK</strong> — problem & architecture
          definition, 8 dimensions, 19 questions, framework scoring prototype,
          synthetic dataset, LR/RF + baseline, 5-fold CV, preliminary evaluation,
          SHAP integration, end-to-end web prototype.
        </div>
        <div className="notice warn">
          <strong>FUTURE RESEARCH VALIDATION</strong> — expert-labelled dataset,
          AHP weights, framework-vs-SHAP comparison, expert agreement analysis,
          RAG pilot, final validation and results.
        </div>
      </div>
    </div>
  )
}