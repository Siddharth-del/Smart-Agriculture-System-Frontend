import { useState } from 'react'
import { useSelector } from 'react-redux'
import { getT } from '../features/i18n'
import { useToast } from '../context/ToastContext'
import { apiFetch } from '../lib/api'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function Weather() {
  useDocumentTitle('Weather')
  const addToast = useToast()
  const { token }   = useSelector(s => s.auth)
  const { lang }    = useSelector(s => s.settings)
  const t           = getT(lang)
  const [city, setCity] = useState('')
  const [busy, setBusy] = useState(false)
  const [data, setData] = useState(null)

  const fetch_ = async (c) => {
    const q = c || city
    if (!q.trim()) { addToast(t.cityNF, 'error'); return }
    setBusy(true)
    try {
      const res = await apiFetch(`/api/weather/city/${encodeURIComponent(q.trim())}`, {}, token)
      setData(res)
      if (c) setCity(c)
    } catch {
      addToast(t.cityNF, 'error')
    } finally {
      setBusy(false)
    }
  }

  const cities = ['Delhi', 'Sikandrabad', 'Mumbai', 'Pune', 'Hyderabad', 'Jaipur', 'Mathura', 'Lucknow', 'Nagpur']

  return (
    <div className="page">
      <div style={{ maxWidth: 580 }}>
        <div className="card card-p fade-up" style={{ marginBottom: 22 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, letterSpacing: '-.01em', marginBottom: 14 }}>
            {t.searchCity}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input
              className="input"
              style={{ flex: 1 }}
              placeholder={t.enterCity}
              value={city}
              onChange={e => setCity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetch_()}
            />
            <button className="btn btn-primary" onClick={() => fetch_()} disabled={busy} style={{ minWidth: 46 }}>
              {busy ? <div className="spinner" /> : 'Go'}
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {cities.map(c => (
              <button key={c} className="badge badge-muted" onClick={() => fetch_(c)}>{c}</button>
            ))}
          </div>
        </div>

        {data && (
          <div className="fade-in">
            <div className="weather-hero" style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, opacity: .6, marginBottom: 6, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                {data.name}, {data.sys?.country}
              </div>
              <div className="weather-temp">{Math.round(data.main?.temp)}°</div>
              <div style={{ fontSize: 14.5, opacity: .7, textTransform: 'capitalize', marginTop: 8, fontWeight: 400 }}>
                {data.weather?.[0]?.description}
              </div>
              <div style={{ display: 'flex', gap: 36, marginTop: 22 }}>
                {[
                  [t.humidity, `${data.main?.humidity}%`],
                  [t.wind,     `${data.wind?.speed} m/s`],
                  [t.pressure, `${data.main?.pressure} hPa`],
                ].map(([lbl, val]) => (
                  <div key={lbl}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>{val}</div>
                    <div style={{ fontSize: 12, opacity: .6, marginTop: 3 }}>{lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="g3">
              {[
                [t.humidity, `${data.main?.humidity}%`,   'var(--c-blue)'],
                [t.wind,     `${data.wind?.speed} m/s`,   'var(--c-accent)'],
                [t.pressure, `${data.main?.pressure} hPa`, 'var(--c-amber)'],
              ].map(([lbl, val, color]) => (
                <div key={lbl} className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color }}>{val}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--c-muted)', marginTop: 5, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase' }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
