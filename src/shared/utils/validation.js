// Small composable validators. Each returns an error string or ''.
// Rules mirror the Spring Bean Validation constraints so users see problems
// before a round-trip, and the server remains the source of truth.
export const rules = {
  required: (label) => (v) => (v == null || String(v).trim() === '' ? `${label} is required.` : ''),
  minLength: (label, n) => (v) => (v && String(v).trim().length < n ? `${label} must be at least ${n} characters.` : ''),
  maxLength: (label, n) => (v) => (v && String(v).trim().length > n ? `${label} must be ${n} characters or fewer.` : ''),
  email: () => (v) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? 'Enter a valid email address.' : ''),
  pattern: (re, msg) => (v) => (v && !re.test(String(v).trim()) ? msg : ''),
  number: (label) => (v) => (v !== '' && v != null && !Number.isFinite(Number(v)) ? `${label} must be a number.` : ''),
  range: (label, min, max, unit = '') => (v) => {
    if (v === '' || v == null) return ''
    const n = Number(v)
    return n < min || n > max ? `${label} must be between ${min} and ${max}${unit}.` : ''
  },
  matches: (otherKey, msg) => (v, all) => (v !== all[otherKey] ? msg : ''),
}

export function validate(values, schema) {
  const errors = {}
  for (const [key, fns] of Object.entries(schema)) {
    for (const fn of fns) {
      const msg = fn(values[key], values)
      if (msg) { errors[key] = msg; break }
    }
  }
  return errors
}
