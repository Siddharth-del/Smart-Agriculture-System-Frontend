import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function FarmersByStateChart({ data }) {
  const rows = data.slice(0, 8)
  const height = Math.max(160, rows.length * 38)
  return (
    <div style={{ width: '100%', height }} role="img" aria-label={`Farmers by state: ${rows.map((r) => `${r.state} ${r.count}`).join(', ')}`}>
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="var(--ap-border)" strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--ap-text-3)' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="state" width={120} tick={{ fontSize: 13, fill: 'var(--ap-text-2)' }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: 'var(--ap-surface-2)' }} contentStyle={{ background: 'var(--ap-surface)', border: '1px solid var(--ap-border)', borderRadius: 8, fontSize: 13 }} formatter={(v) => [v, 'Farmers']} />
          <Bar dataKey="count" fill="var(--ap-brand)" radius={[0, 4, 4, 0]} barSize={18} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
