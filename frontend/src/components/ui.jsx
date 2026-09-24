export function StatCard({ label, value, note, accent, big }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className={`stat-value${big ? ' hero' : ''}`} style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {note ? <div className="stat-note">{note}</div> : null}
    </div>
  )
}

export function Badge({ tone, children }) {
  const cls = tone === 'Low' ? 'low' : tone === 'High' ? 'high' : tone === 'Moderate' ? 'moderate' : ''
  return <span className={`badge ${cls}`}>{children}</span>
}

export function Chip({ tone, children }) {
  return <span className={`chip ${tone || ''}`}>{children}</span>
}

export function Notice({ tone, children }) {
  return <div className={`notice ${tone || ''}`}>{children}</div>
}

export function Spinner({ text }) {
  return (
    <div className="loading-box">
      <span className="spinner" />
      <span>{text || 'Working…'}</span>
    </div>
  )
}

export function ErrorBox({ message }) {
  return <div className="error-box">⚠ {message}</div>
}

export function ScoreRing({ value, size = 170, color }) {
  const r = 64
  const circ = 2 * Math.PI * r
  const fill = (Math.min(value, 100) / 100) * circ
  return (
    <svg width={size} height={size} viewBox="0 0 150 150">
      <circle cx="75" cy="75" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="11" />
      <circle
        cx="75"
        cy="75"
        r={r}
        fill="none"
        stroke={color || '#22d3ee'}
        strokeWidth="11"
        strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`}
        transform="rotate(-90 75 75)"
        style={{ filter: `drop-shadow(0 0 8px ${color || '#22d3ee'})` }}
      />
      <text x="75" y="72" textAnchor="middle" fill="#dfe7f8" fontSize="30" fontWeight="800">
        {Math.round(value)}
      </text>
      <text x="75" y="92" textAnchor="middle" fill="#8e9bbd" fontSize="11">
        / 100
      </text>
    </svg>
  )
}