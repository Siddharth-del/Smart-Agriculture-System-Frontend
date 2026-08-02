export function Card({ hover = false, padded = true, as: Tag = 'div', className = '', children, ...rest }) {
  const classes = ['card', hover ? 'card-hover' : '', padded ? 'card-p' : '', className]
    .filter(Boolean).join(' ')
  return <Tag className={classes} {...rest}>{children}</Tag>
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="row-between card-header">
      <div>
        <div className="card-title">{title}</div>
        {subtitle && <div className="card-subtitle">{subtitle}</div>}
      </div>
      {action}
    </div>
  )
}
