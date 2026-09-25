import { AlertTriangle, CheckCircle2, Info, XCircle, WifiOff, RefreshCw, Lock } from 'lucide-react'

const cx = (...c) => c.filter(Boolean).join(' ')

export function Spinner({ size = 20, label = 'Loading' }) {
  return (
    <span className="ui-spinner" style={{ width: size, height: size }} role={label ? 'status' : undefined}>
      {label && <span className="sr-only">{label}</span>}
    </span>
  )
}

export function Skeleton({ width = '100%', height = 14, radius, className }) {
  return <span className={cx('ui-skeleton', className)} style={{ width, height, borderRadius: radius }} aria-hidden="true" />
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="ui-stack-sm" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => <Skeleton key={i} width={i === lines - 1 ? '60%' : '100%'} />)}
    </div>
  )
}

const TONE_ICON = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: XCircle, neutral: Info }

/** Inline, persistent message. Use Toasts for transient confirmations instead. */
export function Alert({ tone = 'info', title, children, action, className, icon }) {
  const Icon = icon || TONE_ICON[tone]
  return (
    <div className={cx('ui-alert', `ui-tone--${tone}`, className)} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon size={18} className="ui-alert__icon" aria-hidden="true" />
      <div className="ui-alert__body">
        {title && <p className="ui-alert__title">{title}</p>}
        {children && <div className="ui-alert__text">{children}</div>}
      </div>
      {action && <div className="ui-alert__action">{action}</div>}
    </div>
  )
}

export function EmptyState({ icon: Icon = Info, title, children, action, compact }) {
  return (
    <div className={cx('ui-empty', compact && 'ui-empty--compact')}>
      <span className="ui-empty__icon"><Icon size={compact ? 20 : 26} aria-hidden="true" /></span>
      <p className="ui-empty__title">{title}</p>
      {children && <p className="ui-empty__text">{children}</p>}
      {action && <div className="ui-empty__action">{action}</div>}
    </div>
  )
}

/** Renders a normalised API error with the right icon, copy and a retry. */
export function ErrorState({ error, onRetry, compact, title }) {
  const code = error?.code
  const Icon = code === 'OFFLINE' || code === 'NETWORK' ? WifiOff : code === 'FORBIDDEN' ? Lock : AlertTriangle
  const heading = title || (code === 'OFFLINE' ? 'You are offline'
    : code === 'NETWORK' ? 'Server unreachable'
      : code === 'TIMEOUT' ? 'Request timed out'
        : code === 'FORBIDDEN' ? 'No access'
          : 'Could not load this')
  return (
    <div className={cx('ui-empty', 'ui-empty--error', compact && 'ui-empty--compact')} role="alert">
      <span className="ui-empty__icon"><Icon size={compact ? 20 : 26} aria-hidden="true" /></span>
      <p className="ui-empty__title">{heading}</p>
      <p className="ui-empty__text">{error?.message || 'Something went wrong.'}</p>
      {onRetry && code !== 'FORBIDDEN' && (
        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={onRetry}>
          <RefreshCw size={15} aria-hidden="true" /><span>Try again</span>
        </button>
      )}
    </div>
  )
}

/**
 * Standard four-state renderer for an RTK Query result.
 * <QueryState query={q} skeleton={<.../>} isEmpty={(d) => !d.length} empty={<EmptyState/>}>{(data) => …}</QueryState>
 */
export function QueryState({ query, skeleton, empty, isEmpty, children, compact }) {
  const { data, error, isLoading, isFetching, refetch } = query
  if (isLoading) return skeleton ?? <div className="ui-center-pad"><Spinner /></div>
  if (error && !data) return <ErrorState error={error} onRetry={refetch} compact={compact} />
  if (data == null || (isEmpty && isEmpty(data))) return empty ?? null
  return (
    <div className={cx('ui-query', isFetching && 'is-refreshing')} aria-busy={isFetching || undefined}>
      {children(data)}
    </div>
  )
}
