import { api } from '../../app/api'

// The password-reset endpoints answer with a plain sentence, and two of them
// answer 200 even when nothing happened ("invalid email", "New password and
// confirm password do not match"). The wrappers below read that sentence so
// the pages only ever see a normal success or a normal error.
const sentence = (data) => (typeof data === 'string' ? data.trim() : data?.message || '')

// Sending mail over SMTP can be slow on a cold server, so allow longer than the default.
const SEND_CODE_TIMEOUT_MS = 60000

export const authApi = api.injectEndpoints({
  endpoints: (b) => ({
    signIn: b.mutation({ query: (body) => ({ url: '/api/auth/signin', method: 'POST', body }) }),
    signUp: b.mutation({ query: (body) => ({ url: '/api/auth/signup', method: 'POST', body }) }),
    signOut: b.mutation({ query: () => ({ url: '/api/auth/signout', method: 'POST' }) }),
    currentUser: b.query({ query: () => '/api/auth/user', providesTags: ['Me'] }),

    /** POST /api/auth/forgot/password?email= → emails a 6-digit code. 404 when no account uses the email. */
    requestPasswordReset: b.mutation({
      async queryFn(email, _api, _extra, baseQuery) {
        const res = await baseQuery({
          url: '/api/auth/forgot/password', method: 'POST', params: { email }, timeout: SEND_CODE_TIMEOUT_MS,
        })
        if (res.error) return { error: res.error }
        const text = sentence(res.data)
        if (/invalid/i.test(text)) {
          return { error: { code: 'SEND_FAILED', status: 200, message: 'We couldn’t send a code to this email. Check the address and try again.' } }
        }
        return { data: text }
      },
    }),

    /** POST /api/auth/verify-otp?email=&otp= → 200 "OTP Validate" or 400 "Invalid OTP". A code works once. */
    verifyResetCode: b.mutation({
      query: ({ email, otp }) => ({ url: '/api/auth/verify-otp', method: 'POST', params: { email, otp } }),
    }),

    /** POST /api/auth/reset-password?email= with { password, confirmPassword }. */
    resetPassword: b.mutation({
      async queryFn({ email, password, confirmPassword }, _api, _extra, baseQuery) {
        const res = await baseQuery({
          url: '/api/auth/reset-password', method: 'POST', params: { email }, body: { password, confirmPassword },
        })
        if (res.error) return { error: res.error }
        const text = sentence(res.data)
        if (!/success/i.test(text)) {
          return { error: { code: 'VALIDATION', status: 400, message: text || 'The password was not changed. Try again.' } }
        }
        return { data: text }
      },
    }),
  }),
})

export const {
  useSignInMutation, useSignUpMutation, useSignOutMutation, useCurrentUserQuery,
  useRequestPasswordResetMutation, useVerifyResetCodeMutation, useResetPasswordMutation,
} = authApi
