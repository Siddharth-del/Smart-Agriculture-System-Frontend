import { forwardRef } from 'react'

/**
 * Shared button. variant: primary | secondary | ghost | danger | amber
 * size: sm | md (default)
 */
const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', full = false, loading = false, disabled, children, className = '', ...rest },
  ref
) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : '',
    full ? 'btn-full' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button ref={ref} className={classes} disabled={disabled || loading} aria-busy={loading} {...rest}>
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  )
})

export default Button
