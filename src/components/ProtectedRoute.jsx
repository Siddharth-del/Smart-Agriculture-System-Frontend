import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

export default function ProtectedRoute() {
  const { user } = useSelector(s => s.auth)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

/** Keeps signed-in users out of the landing/signin/signup pages. */
export function PublicOnlyRoute() {
  const { user } = useSelector(s => s.auth)
  if (user) return <Navigate to="/app/dashboard" replace />
  return <Outlet />
}

/** Gates admin-only routes (e.g. /app/admin) behind a role check. */
export function AdminRoute() {
  const { user } = useSelector(s => s.auth)
  const isAdmin = user?.roles?.some(r => r.includes('ADMIN'))
  if (!isAdmin) return <Navigate to="/app/dashboard" replace />
  return <Outlet />
}
