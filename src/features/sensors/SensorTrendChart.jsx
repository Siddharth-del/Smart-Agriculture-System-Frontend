import { Area, AreaChart, CartesianGrid, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fmtTime } from '../../shared/utils/format'

function TipContent({ active, payload }) {
  if (!active || !payload?.length) return null
  const r = payload[0].payload
  return (
    <div className="chart-tip">
      <p className="chart-tip__label">{fmtTime(r.recordedAt)}</p>
      <p><strong className="ui-num">{Math.round(r.soilMoisture)}%</strong> soil moisture</p>
      {r.temperature != null && <p className="ui-num">{Math.round(r.temperature)}°C · {Math.round(r.humidity)}% RH</p>}
    </div>
  )
}

export default function SensorTrendChart({ readings, height = 220 }) {
  const data = readings.map((r) => ({ ...r, t: fmtTime(r.recordedAt) }))
  return (
    <div style={{ width: '100%', height }} role="img" aria-label={`Soil moisture trend across ${readings.length} readings, latest ${Math.round(readings.at(-1)?.soilMoisture ?? 0)}%`}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="moistFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ap-water)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--ap-water)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <ReferenceArea y1={30} y2={60} fill="var(--ap-success)" fillOpacity={0.07} />
          <CartesianGrid stroke="var(--ap-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="t" tick={{ fontSize: 12, fill: 'var(--ap-text-3)' }} tickLine={false} axisLine={false} minTickGap={28} />
          <YAxis domain={[0, 100]} ticks={[0, 30, 60, 100]} tick={{ fontSize: 12, fill: 'var(--ap-text-3)' }} tickLine={false} axisLine={false} unit="%" />
          <Tooltip content={<TipContent />} cursor={{ stroke: 'var(--ap-border-strong)' }} />
          <Area type="monotone" dataKey="soilMoisture" stroke="var(--ap-water)" strokeWidth={2} fill="url(#moistFill)" dot={data.length < 12} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
