import { useState } from 'react'
import { useSelector } from 'react-redux'
import { getT } from '../features/i18n'
import { useToast } from '../context/ToastContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export default function AiAdvisory() {
  useDocumentTitle('AI Advisory')
  const addToast = useToast()
  const { token }   = useSelector(s => s.auth)
  const { lang }    = useSelector(s => s.settings)
  const t           = getT(lang)
  const [mode, setMode]       = useState('disease')
  const [aiLang, setAiLang]   = useState('English')
  const [disease, setDisease] = useState('')
  const [crop, setCrop]       = useState('')
  const [sensor, setSensor]   = useState({ temperature: '', humidity: '', nitrogen: '', phosphorus: '', potassium: '', Rainfall: '' })
  const [busy, setBusy]       = useState(false)
  const [result, setResult]   = useState(null)

  const submit = async () => {
    setBusy(true); setResult(null)
    try {
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      let data
      if (mode === 'disease') {
        if (!disease.trim()) { addToast(`Enter ${t.diseaseName}`, 'error'); setBusy(false); return }
        const res = await fetch(`${BASE}/api/ai/disease?disease=${encodeURIComponent(disease)}&lang=${aiLang}`, { method: 'POST', headers })
        data = await res.json()
      } else {
        if (!crop.trim()) { addToast(`Enter ${t.cropName}`, 'error'); setBusy(false); return }
        const body = {}
        Object.keys(sensor).forEach(k => { body[k] = parseFloat(sensor[k]) || 0 })
        const res = await fetch(`${BASE}/api/ai/crop?crop=${encodeURIComponent(crop)}&lang=${aiLang}`, { method: 'POST', headers, body: JSON.stringify(body) })
        data = await res.json()
      }
      setResult(data)
      addToast('Advisory generated', 'success')
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
          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 24, background: 'var(--c-surface2)', padding: 3, borderRadius: 11, border: '1px solid var(--c-border)' }}>
            {[['disease', t.diseaseAdv], ['crop', t.cropAdv]].map(([m, lbl]) => (
              <button
                key={m}
                onClick={() => { setMode(m); setResult(null) }}
                style={{
                  flex: 1,
                  padding: '8px 14px',
                  borderRadius: 9,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12.5,
                  fontWeight: 700,
                  fontFamily: 'var(--font-body)',
                  transition: 'all .16s',
                  background: mode === m ? 'var(--c-surface)' : 'transparent',
                  color: mode === m ? 'var(--c-accent)' : 'var(--c-muted)',
                  boxShadow: mode === m ? 'var(--shadow-xs)' : 'none',
                  letterSpacing: '.01em',
                }}
              >
                {lbl}
              </button>
            ))}
          </div>

          <div className="input-group" style={{ marginBottom: 18 }}>
            <label className="label">Response Language</label>
            <select className="input select" value={aiLang} onChange={e => setAiLang(e.target.value)}>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>

          {mode === 'disease' ? (
            <div className="input-group" style={{ marginBottom: 22 }}>
              <label className="label">{t.diseaseName}</label>
              <input
                className="input"
                placeholder="e.g. Leaf Rust, Blight, Blast"
                value={disease}
                onChange={e => setDisease(e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="input-group" style={{ marginBottom: 16 }}>
                <label className="label">{t.cropName}</label>
                <input
                  className="input"
                  placeholder="e.g. Wheat, Rice, Cotton"
                  value={crop}
                  onChange={e => setCrop(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--c-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Sensor Data (optional)
                </div>
                <div className="fg" style={{ marginBottom: 22, gap: 12 }}>
                  {Object.keys(sensor).map(k => (
                    <div className="input-group" key={k}>
                      <label className="label">{k.charAt(0).toUpperCase() + k.slice(1)}</label>
                      <input
                        className="input"
                        type="number"
                        placeholder="0.0"
                        value={sensor[k]}
                        onChange={e => setSensor(p => ({ ...p, [k]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <button className="btn btn-primary btn-full" onClick={submit} disabled={busy}>
            {busy ? <><div className="spinner" />{t.generating}</> : t.getAdv}
          </button>
        </div>

        <div>
          {result ? (
            <div className="card card-p fade-in">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 20, letterSpacing: '-.01em' }}>
                Advisory Result
              </div>
              {[
                ['fertilizerRecommendation', t.fertRec, 'var(--c-accent)'],
                ['pesticideRecommendation',  t.pestRec, 'var(--c-amber)'],
                ['explanation',              t.explanation, 'var(--c-blue)'],
              ].map(([key, lbl, color]) => result[key] && (
                <div key={key} className="advisory" style={{ borderLeftColor: color }}>
                  <h4 style={{ color }}>{lbl.toUpperCase()}</h4>
                  <p>{result[key]}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="empty">
                <div className="empty-label" />
                <h3>Ready for your query</h3>
                <p>Select type, enter details, and generate</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
