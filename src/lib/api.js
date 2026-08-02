// Single source of truth for talking to the backend.
// Replaces the three previously-duplicated implementations
// (src/features/api.js, src/api/axiosInstance.js, and the
// inline fetch logic that lived in src/pages/Auth.jsx).

import { store } from '../app/store'
import { setCredentials, logout } from '../app/store'

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Attempts to exchange the current token for a fresh one. */
async function refreshToken(currentToken) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh-token`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${currentToken}` },
    })
    if (!res.ok) throw new Error('Refresh failed')
    const { token: newToken } = await res.json()
    const { user } = store.getState().auth
    store.dispatch(setCredentials({ user, token: newToken }))
    return newToken
  } catch {
    store.dispatch(logout())
    return null
  }
}

async function parseError(res) {
  const ct = res.headers.get('content-type') || ''
  try {
    if (ct.includes('json')) {
      const body = await res.json()
      return body.message || body.error || res.statusText
    }
    const text = await res.text()
    return text || res.statusText
  } catch {
    return res.statusText || 'Request failed'
  }
}

/**
 * Core JSON request helper with automatic 401 → refresh → retry.
 * @param {string} path - API path, e.g. '/api/sensor/latest'
 * @param {RequestInit} options
 * @param {string|null} token
 * @param {{ retry?: number }} extra - retry attempts on network failure (not 4xx/5xx)
 */
export async function apiFetch(path, options = {}, token, extra = {}) {
  const { retry = 0 } = extra
  const isFormData = options.body instanceof FormData

  const makeReq = (t) =>
    fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...options.headers,
      },
    })

  let attempt = 0
  let lastNetworkErr
  while (attempt <= retry) {
    try {
      let res = await makeReq(token)

      if (res.status === 401 && token) {
        const newToken = await refreshToken(token)
        if (!newToken) throw new ApiError('Session expired. Please sign in again.', 401)
        res = await makeReq(newToken)
      }

      if (!res.ok) {
        throw new ApiError(await parseError(res), res.status)
      }

      const ct = res.headers.get('content-type') || ''
      return ct.includes('json') ? res.json() : res.text()
    } catch (err) {
      if (err instanceof ApiError) throw err
      lastNetworkErr = err
      attempt++
      if (attempt > retry) break
      await new Promise(r => setTimeout(r, 400 * attempt)) // simple backoff
    }
  }
  throw new ApiError(lastNetworkErr?.message || 'Network error. Check your connection.', 0)
}

export function apiUpload(path, formData, token) {
  return apiFetch(path, { method: 'POST', body: formData }, token)
}

export { ApiError }
