import { Skeleton } from '../ui'

export function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-label="Loading page">
      <Skeleton width={220} height={28} />
      <Skeleton width={320} height={14} />
      <div className="grid-3" style={{ marginTop: 24 }}>
        <Skeleton height={120} radius={12} /><Skeleton height={120} radius={12} /><Skeleton height={120} radius={12} />
      </div>
      <Skeleton height={260} radius={12} />
    </div>
  )
}
