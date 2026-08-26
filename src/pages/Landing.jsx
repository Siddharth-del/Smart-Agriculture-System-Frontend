import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Droplets, Sprout, CloudSun, Mail, ScanLine, Gauge,
  ArrowRight, Menu, X, Check, Languages,
} from 'lucide-react'
import { setLang } from '../app/store'
import { getT } from '../features/i18n'

function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, visible] = useInView()
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: `opacity .5s ease ${delay}s, transform .5s ease ${delay}s`,
    }}>
      {children}
    </div>
  )
}

const FEATURE_DEFS = [
  { icon: Droplets, titleKey: 'featIrrigTitle', descKey: 'featIrrigDesc' },
  { icon: Gauge, titleKey: 'featSensorTitle', descKey: 'featSensorDesc' },
  { icon: CloudSun, titleKey: 'featWeatherTitle', descKey: 'featWeatherDesc' },
  { icon: Mail, titleKey: 'featEmailTitle', descKey: 'featEmailDesc' },
  { icon: Sprout, titleKey: 'featCropTitle', descKey: 'featCropDesc' },
  { icon: ScanLine, titleKey: 'featDiseaseTitle', descKey: 'featDiseaseDesc' },
]

const STEP_DEFS = [
  { num: '01', titleKey: 'step1Title', descKey: 'step1Desc' },
  { num: '02', titleKey: 'step2Title', descKey: 'step2Desc' },
  { num: '03', titleKey: 'step3Title', descKey: 'step3Desc' },
]

const STAT_DEFS = [
  { value: '40%', labelKey: 'statWater' },
  { value: '25%', labelKey: 'statYield' },
  { value: '60%', labelKey: 'statEffort' },
  { value: '24/7', labelKey: 'statMonitor' },
]

