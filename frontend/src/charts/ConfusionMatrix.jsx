export default function ConfusionMatrix({ matrix, classes }) {
  if (!matrix || matrix.length !== classes.length) {
    return <div className="muted" style={{ padding: 10 }}>No confusion matrix available.</div>
  }

  const max = Math.max(...matrix.flat(), 1)

  const shade = (v) => {
    const a = v === 0 ? 0.03 : 0.1 + (v / max) * 0.7
    return { background: `rgba(34,211,238,${a.toFixed(3)})` }
  }

  return (
    <div className="cm" style={{ gridTemplateColumns: '84px repeat(3, 1fr)' }}>
      <div className="cm-head" />
      {classes.map((c) => (
        <div className="cm-head" key={c} style={{ textAlign: 'center' }}>
          Pred: {c}
        </div>
      ))}
      {classes.map((c, i) => (
        <div key={`row-${c}`} style={{ display: 'contents' }}>
          <div className="cm-y">True: {c}</div>
          {matrix[i].map((v, j) => (
            <div
              key={`${i}-${j}`}
              className="cm-cell"
              style={{
                ...shade(v),
                color: i === j && v > 0 ? '#22d3ee' : '#dfe7f8',
              }}
            >
              {v}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}