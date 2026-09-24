import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  LabelList,
} from 'recharts'
import { DIMENSION_META, SCORE_CUTS } from '../constants.js'

const BAR_COLOR = (value) => {
  if (value < SCORE_CUTS.low) return '#f43f5e'
  if (value < SCORE_CUTS.high) return '#fbbf24'
  return '#34d399'
}

export default function DimensionBar({ dimensionScores, height = 300 }) {
  const data = Object.entries(dimensionScores).map(([key, value]) => ({
    name: (DIMENSION_META[key] || {}).short || key,
    score: Math.round(value),
    full: value,
  }))

  return (
    <div className="chart-box" style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -18, right: 34, top: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#8e9bbd', fontSize: 10.5 }}
            interval={0}
            angle={-28}
            textAnchor="end"
            height={88}
          />
          <YAxis domain={[0, 100]} tick={{ fill: '#8e9bbd', fontSize: 11 }} ticks={[0, 25, 50, 75, 100]} />
          <Tooltip
            cursor={{ fill: 'rgba(34,211,238,0.06)' }}
            contentStyle={{
              background: '#111a38',
              border: '1px solid #2a3a6b',
              borderRadius: 10,
              color: '#dfe7f8',
            }}
            formatter={(v, _n, p) => [`${p.payload.full} / 100`, 'Score']}
          />
          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.name} fill={BAR_COLOR(d.full)} />
            ))}
            <LabelList dataKey="score" position="top" style={{ fill: '#8e9bbd', fontSize: 10 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}