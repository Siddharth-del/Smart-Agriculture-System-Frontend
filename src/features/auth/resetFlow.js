import { rules } from '../../shared/utils/validation'

// The three reset pages share one small record in sessionStorage so a refresh
// mid-flow doesn't lose the email, and closing the tab ends the flow.
// The "verified" flag only gates the UI; the server must remain the authority.
const KEY = 'agripro.passwordReset'
const VERIFIED_FOR_MS = 15 * 60 * 1000

export const CODE_LENGTH = 6
export const RESEND_COOLDOWN_S = 60

export function readResetFlow() {
  try {
    const raw = sessionStorage.getItem(KEY)
    const flow = raw ? JSON.parse(raw) : null
    return flow && typeof flow.email === 'string' && flow.email ? flow : null
  } catch {
    return null
  }
}

function save(flow) {
  try { sessionStorage.setItem(KEY, JSON.stringify(flow)) } catch { /* storage unavailable: the flow still works until refresh */ }
  return flow
}

/** A new code was sent: forget any earlier verification. */
export const startResetFlow = (email) => save({ email, sentAt: Date.now(), verifiedAt: null })

export const updateResetFlow = (patch) => save({ ...(readResetFlow() || {}), ...patch })

export function clearResetFlow() {
  try { sessionStorage.removeItem(KEY) } catch { /* noop */ }
}

export const isVerificationFresh = (flow) =>
  Boolean(flow?.verifiedAt && Date.now() - flow.verifiedAt < VERIFIED_FOR_MS)

/** Same password policy as sign-up, so a reset can't produce a weaker password. */
export const passwordRules = [
  rules.required('Password'), rules.minLength('Password', 8), rules.maxLength('Password', 40),
  rules.pattern(/(?=.*[A-Za-z])(?=.*\d)/, 'Include at least one letter and one number.'),
]

/** Readable copy for a failed "send code" request. */
export function sendCodeErrorMessage(err) {
  if (!err) return ''
  if (err.code === 'SERVER') return 'We couldn’t send the email right now. Check the address and try again in a few minutes.'
  return err.message || 'We couldn’t send the code. Try again.'
}

export const formatCountdown = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
