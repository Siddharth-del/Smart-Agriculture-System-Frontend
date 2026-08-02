import { lazy, Suspense, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import ProtectedRoute, { PublicOnlyRoute, AdminRoute } from './components/ProtectedRoute'
import { PageSkeleton } from './components/ui'

// Route-level code splitting: each page ships as its own chunk and is
// only downloaded when the user actually navigates to it.
const Landing          = lazy(() => import('./pages/Landing'))
const AuthPage         = lazy(() => import('./pages/Auth'))
const Dashboard        = lazy(() => import('./pages/Dashboard'))
const CropAdvisory     = lazy(() => import('./pages/CropAdvisory'))
const DiseaseDetection = lazy(() => import('./pages/DiseaseDetection'))
const AiAdvisory       = lazy(() => import('./pages/AiAdvisory'))
const Weather          = lazy(() => import('./pages/Weather'))
const Irrigation       = lazy(() => import('./pages/Irrigation'))
const FarmerProfile    = lazy(() => import('./pages/FarmerProfile'))
const AdminFarmers     = lazy(() => import('./pages/AdminFarmers'))
const Help             = lazy(() => import('./pages/Help'))

function PublicPage({ children }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
}

export default function App() {
  const { theme, lang } = useSelector(s => s.settings)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang)
  }, [lang])

  return (
    <Routes>
      {/* Public-only: landing / sign-in / sign-up redirect away once authenticated */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/" element={<PublicPage><Landing /></PublicPage>} />
        <Route path="/signin" element={<PublicPage><AuthPage mode="signin" /></PublicPage>} />
        <Route path="/signup" element={<PublicPage><AuthPage mode="signup" /></PublicPage>} />
      </Route>

      {/* Authenticated app shell */}
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="crop" element={<CropAdvisory />} />
          <Route path="disease" element={<DiseaseDetection />} />
          <Route path="ai" element={<AiAdvisory />} />
          <Route path="weather" element={<Weather />} />
          <Route path="irrigation" element={<Irrigation />} />
          <Route path="profile" element={<FarmerProfile />} />
          <Route path="help" element={<Help />} />
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<AdminFarmers />} />
          </Route>
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
