import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { selectIsAuthenticated, selectRoles, hasAnyRole, homePathFor } from './authSlice'
import ForbiddenPage from '../errors/ForbiddenPage'

export function RequireAuth() {
  const authed = useSelector(selectIsAuthenticated)
  const location = useLocation()
  if (!authed) return <Navigate to="/signin" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}

/** Renders a 403 in place (keeps the URL) rather than silently redirecting. */
export function RequireRole({ roles }) {
  const userRoles = useSelector(selectRoles)
  return hasAnyRole(userRoles, roles) ? <Outlet /> : <ForbiddenPage />
}

export function PublicOnly() {
  const authed = useSelector(selectIsAuthenticated)
  const roles = useSelector(selectRoles)
  return authed ? <Navigate to={homePathFor(roles)} replace /> : <Outlet />
}

export function RoleHome() {
  const roles = useSelector(selectRoles)
  return <Navigate to={homePathFor(roles)} replace />
}
