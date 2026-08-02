import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { PageSkeleton } from './ui'

export default function AppLayout() {
  return (
    <div className="layout">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Sidebar />
      <div className="main-area">
        <Topbar />
        <main id="main-content" className="content-area" tabIndex={-1}>
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
