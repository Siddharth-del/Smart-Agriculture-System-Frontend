import { Suspense, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Menu, X, LogOut, Moon, Sun, Monitor, Languages, WifiOff, Leaf, MoreHorizontal } from 'lucide-react'
import { navForRoles } from '../../app/navigation'
import { selectRoles, selectUser, signedOut, userVerified } from '../../features/auth/authSlice'
import { useCurrentUserQuery, useSignOutMutation } from '../../features/auth/authApi'
import { setLang, setTheme } from '../../app/settingsSlice'
import { useOnlineStatus } from '../hooks'
import { useT } from '../../i18n/useT'
import { PageLoader } from './PageLoader'
import ErrorBoundary from './ErrorBoundary'

const ROLE_LABEL = { ADMIN: 'Administrator', AGRONOMIST: 'Agronomist', FARMER: 'Farmer' }

function Brand() {
  return (
    <NavLink to="/app" className="shell-brand" aria-label="AgriPro home">
      <span className="shell-brand__mark"><Leaf size={18} aria-hidden="true" /></span>
      <span className="shell-brand__name">AgriPro</span>
    </NavLink>
  )
}

function NavList({ groups, t, onNavigate }) {
  return (
    <nav aria-label="Main">
      {groups.map((g) => (
        <div key={g.group} className="shell-nav__group">
          <p className="shell-nav__heading">{t(g.group)}</p>
          <ul>
            {g.items.map((i) => (
              <li key={i.to}>
                <NavLink to={i.to} end={i.end} className="shell-nav__link" onClick={onNavigate}>
                  <i.icon size={18} aria-hidden="true" /><span>{t(i.key)}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export default function AppShell() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const t = useT()
  const user = useSelector(selectUser)
  const roles = useSelector(selectRoles)
  const { theme, lang } = useSelector((s) => s.settings)
  const online = useOnlineStatus()
  const [drawer, setDrawer] = useState(false)
  const mainRef = useRef(null)
  const groups = navForRoles(roles)
  const primary = groups.flatMap((g) => g.items).filter((i) => i.primary).slice(0, 4)

  // Server is the authority on roles: re-verify the stored session on load.
  const me = useCurrentUserQuery(undefined, { refetchOnFocus: false })
  useEffect(() => { if (me.data?.username) dispatch(userVerified(me.data)) }, [me.data, dispatch])

  const [signOutReq] = useSignOutMutation()
  const signOut = async () => {
    try { await signOutReq().unwrap() } catch { /* clear locally regardless */ }
    dispatch(signedOut())
    navigate('/signin', { replace: true })
  }

  // Close the drawer and move focus to the page on every navigation.
  useEffect(() => {
    setDrawer(false)
    mainRef.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [location.pathname])

  const cycleTheme = () => dispatch(setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'))
  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  const userBlock = (
    <div className="shell-user">
      <span className="shell-user__avatar" aria-hidden="true">{user?.username?.[0]?.toUpperCase()}</span>
      <div className="shell-user__meta">
        <span className="shell-user__name">{user?.username}</span>
        <span className="shell-user__role">{roles.map((r) => ROLE_LABEL[r]).join(', ')}</span>
      </div>
      <button type="button" className="ui-iconbtn" onClick={signOut} aria-label={t('signout')} title={t('signout')}>
        <LogOut size={18} />
      </button>
    </div>
  )

  return (
    <div className="shell">
      <a href="#main" className="skip-link-app">Skip to content</a>

      <aside className="shell-sidebar">
        <Brand />
        <div className="shell-sidebar__scroll"><NavList groups={groups} t={t} /></div>
        {userBlock}
      </aside>

      <div className={`shell-drawer ${drawer ? 'is-open' : ''}`} aria-hidden={!drawer}>
        <div className="shell-drawer__backdrop" onClick={() => setDrawer(false)} />
        <div className="shell-drawer__panel" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="shell-drawer__top">
            <Brand />
            <button type="button" className="ui-iconbtn" onClick={() => setDrawer(false)} aria-label="Close menu"><X size={20} /></button>
          </div>
          <div className="shell-sidebar__scroll"><NavList groups={groups} t={t} onNavigate={() => setDrawer(false)} /></div>
          {userBlock}
        </div>
      </div>

      <div className="shell-body">
        <header className="shell-topbar">
          <button type="button" className="ui-iconbtn shell-topbar__menu" onClick={() => setDrawer(true)} aria-label="Open menu" aria-expanded={drawer}>
            <Menu size={20} />
          </button>
          <div className="shell-topbar__brand-mobile"><Brand /></div>
          <div className="shell-topbar__spacer" />
          {!online && <span className="ui-badge ui-tone--warning"><WifiOff size={13} aria-hidden="true" />Offline</span>}
          <button type="button" className="ui-iconbtn" onClick={() => dispatch(setLang(lang === 'en' ? 'hi' : 'en'))} aria-label={`${t('language')}: ${lang === 'en' ? 'English' : 'हिन्दी'}`} title={t('language')}>
            <Languages size={18} />
          </button>
          <button type="button" className="ui-iconbtn" onClick={cycleTheme} aria-label={`${t('theme')}: ${theme}`} title={`${t('theme')}: ${theme}`}>
            <ThemeIcon size={18} />
          </button>
        </header>

        {!online && <div className="shell-offline" role="status"><WifiOff size={16} aria-hidden="true" />{t('offline')}</div>}

        <main id="main" ref={mainRef} tabIndex={-1} className="shell-main">
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<PageLoader />}><Outlet /></Suspense>
          </ErrorBoundary>
        </main>
      </div>

      <nav className="shell-tabbar" aria-label="Quick navigation">
        {primary.map((i) => (
          <NavLink key={i.to} to={i.to} end={i.end} className="shell-tabbar__item">
            <i.icon size={20} aria-hidden="true" /><span>{t(`tab_${i.key}`, t(i.key))}</span>
          </NavLink>
        ))}
        <button type="button" className="shell-tabbar__item" onClick={() => setDrawer(true)}>
          <MoreHorizontal size={20} aria-hidden="true" /><span>{t('more')}</span>
        </button>
      </nav>
    </div>
  )
}
