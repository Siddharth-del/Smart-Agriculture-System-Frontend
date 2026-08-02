# AgriPro — Smart Agriculture System Frontend

A React dashboard for real-time soil, weather, and irrigation monitoring, backed
by a Spring Boot REST API. Farmers get crop advisory, disease detection, AI
guidance, and live sensor readings; admins manage registered farmers.

## Stack

- **React 19** + **Vite 7**
- **React Router 7** — client-side routing, route-level code splitting
- **Redux Toolkit** — auth session + theme/language preferences
- **Recharts** — sensor charts
- Plain CSS with design tokens (no framework) — see `src/global.css`

## Getting started

```bash
npm install
npm run dev      # start dev server
npm run build    # production build to dist/
npm run preview  # preview the production build locally
```

Set `VITE_API_URL` in a `.env` file to point at your backend (defaults to
`http://localhost:8080`).

## Project structure

```
src/
├── app/store.js          Redux store: auth slice + settings (theme/lang) slice
├── components/
│   ├── ui/                Small reusable primitives (Button, Card, Badge, StatCard,
│   │                       Skeleton, EmptyState, FormField)
│   ├── AppLayout.jsx       Authenticated shell: sidebar + topbar + routed <Outlet>
│   ├── Sidebar.jsx / Topbar.jsx
│   ├── ProtectedRoute.jsx  Route guards (auth required / public-only / admin-only)
│   └── ErrorBoundary.jsx
├── context/ToastContext.jsx  App-wide toast notifications (useToast() hook)
├── hooks/useForm.js       Minimal controlled-form + validation hook
├── lib/api.js             Single fetch client: JSON headers, 401 refresh-and-retry,
│                           consistent error messages, optional retry/backoff
├── features/i18n.js       EN/HI copy dictionary
├── pages/                 One file per route (lazy-loaded — see App.jsx)
└── App.jsx                Route table
```

## Conventions

- **Data fetching** always goes through `src/lib/api.js` (`apiFetch` / `apiUpload`),
  never a raw `fetch()` in a page — this is what gives every page automatic token
  refresh and consistent error messages.
- **Notifications** use `useToast()` from `src/context/ToastContext.jsx` rather than
  a prop passed down from the page.
- **Routing**: pages live under `/app/*` and are guarded by `ProtectedRoute`; the
  landing/sign-in/sign-up pages are guarded by `PublicOnlyRoute` so a signed-in user
  is redirected straight to the dashboard.
- New shared visual patterns (a stat tile, a card header, a badge) belong in
  `src/components/ui/`, not copy-pasted as inline `style={{ ... }}` objects.
