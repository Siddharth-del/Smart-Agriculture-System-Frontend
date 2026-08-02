import { useLocation } from 'react-router-dom'

const meta = {
  dashboard:  'Dashboard',
  crop:       'Crop Advisory',
  disease:    'Disease Detection',
  ai:         'AI Advisory',
  weather:    'Weather',
  irrigation: 'Irrigation',
  profile:    'My Profile',
  admin:      'Farmers',
  help:       'Help & Support',
}

export default function Topbar() {
  const { pathname } = useLocation()
  const key = pathname.split('/').filter(Boolean)[1] || 'dashboard'
  const title = meta[key] || key

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-crumb">AgriPro</span>
        <h1>{title}</h1>
      </div>
    </header>
  )
}
