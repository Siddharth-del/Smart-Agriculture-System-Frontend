import { useId } from 'react'

export default function FormField({
  label, error, type = 'text', value, onChange, onBlur, placeholder,
  autoComplete, endAdornment, ...rest
}) {
  const id = useId()
  const errId = `${id}-error`

  return (
    <div className="input-group">
      <label className="label" htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <input
          id={id}
          className={`input ${error ? 'input-error' : ''}`}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          {...rest}
        />
        {endAdornment}
      </div>
      {error && <span className="field-error" id={errId} role="alert">{error}</span>}
    </div>
  )
}
