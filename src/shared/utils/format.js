const locale = () => (document.documentElement.lang === 'hi' ? 'hi-IN' : 'en-IN')

export const fmtNumber = (v, digits = 0) =>
  v == null || Number.isNaN(Number(v)) ? '—' : Number(v).toLocaleString(locale(), { maximumFractionDigits: digits })

/** Accepts 0–1 or 0–100 confidence values (the ML service has used both). */
export const toPercent = (v) => (v == null ? null : Number(v) <= 1 ? Number(v) * 100 : Number(v))
export const fmtPercent = (v, digits = 0) => {
  const p = toPercent(v)
  return p == null ? '—' : `${fmtNumber(p, digits)}%`
}

// Spring LocalDateTime has no zone; the server runs in IST in production.
export const parseServerDate = (v) => {
  if (!v) return null
  if (Array.isArray(v)) { const [y, mo, d, h = 0, mi = 0, s = 0] = v; return new Date(y, mo - 1, d, h, mi, s) }
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

export const fmtDateTime = (v) => {
  const d = parseServerDate(v)
  return d ? d.toLocaleString(locale(), { dateStyle: 'medium', timeStyle: 'short' }) : '—'
}
export const fmtTime = (v) => {
  const d = parseServerDate(v)
  return d ? d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : '—'
}

export function fmtRelative(v, now = Date.now()) {
  const d = parseServerDate(v)
  if (!d) return '—'
  const s = Math.round((now - d.getTime()) / 1000)
  if (s < 45) return 'just now'
  const rtf = new Intl.RelativeTimeFormat(locale(), { numeric: 'auto' })
  if (s < 3600) return rtf.format(-Math.round(s / 60), 'minute')
  if (s < 86400) return rtf.format(-Math.round(s / 3600), 'hour')
  return rtf.format(-Math.round(s / 86400), 'day')
}

export const titleCase = (s = '') => s.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
  .replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())

/** "Tomato___Early_blight" → { crop: "Tomato", condition: "Early blight", healthy: false } */
export function parseDiseaseLabel(label = '') {
  const [crop, ...rest] = String(label).split(/_{2,}|\s*-\s*/)
  const condition = titleCase(rest.join(' ') || label)
  return { crop: titleCase(crop || ''), condition, healthy: /healthy/i.test(label) }
}
