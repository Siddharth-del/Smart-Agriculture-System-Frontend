import { createSlice, createSelector } from '@reduxjs/toolkit'

export const ROLES = Object.freeze({ FARMER: 'FARMER', ADMIN: 'ADMIN', AGRONOMIST: 'AGRONOMIST' })

// Spring authorities arrive as ROLE_FARMER etc.; the UI works with bare names.
export const normaliseRoles = (roles = []) =>
  [...new Set(roles.map((r) => String(r).toUpperCase().replace(/^ROLE_/, '')))].filter((r) => ROLES[r])

const KEY_USER = 'ap_user'
const KEY_TOKEN = 'ap_token'

// The backend's signin body carries the Set-Cookie string, e.g.
// "smartAgricultureSytem=eyJ...; Path=/api; Max-Age=...". Extract just the JWT.
export function extractJwt(raw) {
  if (!raw || typeof raw !== 'string') return null
  const first = raw.split(';')[0]
  const value = first.includes('=') ? first.slice(first.indexOf('=') + 1) : first
  return /^[\w-]+\.[\w-]+\.[\w-]+$/.test(value) ? value : null
}

function hydrate() {
  try {
    const user = JSON.parse(sessionStorage.getItem(KEY_USER) || 'null')
    const token = sessionStorage.getItem(KEY_TOKEN)
    if (user && token) return { user: { ...user, roles: normaliseRoles(user.roles) }, token }
  } catch { /* corrupted storage — start clean */ }
  return { user: null, token: null }
}

const persist = (user, token) => {
  try {
    sessionStorage.setItem(KEY_USER, JSON.stringify(user))
    sessionStorage.setItem(KEY_TOKEN, token)
  } catch { /* storage unavailable (private mode) — session stays in memory */ }
}
const clear = () => {
  try { sessionStorage.removeItem(KEY_USER); sessionStorage.removeItem(KEY_TOKEN) } catch { /* noop */ }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: { ...hydrate(), expired: false },
  reducers: {
    signedIn(state, { payload }) {
      state.user = { id: payload.id, username: payload.username, roles: normaliseRoles(payload.roles) }
      state.token = payload.token
      state.expired = false
      persist(state.user, state.token)
    },
    userVerified(state, { payload }) {
      if (!state.user) return
      state.user = { ...state.user, id: payload.id, username: payload.username, roles: normaliseRoles(payload.roles) }
      persist(state.user, state.token)
    },
    tokenRefreshed(state, { payload }) {
      state.token = payload
      if (state.user) persist(state.user, payload)
    },
    sessionExpired(state) {
      if (!state.user) return
      state.user = null
      state.token = null
      state.expired = true
      clear()
    },
    signedOut(state) {
      state.user = null
      state.token = null
      state.expired = false
      clear()
    },
    expiryAcknowledged(state) { state.expired = false },
  },
})

export const { signedIn, userVerified, tokenRefreshed, sessionExpired, signedOut, expiryAcknowledged } = authSlice.actions
export default authSlice.reducer

export const selectUser = (s) => s.auth.user
export const selectIsAuthenticated = (s) => Boolean(s.auth.user && s.auth.token)
export const selectRoles = createSelector(selectUser, (u) => u?.roles ?? [])
export const hasAnyRole = (roles, allowed) => allowed.some((r) => roles.includes(r))

/** Where each role lands after sign-in. Admin outranks agronomist outranks farmer. */
export function homePathFor(roles) {
  if (roles.includes(ROLES.ADMIN)) return '/app/admin'
  if (roles.includes(ROLES.AGRONOMIST)) return '/app/agronomist'
  return '/app/dashboard'
}