export default function Landing() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { lang } = useSelector(s => s.settings)
  const t = getT(lang)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { key: 'features', label: t.navFeatures },
    { key: 'how-it-works', label: t.navHow },
    { key: 'benefits', label: t.navBenefits },
  ]

  const toggleLang = () => dispatch(setLang(lang === 'hi' ? 'en' : 'hi'))
  const langButton = (extraClass = '') => (
    <button
      className={`btn btn-ghost btn-sm ${extraClass}`}
      onClick={toggleLang}
      aria-label={lang === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
    >
      <Languages size={14} strokeWidth={2} /> {lang === 'hi' ? 'English' : 'हिंदी'}
    </button>
  )

  return (
    <div className="land-page">
      <a href="#land-main" className="skip-link">{t.skipToContent}</a>
      {/* Nav */}
      <header className={`land-header${scrolled ? ' is-scrolled' : ''}`}>
        <div className="land-header-inner">
          <div className="land-brand">
            <div className="land-brand-mark" />
            <span className="land-brand-name">AgriPro</span>
          </div>

          <nav className="land-nav-links">
            {navLinks.map(l => <a key={l.key} href={`#${l.key}`}>{l.label}</a>)}
          </nav>

          <div className="land-nav-actions">
            {langButton()}
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/signin')}>{t.login}</button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/signup')}>{t.signup} <ArrowRight size={14} strokeWidth={2} /></button>
          </div>

          <button
            className="land-mob-toggle"
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="land-mob-menu">
            <div className="land-mob-menu-inner">
              {navLinks.map(l => (
                <a key={l.key} href={`#${l.key}`} onClick={() => setMobileOpen(false)}>{l.label}</a>
              ))}
              <div className="land-mob-menu-actions">
                {langButton()}
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/signin')}>{t.login}</button>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/signup')}>{t.signup}</button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero — full-bleed animated photo, single centered column (no data card) */}
      <section className="land-hero land-hero--simple" id="land-main">
        <div className="land-hero-bg" aria-hidden="true" />
        <div className="land-hero-scrim land-hero-scrim--center" aria-hidden="true" />
        <div className="land-hero-inner land-hero-inner--simple">
          <span className="land-eyebrow"><span className="land-eyebrow-dot" aria-hidden="true" /> {t.liveStatus}</span>
          <h1 className="land-hero-title fade-up">
            {t.heroTitleA}<br /><em>{t.heroTitleEm}</em> {t.heroTitleB}
          </h1>
          <p className="land-hero-sub fade-up">{t.heroSub}</p>
          <div className="land-hero-actions fade-up">
            <button className="btn btn-primary" onClick={() => navigate('/signup')}>
              {t.getStarted} <ArrowRight size={16} strokeWidth={2} />
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/signin')}>
              {t.logInDash}
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="land-section">
        <div className="land-section-inner">
          <Reveal className="land-section-head">
            <div className="section-label">{t.featuresLabel}</div>
            <h2 className="land-section-title">{t.featuresTitle}</h2>
          </Reveal>
          <div className="g3 land-feature-grid">
            {FEATURE_DEFS.map((f, i) => (
              <Reveal key={f.titleKey} delay={i * 0.05}>
                <div className="card card-p land-feature-card">
                  <div className="land-feature-icon">
                    <f.icon size={17} strokeWidth={1.75} color="var(--c-accent)" />
                  </div>
                  <h3 className="land-feature-title">{t[f.titleKey]}</h3>
                  <p className="land-feature-desc">{t[f.descKey]}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="land-section land-section-alt">
        <div className="land-section-inner--narrow">
          <Reveal className="land-section-head">
            <div className="section-label">{t.howLabel}</div>
            <h2 className="land-section-title">{t.howTitle}</h2>
          </Reveal>
          <div>
            {STEP_DEFS.map((s, i) => (
              <Reveal key={s.num} delay={i * 0.08}>
                <div className="land-step">
                  <span className="land-step-num">{s.num}</span>
                  <div>
                    <h3 className="land-step-title">{t[s.titleKey]}</h3>
                    <p className="land-step-desc">{t[s.descKey]}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits / stats band */}
      <section id="benefits" className="land-stats-band">
        <div className="land-stats-band-inner">
          <Reveal>
            <h2 className="land-stats-band-title">{t.statsTitle}</h2>
          </Reveal>
          <div className="g4 land-stats-grid">
            {STAT_DEFS.map((s, i) => (
              <Reveal key={s.labelKey} delay={i * 0.06}>
                <div className="land-stat-cell" style={{ textAlign: 'center', padding: '20px 12px', borderLeft: i > 0 ? '1px solid rgba(255,255,255,.1)' : 'none' }}>
                  <div className="land-stat-value">{s.value}</div>
                  <div className="land-stat-label">{t[s.labelKey]}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="land-cta">
        <Reveal>
          <h2 className="land-cta-title">{t.ctaTitle}</h2>
          <p className="land-cta-sub">{t.ctaSub}</p>
          <div className="land-cta-actions">
            <button className="btn btn-primary" onClick={() => navigate('/signup')}>
              {t.ctaCreate} <ArrowRight size={16} strokeWidth={2} />
            </button>
          </div>
          <div className="land-cta-points">
            {[t.ctaFree, t.ctaSetup, t.ctaCancel].map(txt => (
              <span key={txt} className="land-cta-point">
                <Check size={14} strokeWidth={2} color="var(--c-green)" /> {txt}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      <footer className="footer">
        <div className="footer-grid">
          <div>
            <h3>AgriPro</h3>
            <p>{t.footerTagline}</p>
          </div>
          <div>
            <h4>{t.footerHelp}</h4>
            <ul>
              {/* No support inbox exists yet — GitHub Issues is the real, working
                  contact channel today. Swap in a mailto: once you have one. */}
              <li><a href="https://github.com/Siddharth-del/Smart-Agriculture-System-Frontend/issues" target="_blank" rel="noopener noreferrer">{t.footerReport}</a></li>
              <li><a href="https://github.com/Siddharth-del" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              <li><a href="https://www.linkedin.com/in/siddharth-java-dev" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            </ul>
          </div>
          <div>
            <h4>{t.footerModules}</h4>
            <ul>
              <li>{t.crop}</li>
              <li>{t.disease}</li>
              <li>{t.weather}</li>
              <li>{t.irrigation}</li>
            </ul>
          </div>
          <div>
            <h4>{t.footerResources}</h4>
            <ul><li><a href="#">{t.footerDocs}</a></li></ul>
          </div>
        </div>
        <div className="footer-bottom">&copy; 2026 AgriPro &middot; Built by Siddharth</div>
      </footer>
    </div>
  )
}
