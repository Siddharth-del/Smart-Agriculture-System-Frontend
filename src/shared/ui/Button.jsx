import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from './Feedback'

const cx = (...c) => c.filter(Boolean).join(' ')

/** variant: primary | secondary | ghost | danger · size: sm | md | lg */
export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, icon: Icon, iconEnd: IconEnd, full, to, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  const classes = cx('ui-btn', `ui-btn--${variant}`, `ui-btn--${size}`, full && 'ui-btn--full', className)
  const content = (
    <>
      {loading ? <Spinner size={16} label="" /> : Icon && <Icon size={size === 'sm' ? 15 : 17} aria-hidden="true" />}
      {children && <span>{children}</span>}
      {IconEnd && !loading && <IconEnd size={16} aria-hidden="true" />}
    </>
  )
  if (to) return <Link ref={ref} to={to} className={classes} {...rest}>{content}</Link>
  return (
    <button ref={ref} type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  )
})

export function IconButton({ icon: Icon, label, size = 18, className, ...rest }) {
  return (
    <button type="button" className={cx('ui-iconbtn', className)} aria-label={label} title={label} {...rest}>
      <Icon size={size} aria-hidden="true" />
    </button>
  )
}
