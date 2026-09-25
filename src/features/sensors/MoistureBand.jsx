import { MOISTURE_BANDS, moistureBand } from '../../shared/utils/agronomy'

/**
 * The dashboard's signature element: soil moisture placed on a band showing
 * dry / optimal / moist / waterlogged zones, so the number reads at a glance.
 */
export default function MoistureBand({ value, size = 'lg', showLabel = false }) {
  const band = moistureBand(value)
  const pct = Math.max(0, Math.min(100, value ?? 0))
  let prev = 0
  return (
    <div className={`moisture moisture--${size}`}>
      <div className="moisture__readout">
        <span className="moisture__value ui-num">{value == null ? '—' : Math.round(value)}</span>
        <span className="moisture__unit">%</span>
        {showLabel && band && <span className={`moisture__label ui-tone-text--${band.tone}`}>{band.label}</span>}
      </div>
      <div className="moisture__track" role="meter" aria-label="Soil moisture" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value == null ? undefined : Math.round(value)} aria-valuetext={band ? `${Math.round(value)}%, ${band.label}` : 'No reading'}>
        {MOISTURE_BANDS.map((b) => {
          const w = b.max - prev
          prev = b.max
          return <span key={b.key} className={`moisture__zone moisture__zone--${b.key}`} style={{ flexBasis: `${w}%` }} />
        })}
        {value != null && <span className="moisture__marker" style={{ left: `${pct}%` }} />}
      </div>
      <div className="moisture__scale" aria-hidden="true">
        {MOISTURE_BANDS.map((b) => <span key={b.key}>{b.label}</span>)}
      </div>
    </div>
  )
}
