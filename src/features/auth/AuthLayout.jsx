import { Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'

export default function AuthLayout({ title, description, children, footer }) {
  return (
    <div className="auth">
      <div className="auth__aside" aria-hidden="true">
        <div className="auth__aside-inner">
          <p className="auth__quote">Water when the soil asks for it, not when the calendar does.</p>
          <ul className="auth__points">
            <li>Live soil moisture from your ESP32 sensors</li>
            <li>Leaf photo diagnosis with treatment advice</li>
            <li>Crop suggestions from your soil test and local weather</li>
          </ul>
        </div>
      </div>
      <main className="auth__main" id="main">
        <div className="auth__card">
          <Link to="/" className="shell-brand auth__brand">
            <span className="shell-brand__mark"><Leaf size={18} aria-hidden="true" /></span>
            <span className="shell-brand__name">AgriPro</span>
          </Link>
          <h1 className="auth__title">{title}</h1>
          {description && <p className="auth__desc">{description}</p>}
          {children}
          {footer && <div className="auth__footer">{footer}</div>}
        </div>
      </main>
    </div>
  )
}
