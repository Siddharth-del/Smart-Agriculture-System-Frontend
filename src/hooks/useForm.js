import { useCallback, useState } from 'react'

export const validators = {
  required: (label) => (v) => (v?.trim?.() ? '' : `${label} is required`),
  email: () => (v) => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email address'),
  minLength: (n, label) => (v) => (!v || v.length >= n ? '' : `${label} must be at least ${n} characters`),
}

function runRules(value, rules = []) {
  for (const rule of rules) {
    const msg = rule(value)
    if (msg) return msg
  }
  return ''
}

/**
 * Minimal controlled-form hook with per-field validation.
 * schema: { fieldName: [validatorFn, ...] }
 */
export function useForm(initial, schema = {}) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const setValue = useCallback((key, value) => {
    setValues(prev => ({ ...prev, [key]: value }))
    if (schema[key]) {
      setErrors(prev => ({ ...prev, [key]: runRules(value, schema[key]) }))
    }
  }, [schema])

  const setFieldTouched = useCallback((key) => {
    setTouched(prev => ({ ...prev, [key]: true }))
  }, [])

  const validateAll = useCallback(() => {
    const nextErrors = {}
    for (const key of Object.keys(schema)) {
      nextErrors[key] = runRules(values[key], schema[key])
    }
    setErrors(nextErrors)
    setTouched(Object.fromEntries(Object.keys(schema).map(k => [k, true])))
    return Object.values(nextErrors).every(e => !e)
  }, [schema, values])

  const isValid = Object.keys(schema).every(k => !runRules(values[k], schema[k]))

  return { values, errors, touched, setValue, setFieldTouched, validateAll, isValid, setValues }
}
