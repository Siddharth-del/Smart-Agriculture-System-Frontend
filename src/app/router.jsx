import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet, ScrollRestoration } from 'react-router-dom'
import { RequireAuth, RequireRole, PublicOnly, RoleHome } from '../features/auth/guards'
import { ROLES } from '../features/auth/authSlice'
import AppShell from '../shared/layout/AppShell'
import SessionWatcher from '../shared/layout/SessionWatcher'
import { PageLoader } from '../shared/layout/PageLoader'
import ErrorBoundary from '../shared/layout/ErrorBoundary'

const { FARMER, ADMIN, AGRONOMIST } = ROLES

// Each page is its own chunk, downloaded on first visit.
const Landing = lazy(() => import('../features/landing/LandingPage'))
const SignIn = lazy(() => import('../features/auth/SignInPage'))
const SignUp = lazy(() => import('../features/auth/SignUpPage'))
const ForgotPassword = lazy(() => import('../features/auth/ForgotPasswordPage'))
const VerifyCode = lazy(() => import('../features/auth/VerifyCodePage'))
const ResetPassword = lazy(() => import('../features/auth/ResetPasswordPage'))
const FarmerDashboard = lazy(() => import('../features/dashboard/FarmerDashboardPage'))
const FieldMonitor = lazy(() => import('../features/sensors/FieldMonitorPage'))
const Weather = lazy(() => import('../features/weather/WeatherPage'))
const CropPlanner = lazy(() => import('../features/crop/CropPlannerPage'))
const PlantDoctor = lazy(() => import('../features/disease/PlantDoctorPage'))
const Assistant = lazy(() => import('../features/assistant/AssistantPage'))
const Profile = lazy(() => import('../features/profile/ProfilePage'))
const AdminOverview = lazy(() => import('../features/admin/AdminOverviewPage'))
const AdminFarmers = lazy(() => import('../features/admin/FarmersPage'))
const AdminSystem = lazy(() => import('../features/admin/SystemPage'))
const Agronomist = lazy(() => import('../features/agronomist/AgronomistPage'))
const Help = lazy(() => import('../features/help/HelpPage'))
const NotFound = lazy(() => import('../features/errors/NotFoundPage'))

function Root() {
  return (
    <ErrorBoundary>
      <SessionWatcher />
      <ScrollRestoration />
      <Suspense fallback={<div className="shell-main"><PageLoader /></div>}><Outlet /></Suspense>
    </ErrorBoundary>
  )
}

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        element: <PublicOnly />,
        children: [
          { path: '/', element: <Landing /> },
          { path: '/signin', element: <SignIn /> },
          { path: '/signup', element: <SignUp /> },
          { path: '/forgot-password', element: <ForgotPassword /> },
          { path: '/verify-code', element: <VerifyCode /> },
          { path: '/reset-password', element: <ResetPassword /> },
        ],
      },
      {
        path: '/app',
        element: <RequireAuth />,
        children: [{
          element: <AppShell />,
          children: [
            { index: true, element: <RoleHome /> },
            { element: <RequireRole roles={[FARMER]} />, children: [
              { path: 'dashboard', element: <FarmerDashboard /> },
              { path: 'profile', element: <Profile /> },
            ] },
            { element: <RequireRole roles={[FARMER, AGRONOMIST]} />, children: [
              { path: 'field', element: <FieldMonitor /> },
            ] },
            { element: <RequireRole roles={[FARMER, ADMIN]} />, children: [
              { path: 'crop-planner', element: <CropPlanner /> },
              { path: 'plant-doctor', element: <PlantDoctor /> },
              { path: 'assistant', element: <Assistant /> },
            ] },
            { element: <RequireRole roles={[AGRONOMIST]} />, children: [
              { path: 'agronomist', element: <Agronomist /> },
            ] },
            { element: <RequireRole roles={[ADMIN]} />, children: [
              { path: 'admin', element: <AdminOverview /> },
              { path: 'admin/farmers', element: <AdminFarmers /> },
              { path: 'admin/system', element: <AdminSystem /> },
            ] },
            { path: 'weather', element: <Weather /> },
            { path: 'help', element: <Help /> },
            // Old URLs from the previous frontend keep working.
            { path: 'crop', element: <RedirectTo to="/app/crop-planner" /> },
            { path: 'disease', element: <RedirectTo to="/app/plant-doctor" /> },
            { path: 'ai', element: <RedirectTo to="/app/assistant" /> },
            { path: 'irrigation', element: <RedirectTo to="/app/field" /> },
            { path: '*', element: <NotFound /> },
          ],
        }],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
])

function RedirectTo({ to }) { return <Navigate to={to} replace /> }
