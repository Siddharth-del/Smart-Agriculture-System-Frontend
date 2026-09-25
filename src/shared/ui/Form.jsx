import { useId, useState, cloneElement } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const cx = (...c) => c.filter(Boolean).join(' ')

/** Wires label, hint and error to its control with the right ARIA attributes. */
export function Field({ label, hint, error, required, children, className, optional }) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errId = error ? `${id}-err` : undefined
  const control = cloneElement(children, {
    id,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': [hintId, errId].filter(Boolean).join(' ') || undefined,
    'aria-required': required || undefined,
  })
  return (
    <div className={cx('ui-field', error && 'has-error', className)}>
      {label && (
        <label htmlFor={id} className="ui-label">
          {label}{optional && <span className="ui-label__opt"> (optional)</span>}
        </label>
      )}
      {control}
      {hint && !error && <p id={hintId} className="ui-hint">{hint}</p>}
      {error && <p id={errId} className="ui-error">{error}</p>}
    </div>
  )
}

export function Input({ className, suffix, prefix, error: _e, ...props }) {
  if (!suffix && !prefix) return <input className={cx('ui-input', className)} {...props} />
  return (
    <div className="ui-input-group">
      {prefix && <span className="ui-input-affix">{prefix}</span>}
      <input className={cx('ui-input', className)} {...props} />
      {suffix && <span className="ui-input-affix">{suffix}</span>}
    </div>
  )
}

export function PasswordInput(props) {
  const [show, setShow] = useState(false)
  return (
    <div className="ui-input-group">
      <input className="ui-input" type={show ? 'text' : 'password'} {...props} />
      <button type="button" className="ui-input-toggle" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
        {show ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
      </button>
    </div>
  )
}

export function Select({ options, placeholder, className, error: _e, ...props }) {
  return (
    <select className={cx('ui-input', 'ui-select', className)} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (typeof o === 'string'
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  )
}

export function Textarea({ className, error: _e, ...props }) {
  return <textarea className={cx('ui-input', 'ui-textarea', className)} {...props} />
}

/** Accessible segmented control (radio group). */
export function Segmented({ label, value, onChange, options, size = 'md' }) {
  const name = useId()
  return (
    <div className={cx('ui-segmented', `ui-segmented--${size}`)} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <label key={o.value} className={cx('ui-segmented__opt', value === o.value && 'is-active')}>
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
          {o.icon && <o.icon size={15} aria-hidden="true" />}<span>{o.label}</span>
        </label>
      ))}
    </div>
  )
}
