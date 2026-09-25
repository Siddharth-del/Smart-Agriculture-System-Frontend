import { env } from '../../config/env'
import { ApiError, errorFromResponse, networkError, FRIENDLY } from './errors'
import { tokenRefreshed, sessionExpired } from '../../features/auth/authSlice'

const buildUrl = (url, params) => {
  const u = new URL(`${env.apiBaseUrl}${url}`, window.location.origin)
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, v)
  })
  return u.toString()
}

async function send({ url, method = 'GET', body, params, timeout }, token, outerSignal) {
  if (navigator.onLine === false) throw networkError('OFFLINE')

  const controller = new AbortController()
  const onAbort = () => controller.abort()
  outerSignal?.addEventListener('abort', onAbort)
  const isForm = body instanceof FormData
  const limit = timeout ?? (isForm ? env.uploadTimeoutMs : env.requestTimeoutMs)
  let timedOut = false
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, limit)

  try {
    return await fetch(buildUrl(url, params), {
      method,
      credentials: 'include', // the backend's HttpOnly cookie works alongside the header
      signal: controller.signal,
      headers: {
        Accept: 'application/json, text/plain;q=0.9',
        ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
  } catch (err) {
    if (timedOut) throw networkError('TIMEOUT')
    if (err?.name === 'AbortError') throw err
    throw networkError('NETWORK')
  } finally {
    clearTimeout(timer)
    outerSignal?.removeEventListener('abort', onAbort)
  }
}

// Spring writes a returned String as-is and can label it application/json when the
// client accepts JSON, so a "JSON" body may be a bare sentence. Fall back to the text.
async function parse(res) {
  if (res.status === 204) return null
  const ct = res.headers.get('content-type') || ''
  const text = await res.text()
  if (!ct.includes('json')) return text
  if (!text) return null
  try { return JSON.parse(text) } catch { return text }
}

// A single in-flight refresh is shared by every request that hits 401 together.
let refreshing = null
function refresh(token, dispatch) {
  refreshing ??= (async () => {
    try {
      const res = await send({ url: '/api/auth/refresh-token', method: 'POST' }, token)
      if (!res.ok) return null
      const { token: next } = await res.json()
      if (next) dispatch(tokenRefreshed(next))
      return next || null
    } catch {
      return null
    } finally {
      setTimeout(() => { refreshing = null }, 0)
    }
  })()
  return refreshing
}

const NO_REFRESH = ['/api/auth/signin', '/api/auth/signup', '/api/auth/refresh-token', '/api/auth/signout']
const toPlain = (e) => ({ message: e.message, status: e.status, code: e.code, fieldErrors: e.fieldErrors })

/** RTK Query base query: timeouts, auth header, 401 → refresh → retry, normalised errors. */
export const baseQuery = async (args, api) => {
  const req = typeof args === 'string' ? { url: args } : args
  const token = api.getState().auth.token
  try {
    let res = await send(req, token, api.signal)

    if (res.status === 401 && token && !NO_REFRESH.includes(req.url)) {
      const next = await refresh(token, api.dispatch)
      if (!next) {
        api.dispatch(sessionExpired())
        return { error: { message: FRIENDLY.UNAUTHORIZED, status: 401, code: 'UNAUTHORIZED' } }
      }
      res = await send(req, next, api.signal)
    }
    if (!res.ok) return { error: toPlain(await errorFromResponse(res)) }
    return { data: await parse(res) }
  } catch (err) {
    if (err?.name === 'AbortError') return { error: { code: 'ABORTED', status: 0, message: 'Request cancelled.' } }
    return { error: toPlain(err instanceof ApiError ? err : networkError('NETWORK')) }
  }
}
