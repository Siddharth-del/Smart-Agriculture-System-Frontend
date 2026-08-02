export function Skeleton({ width = '100%', height = 14, radius = 6, style = {} }) {
  return (
    <span
      className="skeleton"
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  )
}

/** Skeleton for a grid of dashboard cards while data loads. */
export function CardGridSkeleton({ count = 3 }) {
  return (
    <div className="g3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="card card-p" key={i}>
          <Skeleton width="40%" height={11} style={{ marginBottom: 14 }} />
          <Skeleton width="70%" height={18} style={{ marginBottom: 8 }} />
          <Skeleton width="55%" height={11} />
        </div>
      ))}
    </div>
  )
}

/** Full-page skeleton used as the Suspense fallback for lazy-loaded routes. */
export function PageSkeleton() {
  return (
    <div className="page" aria-busy="true" aria-label="Loading page">
      <Skeleton height={120} radius={20} style={{ marginBottom: 26 }} />
      <CardGridSkeleton count={3} />
    </div>
  )
}
