// Centralised, validated runtime configuration. Every value comes from a
// VITE_* variable at build time; nothing else in the app reads import.meta.env.
const e = import.meta.env

const trimSlash = (v) => (v || '').trim().replace(/\/+$/, '')
const num = (v, fallback) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export const env = Object.freeze({
  apiBaseUrl: trimSlash(e.VITE_API_URL) || (e.DEV ? 'http://localhost:8080' : ''),
  sensorPollMs: num(e.VITE_SENSOR_POLL_MS, 15000),
  requestTimeoutMs: num(e.VITE_REQUEST_TIMEOUT_MS, 20000),
  uploadTimeoutMs: num(e.VITE_UPLOAD_TIMEOUT_MS, 90000),
  maxUploadMb: num(e.VITE_MAX_UPLOAD_MB, 10),
  appVersion: __APP_VERSION__,
  buildTime: __BUILD_TIME__,
  isProd: e.PROD,
})

if (env.isProd && !env.apiBaseUrl) {
  console.error('[AgriPro] VITE_API_URL is not set for this production build.')
}
