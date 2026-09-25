import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import Providers from './app/Providers'
import { router } from './app/router'
import ErrorBoundary from './shared/layout/ErrorBoundary'
import './styles/app.css'

// The previous build used HashRouter. Translate old bookmarks (/#/app/crop) once.
if (window.location.hash.startsWith('#/')) {
  window.history.replaceState(null, '', window.location.hash.slice(1))
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </ErrorBoundary>
  </StrictMode>,
)
