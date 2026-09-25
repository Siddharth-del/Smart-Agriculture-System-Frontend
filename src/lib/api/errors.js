/** A normalised error for every failed request, whatever the backend sent. */
export class ApiError extends Error {
  constructor({ message, status = 0, code = 'UNKNOWN', fieldErrors = null }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

const CODE_BY_STATUS = {
  400: 'VALIDATION', 401: 'UNAUTHORIZED', 403: 'FORBIDDEN', 404: 'NOT_FOUND',
  409: 'CONFLICT', 413: 'PAYLOAD_TOO_LARGE', 422: 'VALIDATION', 429: 'RATE_LIMITED',
}

export const FRIENDLY = {
  NETWORK: 'Could not reach the AgriPro server. Check your connection and try again.',
  OFFLINE: 'You are offline. Reconnect to load the latest data.',
  TIMEOUT: 'The server took too long to respond. Please try again.',
  UNAUTHORIZED: 'Your session has ended. Please sign in again.',
  FORBIDDEN: 'Your account does not have access to this.',
  NOT_FOUND: 'We could not find what you were looking for.',
  RATE_LIMITED: 'Too many requests. Wait a moment and try again.',
  SERVER: 'Something went wrong on the server. Please try again shortly.',
}

/** Spring returns {message}, {error}, a plain string, or a field→message map. */
export async function errorFromResponse(res) {
  const status = res.status
  const code = CODE_BY_STATUS[status] || (status >= 500 ? 'SERVER' : 'UNKNOWN')
  let message = ''
  let fieldErrors = null
  try {
       const ct = res.headers.get('content-type') || ''
    const raw = await res.text()
    let body = raw
    if (ct.includes('json')) { try { body = JSON.parse(raw) } catch { body = raw } }
    if (typeof body === 'string') message = body.slice(0, 300)
    else if (body?.message || body?.error) message = body.message || body.error
    else if (body && typeof body === 'object') {
      fieldErrors = body
      message = Object.values(body).find((v) => typeof v === 'string') || ''
    
    }
  } catch { /* unreadable body — fall back below */ }

  // Never surface raw stack traces, HTML error pages or generic 500 text.
  if (!message || /<html|exception|at [\w.$]+\(/i.test(message) || code === 'SERVER') {
    message = FRIENDLY[code] || res.statusText || 'Request failed.'
  }
  return new ApiError({ message: String(message).trim(), status, code, fieldErrors })
}

export const networkError = (kind) => new ApiError({ message: FRIENDLY[kind], code: kind, status: 0 })

export function getErrorMessage(err, fallback = 'Something went wrong.') {
  if (!err) return fallback
  return err.message || fallback
}
