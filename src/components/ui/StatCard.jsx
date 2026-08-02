/**
 * A single stat/metric tile used on the dashboard and module summaries.
 */
export default function StatCard({ label, value, unit, tone = 'accent', icon }) {
  return (
    <div className={`stat-card stat-tone-${tone}`}>
      {icon && <div className="stat-icon" aria-hidden="true">{icon}</div>}
      <div className="stat-value">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
