# AgriPro Frontend — Run Instructions

## Requirements
- Node.js 18+ and npm

## Setup
```bash
npm install
npm run dev
```
Then open the URL Vite prints (usually http://localhost:5173).

## Build for production
```bash
npm run build
npm run preview
```

## Backend
This frontend expects the Spring Boot AgriPro API. By default it points at
`http://localhost:8080`. To point it elsewhere, create a `.env` file in the
project root:
```
VITE_API_URL=https://your-backend-url
```

## What changed in this pass (landing page redesign)
- `src/pages/Landing.jsx` — rebuilt with class-based styling (was inline
  styles), new hero section.
- `src/global.css` — added the new hero/field-grid/section classes near the
  existing "Landing page nav" block. Nothing else in the file was touched.
- `public/hero-field.jpg` — the background photo for the hero. It's low-res
  (735x315) since it came from a compressed source image; swap in a
  2400px+ version of the same shot for a crisp production build.

## Second pass — improvements
- `index.html` — Open Graph/Twitter meta tags, preloaded the hero image (it's your LCP element).
- `src/global.css` — smooth scroll now respects `prefers-reduced-motion`; removed unused fake-avatar CSS.
- `src/pages/Landing.jsx` — added a skip-to-content link; footer "Email Support" (dead link) replaced with a working GitHub Issues link since there's no support inbox yet; GitHub/LinkedIn footer links now point to your real profiles; removed the fabricated user avatars next to the hero CTA (was implying real users that don't exist) in favor of an honest "Open source on GitHub" line; the field-grid hero visual now labels itself "Sample preview" with a caption instead of implying live production telemetry.
- `src/hooks/useDocumentTitle.js` (new) — lightweight per-page `<title>` hook, wired into all 11 pages, no new dependency added.
