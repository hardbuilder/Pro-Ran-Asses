import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { DIMENSION_META } from '../constants.js'

export default function DimensionRadar({ dimensionScores }) {
  const data = Object.entries(dimensionScores).map(([key, value]) => ({
    dimension: (DIMENSION_META[key] || {}).short || key,
    score: Math.round(value),
    full: value,
  }))

  return (
    <div className="chart-box" style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="68%">
          <PolarGrid stroke="rgba(255,255,255,0.12)" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#8e9bbd', fontSize: 11 }}
          />
          <Radar
            name="Dimension score"
            dataKey="score"
            stroke="#22d3ee"
            fill="#22d3ee"
            fillOpacity={0.28}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              background: '#111a38',
              border: '1px solid #2a3a6b',
              borderRadius: 10,
              color: '#dfe7f8',
            }}
            formatter={(v) => [`${v} / 100`, 'Score']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}