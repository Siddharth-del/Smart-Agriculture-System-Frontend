import { useState } from 'react'
import { useSelector } from 'react-redux'
import { getT } from '../features/i18n'
import { useToast } from '../context/ToastContext'
import { apiFetch } from '../lib/api'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function CropAdvisory() {
  useDocumentTitle('Crop Advisory')
  const addToast = useToast()
  const { token }   = useSelector(s => s.auth)
  const { lang }    = useSelector(s => s.settings)
  const t           = getT(lang)
  const [form, set] = useState({ rainfall: '', ph: '', nitrogen: '', phosphorus: '', potassium: '', location: 'Delhi' })
  const [busy, setBusy]     = useState(false)
  const [result, setResult] = useState(null)

  const fields = [
    { k: 'rainfall',   l: 'Rainfall (mm)',   ph: '800' },
    { k: 'ph',         l: 'Soil pH',         ph: '6.5' },
    { k: 'nitrogen',   l: 'Nitrogen (N)',     ph: '90' },
    { k: 'phosphorus', l: 'Phosphorus (P)',   ph: '42' },
    { k: 'potassium',  l: 'Potassium (K)',    ph: '43' },
    { k: 'location',   l: 'City / Location', ph: 'Delhi', text: true },
  ]

  const submit = async () => {
    for (const f of fields) {
      if (!form[f.k]) { addToast(`Enter ${f.l}`, 'error'); return }
    }
    setBusy(true); setResult(null)
    try {
      const payload = {}
      fields.forEach(f => {
        payload[f.k] = f.text ? form[f.k] : parseFloat(form[f.k])
      })
      const data = await apiFetch('/api/ml/recommend-crop', { method: 'POST', body: JSON.stringify(payload) }, token)
      setResult(data)
      addToast('Crop recommendation ready', 'success')
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="g2" style={{ alignItems: 'start' }}>
        <div className="card card-p fade-up">
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, letterSpacing: '-.01em', marginBottom: 3 }}>
              {t.soilParams}
            </div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>
              Enter soil and environment values from your lab report
            </div>
          </div>

          <div className="fg" style={{ marginBottom: 22 }}>
            {fields.map(f => (
              <div className="input-group" key={f.k}>
                <label className="label">{f.l}</label>
                <input
                  className="input"
                  type={f.text ? 'text' : 'number'}
                  placeholder={f.ph}
                  value={form[f.k]}
                  onChange={e => set(p => ({ ...p, [f.k]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <button className="btn btn-primary btn-full" onClick={submit} disabled={busy}>
            {busy ? <><div className="spinner" />{t.analyzing}</> : t.recommend}
          </button>
        </div>

        <div>
          {result ? (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="result-hero">
                <div style={{ fontSize: 10, opacity: .65, marginBottom: 8, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>
                  {t.recCrop}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 700, marginBottom: 6, letterSpacing: '-.02em' }}>
                  {result.cropName || result.CropName}
                </div>
                <div style={{ fontSize: 13, opacity: .7, marginBottom: 10 }}>
                  {t.confidence}: {((result.cropConfidence || 0) * 100).toFixed(1)}%
                </div>
                <div className="conf-bar">
                  <div className="conf-fill" style={{ width: `${(result.cropConfidence || 0) * 100}%` }} />
                </div>
              </div>

              {result.explanation && (
                <div className="card card-p">
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 12, letterSpacing: '-.01em' }}>
                    AI Explanation
                  </div>
                  <p style={{ fontSize: 13.5, lineHeight: 1.75, color: 'var(--c-text2)' }}>{result.explanation}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="empty">
                <div className="empty-label" />
                <h3>{t.noPred}</h3>
                <p>{t.fillSoil}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
