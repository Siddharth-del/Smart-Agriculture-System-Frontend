const cx = (...c) => c.filter(Boolean).join(' ')

export function Card({ as: Tag = 'section', className, children, padded = true, tone, ...rest }) {
  return <Tag className={cx('ui-card', padded && 'ui-card--padded', tone && `ui-card--${tone}`, className)} {...rest}>{children}</Tag>
}

export function CardHeader({ title, description, icon: Icon, actions, as: H = 'h2', id }) {
  return (
    <header className="ui-card__header">
      <div className="ui-card__heading">
        {Icon && <span className="ui-card__icon"><Icon size={18} aria-hidden="true" /></span>}
        <div>
          <H className="ui-card__title" id={id}>{title}</H>
          {description && <p className="ui-card__desc">{description}</p>}
        </div>
      </div>
      {actions && <div className="ui-card__actions">{actions}</div>}
    </header>
  )
}

export function PageHeader({ title, description, actions, meta }) {
  return (
    <header className="ui-page-header">
      <div>
        <h1 className="ui-page-title">{title}</h1>
        {description && <p className="ui-page-desc">{description}</p>}
        {meta && <div className="ui-page-meta">{meta}</div>}
      </div>
      {actions && <div className="ui-page-actions">{actions}</div>}
    </header>
  )
}

/** tone: neutral | success | warning | danger | info | brand */
export function Badge({ tone = 'neutral', children, dot, className }) {
  return (
    <span className={cx('ui-badge', `ui-tone--${tone}`, className)}>
      {dot && <span className="ui-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  )
}

export function Stat({ label, value, unit, hint, icon: Icon, tone }) {
  return (
    <div className={cx('ui-stat', tone && `ui-stat--${tone}`)}>
      <div className="ui-stat__label">{Icon && <Icon size={15} aria-hidden="true" />}{label}</div>
      <div className="ui-stat__value">{value}{unit && <span className="ui-stat__unit">{unit}</span>}</div>
      {hint && <div className="ui-stat__hint">{hint}</div>}
    </div>
  )
}

/** Accessible horizontal meter (confidence, completion). value: 0–100 */
export function Meter({ value, label, tone = 'brand', showValue = true }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className="ui-meter">
      {(label || showValue) && (
        <div className="ui-meter__row">
          {label && <span>{label}</span>}
          {showValue && <span className="ui-num">{Math.round(v)}%</span>}
        </div>
      )}
      <div className="ui-meter__track" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)} aria-label={label || 'Value'}>
        <div className={cx('ui-meter__fill', `ui-tone-bg--${tone}`)} style={{ width: `${v}%` }} />
      </div>
    </div>
  )
}

export function DescriptionList({ items }) {
  return (
    <dl className="ui-dl">
      {items.filter(Boolean).map(({ term, value }) => (
        <div key={term} className="ui-dl__row"><dt>{term}</dt><dd>{value || '—'}</dd></div>
      ))}
    </dl>
  )
}
