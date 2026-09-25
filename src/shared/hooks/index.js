import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { validate } from '../utils/validation'

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · AgriPro` : 'AgriPro — Smart Agriculture'
  }, [title])
}

const subscribeOnline = (cb) => {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => { window.removeEventListener('online', cb); window.removeEventListener('offline', cb) }
}
export const useOnlineStatus = () => useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true)

const subscribeVisibility = (cb) => {
  document.addEventListener('visibilitychange', cb)
  return () => document.removeEventListener('visibilitychange', cb)
}
export const usePageVisible = () =>
  useSyncExternalStore(subscribeVisibility, () => document.visibilityState === 'visible', () => true)

export function useMediaQuery(query) {
  return useSyncExternalStore(
    (cb) => { const m = window.matchMedia(query); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb) },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export function useDebouncedValue(value, delay = 400) {
  const [v, setV] = useState(value)
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t) }, [value, delay])
  return v
}

/** Re-renders on an interval so relative timestamps ("2 min ago") stay fresh. */
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), intervalMs); return () => clearInterval(t) }, [intervalMs])
  return now
}

/** State mirrored to localStorage (per-viewer UI conveniences only). */
export function useLocalState(key, initial) {
  const [value, setValue] = useState(() => {
    try { const raw = localStorage.getItem(key); return raw == null ? initial : JSON.parse(raw) } catch { return initial }
  })
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* noop */ } }, [key, value])
  return [value, setValue]
}

/**
 * Form state with schema validation. Errors show after a field is touched
 * or after a submit attempt, and server field errors can be merged in.
 */
export function useForm(initialValues, schema = {}) {
  const [values, setValues] = useState(initialValues)
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErrors, setServerErrors] = useState({})
  const clientErrors = validate(values, schema)
  const errors = { ...serverErrors, ...clientErrors }
  const visibleError = (k) => (touched[k] || submitted ? errors[k] || '' : '')

  const setField = useCallback((k, v) => {
    setValues((s) => ({ ...s, [k]: v }))
    setServerErrors((s) => (s[k] ? { ...s, [k]: '' } : s))
  }, [])

  const field = (k) => ({
    name: k,
    value: values[k] ?? '',
    onChange: (e) => setField(k, e?.target ? e.target.value : e),
    onBlur: () => setTouched((t) => ({ ...t, [k]: true })),
    error: visibleError(k),
  })

  const handleSubmit = (fn) => async (e) => {
    e?.preventDefault()
    setSubmitted(true)
    if (Object.values(validate(values, schema)).some(Boolean)) {
      // Move focus to the first invalid field for keyboard and screen-reader users.
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus())
      return
    }
    await fn(values)
  }

  const reset = useCallback((next = initialValues) => {
    setValues(next); setTouched({}); setSubmitted(false); setServerErrors({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { values, errors, field, setField, setValues, handleSubmit, reset, setServerErrors, isValid: !Object.values(clientErrors).some(Boolean) }
}
