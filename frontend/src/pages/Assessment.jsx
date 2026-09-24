import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api.js'
import { useAssessment } from '../store/AssessmentContext.jsx'
import { DEMO_PROFILES } from '../data/demoProfiles.js'
import { Notice, Spinner, ErrorBox } from '../components/ui.jsx'

const EMPTY = {}

export default function Assessment() {
  const [survey, setSurvey] = useState(null)
  const [fetchError, setFetchError] = useState(null)
  const [answers, setAnswers] = useState(EMPTY)
  const [dimIdx, setDimIdx] = useState(0)
  const [submitState, setSubmitState] = useState('idle') // idle | submitting | error
  const [submitError, setSubmitError] = useState(null)
  const [touched, setTouched] = useState(false)
  const navigate = useNavigate()
  const { setAssessment, setAnswers: setStoreAnswers } = useAssessment()

  useEffect(() => {
    api
      .questionnaire()
      .then(setSurvey)
      .catch((e) => setFetchError(e.message))
  }, [])

  const questionCount = survey?.count ?? 19

  const answeredCount = useMemo(() => {
    if (!survey) return 0
    return survey.dimensions
      .flatMap((d) => d.questions)
      .filter((q) => answers[q.key] !== undefined).length
  }, [survey, answers])

  if (fetchError) return <ErrorBox message={`Could not load questionnaire: ${fetchError}`} />
  if (!survey) return <Spinner text="Loading questionnaire…" />

  const dimensions = survey.dimensions
  const dim = dimensions[dimIdx]
  const pctAnswered = Math.round((answeredCount / questionCount) * 100)

  const missing = (() => {
    if (!survey) return []
    return survey.dimensions
      .flatMap((d) => d.questions)
      .filter((q) => answers[q.key] === undefined)
      .map((q) => q.key)
  })()

  const setAnswer = (key, value) => {
    setTouched(true)
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  const loadDemo = (demo) => {
    setTouched(true)
    setAnswers({ ...demo.answers })
    setDimIdx(0)
  }

  const goPrev = () => setDimIdx((i) => Math.max(0, i - 1))
  const goNext = () => setDimIdx((i) => Math.min(dimensions.length - 1, i + 1))

  const validate = () => {
    if (missing.length > 0) {
      setTouched(true)
      setSubmitError(
        `Please answer all ${questionCount} questions. Missing: ${missing.join(', ')}`,
      )
      return false
    }
    return true
  }

  const goToFirstMissing = () => {
    const firstDim = dimensions.findIndex((d) =>
      d.questions.some((q) => answers[q.key] === undefined),
    )
    if (firstDim >= 0) setDimIdx(firstDim)
  }

  const submit = async () => {
    if (!validate()) {
      goToFirstMissing()
      return
    }
    setSubmitState('submitting')
    setSubmitError(null)
    try {
      const result = await api.assess(answers)
      setAssessment(result)
      setStoreAnswers(answers)
      navigate('/results')
    } catch (e) {
      setSubmitState('error')
      setSubmitError(e.message)
    }
  }

  return (
    <div>
      <div className="flex-between wrap mb-4">
        <h1 style={{ margin: 0 }}>Readiness Assessment</h1>
        <div className="btn-group">
          <span className="muted" style={{ fontSize: 12.5 }}>Load demo profile:</span>
          {DEMO_PROFILES.map((p) => (
            <button key={p.id} className="btn sm ghost" onClick={() => loadDemo(p)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {touched && !missing.length && (
        <Notice tone="">
          All {questionCount} questions answered — you can still review and change any answer before
          calculating.
        </Notice>
      )}

      <div className="assessment-toolbar">
        <div className="flex" style={{ gap: 8 }}>
          <span className="chip">{answeredCount}/{questionCount} answered</span>
          <span className="chip accent">Dimension {dimIdx + 1} of {dimensions.length}</span>
        </div>
        <div style={{ flex: 1, maxWidth: 380 }}>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pctAnswered}%` }} />
          </div>
        </div>
      </div>

      <section className="dim-section">
        <div className="dim-header">
          <span className="dim-number">D{dimIdx + 1}</span>
          <div>
            <div className="dim-title">{dim.name}</div>
            <div className="dim-desc">{dim.description}</div>
          </div>
        </div>

        {dim.questions.map((q, qi) => (
          <div className="question" key={q.key}>
            <div className="question-label">
              <span className="question-qid">[{q.key}]</span> {q.text}
            </div>
            <div className="opts">
              {survey.score_options.map((opt) => {
                const selected = answers[q.key] === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`opt${selected ? ' selected' : ''}`}
                    onClick={() => setAnswer(q.key, opt.value)}
                  >
                    <div className="opt-score">{opt.value}</div>
                    <div className="opt-text">{opt.label}</div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      {submitError && (
        <div className="error-box" style={{ marginBottom: 14 }}>⚠ {submitError}</div>
      )}

      <div className="btn-group" style={{ marginTop: 4 }}>
        <button className="btn" onClick={goPrev} disabled={dimIdx === 0}>← Previous</button>
        {dimIdx < dimensions.length - 1 ? (
          <button className="btn" onClick={goNext}>Next →</button>
        ) : (
          <button
            className="btn primary"
            onClick={submit}
            disabled={submitState === 'submitting'}
          >
            {submitState === 'submitting' ? (
              <span className="flex"><span className="spinner" /> Calculating…</span>
            ) : (
              'Calculate Readiness ▸'
            )}
          </button>
        )}
      </div>
    </div>
  )
}