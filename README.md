# AgriPro — Smart Agriculture Platform (Frontend)

React 19 · Vite · Redux Toolkit (RTK Query) · React Router · Lucide · Recharts.
Talks to the AgriPro Spring Boot backend.

## Run
```bash
cp .env.example .env        # set VITE_API_URL (e.g. http://localhost:8080)
npm ci
npm run dev                 # http://localhost:5173
npm run lint && npm run build && npm run preview
```
Optional: `VITE_DEV_PROXY_TARGET=http://localhost:8080` proxies `/api` in dev to avoid CORS.

## Structure
```
src/
  app/        store, single RTK Query api, router, role→navigation map, settings
  config/     env.js (all env access goes through here)
  lib/api/    baseQuery (timeouts, Bearer, one-shot refresh on 401), ApiError
  features/   auth, dashboard, sensors, weather, crop, disease, assistant,
              profile, admin, agronomist, landing, help, errors
  shared/     ui kit, layout (AppShell, ErrorBoundary), hooks, utils, toast
  styles/     app.css design system (light/dark, responsive, reduced motion)
  i18n/       English / Hindi strings
```
Add endpoints with `api.injectEndpoints` inside the owning feature. Add pages by
registering them in `app/navigation.js` (nav + role access) and `app/router.jsx`.

## Roles
| Role | Home | Access |
|---|---|---|
| FARMER | /app | dashboard, field monitor, weather, crop planner, plant doctor, assistant, profile |
| ADMIN | /admin | overview, farmers, system + farmer tools |
| AGRONOMIST | /agronomist | district watchlist (backend grants no other endpoints) |

## Deploy
`vercel.json` (SPA rewrites, security headers, immutable asset caching) and
`public/_redirects` (Netlify) are included. Set `VITE_API_URL` in the host and add
the production origin to the backend CORS list.

## Password reset
`/signin` → **Forgot password?** → three public pages, each its own lazy chunk:

| Route | Page | Backend call |
|---|---|---|
| `/forgot-password` | Enter account email | `POST /api/auth/forgot/password?email=` |
| `/verify-code` | Enter the 6-digit code (paste/autofill, resend after 60 s) | `POST /api/auth/verify-otp?email=&otp=` |
| `/reset-password` | Choose a new password (same rules as sign-up) | `POST /api/auth/reset-password?email=` body `{ password, confirmPassword }` |

Files: `features/auth/{ForgotPasswordPage,VerifyCodePage,ResetPasswordPage,OtpInput,ResetSteps}.jsx`,
`features/auth/resetFlow.js` (sessionStorage state, 15-min verified window, shared rules) and three
mutations in `features/auth/authApi.js`. The email travels between pages in sessionStorage, so a
refresh mid-flow is safe and closing the tab ends it. Visiting a later step directly redirects back.

## Backend realities the UI accounts for
- Sign-in returns the JWT inside a Set-Cookie string in the body; bad credentials return **404**.
- Crop recommendation takes N, P, K, pH, rainfall, location — **temperature and humidity are
  pulled from live weather server-side**, so the planner shows them read-only for the location.
- Sensor API exposes only the latest reading; the trend chart is built from real polled readings
  in the current session, never synthesised.
- No admin stats/activity/alert-history endpoints; those panels say so instead of faking data.
- No `/api/agronomist` controller exists.
- Reset endpoints reply with plain sentences, and `forgot/password` and `reset-password` answer
  **200 even on failure** ("invalid email", "…do not match"); `authApi.js` reads the sentence and turns
  it into a normal error. Spring may label a returned `String` as `application/json`, so `baseQuery`
  and `errors.js` fall back to the raw text when a JSON body doesn't parse.
- A verified code is consumed on success, so the verify step can't be repeated with the same code.

## Backend hardening (recommended before production)
1. Public signup accepts any role — force `ROLE_FARMER` server-side; create admins/agronomists out of band.
2. Remove `/api/auth/test-password` and `/api/auth/generate-hash`.
3. `/api/sensor/**` is `permitAll` — require the device key / auth.
4. JWT cookie uses `.secure(false)` — set `secure(true)` and `SameSite` for HTTPS.
5. Re-enable `@PreAuthorize("hasRole('ADMIN')")` on `AdminController`.
6. Return 401 (not 404) for bad credentials; return 415/400 (not 500) for rejected images.
7. Expose an admin stats/activity endpoint (the unused `AdminStatsResponse` DTO) to light up those panels.
8. **`/api/auth/reset-password` does not check that an OTP was verified** — anyone who knows an email
   can set that account's password by calling it directly. Have `/verify-otp` return a short-lived,
   single-use reset token and require it on `/reset-password` (the UI would then pass it along).
9. OTPs never expire and live in an in-memory map (lost on restart, not shared across instances).
   Store them with a ~10-minute expiry, cap verify attempts, and rate-limit `/forgot/password`.
