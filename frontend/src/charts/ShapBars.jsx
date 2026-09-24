import { useMemo } from 'react'

function fmt(v) {
  if (v === null || v === undefined) return '—'
  if (Math.abs(v) < 0.0005 && v !== 0) return '< 0.001'
  return `${v >= 0 ? '+' : ''}${Number(v).toFixed(3)}`
}

export default function ShapBars({ contributions, byClass = false }) {
  const rows = useMemo(() => {
    const list = Array.isArray(contributions) ? contributions : []
    return [...list].sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
  }, [contributions])

  if (!rows.length) {
    return <div className="muted" style={{ padding: 12 }}>No SHAP contribution data available.</div>
  }

  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.value)), 1e-6)

  return (
    <div>
      <div className="shap-labels">
        <span>Decreases probability of {byClass ? 'this class' : 'prediction'}</span>
        <span>Increases probability</span>
      </div>
      {rows.map((r, i) => {
        const v = Number(r.value || 0)
        const pct = (Math.abs(v) / maxAbs) * 50
        const name = r.name || r.question || r.feature || `Feature ${i + 1}`
        return (
          <div className="shap-row" key={i}>
            <div className="shap-name" title={name}>{name}</div>
            <div className="shap-track">
              {v >= 0 && (
                <div
                  className="shap-fill pos"
                  style={{ left: '50%', width: `${pct}%` }}
                />
              )}
              {v < 0 && (
                <div
                  className="shap-fill neg"
                  style={{ right: '50%', width: `${pct}%` }}
                />
              )}
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: 'rgba(255,255,255,0.22)',
                }}
              />
            </div>
            <div className="shap-val">{fmt(v)}</div>
          </div>
        )
      })}
      <div className="muted" style={{ marginTop: 8, fontSize: 11.5 }}>
        Bars are scaled to the largest absolute contribution: ±{maxAbs.toFixed(3)}.
      </div>
    </div>
  )
}