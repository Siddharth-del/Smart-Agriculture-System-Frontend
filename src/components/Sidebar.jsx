import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { NavLink } from 'react-router-dom'
import {
  LayoutGrid, Sprout, ScanLine, Sparkles, CloudSun, Droplets,
  UserRound, Users, Moon, Sun, LogOut, HelpCircle,
} from 'lucide-react'
import { logout, toggleTheme, setLang } from '../app/store'
import { getT } from '../features/i18n'

export default function Sidebar() {
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)
  const { theme, lang } = useSelector(s => s.settings)
  const t = getT(lang)
  const isAdmin = user?.roles?.some(r => r.includes('ADMIN'))
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey) }
  }, [menuOpen])

  const items = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutGrid },
    { id: 'crop', label: t.crop, icon: Sprout },
    { id: 'disease', label: t.disease, icon: ScanLine },
    { id: 'ai', label: t.ai, icon: Sparkles },
    { id: 'weather', label: t.weather, icon: CloudSun },
    { id: 'irrigation', label: t.irrigation, icon: Droplets },
    ...(!isAdmin ? [{ id: 'profile', label: t.profile, icon: UserRound }] : []),
    ...(isAdmin ? [{ id: 'admin', label: t.admin, icon: Users }] : []),
    { id: 'help', label: t.help || 'Help', icon: HelpCircle },
  ]

  return (
    <aside className="rail">
      <NavLink to="/app/dashboard" className="rail-logo" aria-label={t.appName}>
        A
      </NavLink>

      <nav className="rail-nav" aria-label="Primary">
        {items.map(({ id, label, icon: Icon }) => (
          <NavLink
            key={id}
            to={`/app/${id}`}
            className={({ isActive }) => `rail-item ${isActive ? 'active' : ''}`}
            aria-label={label}
          >
            <Icon size={18} strokeWidth={1.75} />
            <span className="rail-tip" role="tooltip">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="rail-foot" ref={menuRef}>
        <button
          className="rail-item"
          onClick={() => dispatch(toggleTheme())}
          aria-label={theme === 'dark' ? t.lightMode : t.darkMode}
        >
          {theme === 'dark' ? <Sun size={17} strokeWidth={1.75} /> : <Moon size={17} strokeWidth={1.75} />}
          <span className="rail-tip" role="tooltip">{theme === 'dark' ? t.lightMode : t.darkMode}</span>
        </button>

        <div style={{ position: 'relative' }}>
          <button
            className="rail-avatar"
            onClick={() => setMenuOpen(v => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Account menu"
          >
            {user?.username?.[0]?.toUpperCase()}
          </button>

          {menuOpen && (
            <div className="rail-menu" role="menu">
              <div className="rail-menu-user">
                <div className="rail-menu-name">{user?.username}</div>
                <div className="rail-menu-role">{user?.roles?.map(r => r.replace('ROLE_', '')).join(', ')}</div>
              </div>
              <div className="rail-menu-item" role="menuitem" style={{ cursor: 'default' }}>
                <span style={{ flex: 1 }}>Language</span>
                <span style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '2px 8px', fontWeight: lang === 'en' ? 700 : 500, color: lang === 'en' ? 'var(--c-accent)' : 'var(--c-muted)' }}
                    onClick={() => dispatch(setLang('en'))}
                  >EN</button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '2px 8px', fontWeight: lang === 'hi' ? 700 : 500, color: lang === 'hi' ? 'var(--c-accent)' : 'var(--c-muted)' }}
                    onClick={() => dispatch(setLang('hi'))}
                  >HI</button>
                </span>
              </div>
              <button className="rail-menu-item danger" role="menuitem" onClick={() => dispatch(logout())}>
                <LogOut size={14} strokeWidth={1.75} />
                {t.signout}
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
