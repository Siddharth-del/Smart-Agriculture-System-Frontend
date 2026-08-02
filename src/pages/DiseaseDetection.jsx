import { useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { getT } from '../features/i18n'
import { useToast } from '../context/ToastContext'
import { apiUpload } from '../lib/api'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function DiseaseDetection() {
  useDocumentTitle('Disease Detection')
  const addToast = useToast()
  const { token }       = useSelector(s => s.auth)
  const { lang }        = useSelector(s => s.settings)
  const t               = getT(lang)
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)
  const [drag, setDrag]       = useState(false)
  const [busy, setBusy]       = useState(false)
  const [result, setResult]   = useState(null)
  const ref = useRef()

  const pick = f => {
    if (!f) return
    setFile(f); setResult(null)
    const r = new FileReader()
    r.onload = e => setPreview(e.target.result)
    r.readAsDataURL(f)
  }

  const submit = async () => {
    if (!file) { addToast('Please upload a leaf image', 'error'); return }
    setBusy(true); setResult(null)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const data = await apiUpload('/api/disease/detect', fd, token)
      setResult(data)
      addToast('Disease analysis complete', 'success')
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
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, letterSpacing: '-.01em', marginBottom: 3 }}>
              {t.uploadLeaf}
            </div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>JPG / PNG — Max 10MB</div>
          </div>

          <div
            className={`upload-zone ${drag ? 'drag' : ''}`}
            onClick={() => ref.current?.click()}
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]) }}
          >
            {preview
              ? <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 210, objectFit: 'contain', borderRadius: 10 }} />
              : (
                <div>
                  <div style={{ width: 36, height: 36, background: 'var(--c-accent-light)', borderRadius: 8, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 14, height: 14, border: '2px solid var(--c-accent)', borderRadius: 2 }} />
                  </div>
                  <p style={{ fontSize: 13.5, color: 'var(--c-text2)', fontWeight: 500 }}>
                    {t.drop} <span style={{ color: 'var(--c-accent)', fontWeight: 700 }}>{t.browse}</span>
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 6, opacity: .7 }}>
                    Close-up, well-lit images give the best results
                  </p>
                </div>
              )
            }
          </div>

          <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => pick(e.target.files[0])} />

          {file && (
            <p style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
              {file.name}
            </p>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {file && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setFile(null); setPreview(null); setResult(null) }}>
                Clear
              </button>
            )}
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={submit} disabled={busy || !file}>
              {busy ? <><div className="spinner" />{t.detecting}</> : t.detect}
            </button>
          </div>
        </div>

        <div>
          {result ? (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {result.predicted?.map((p, i) => (
                <div key={i} style={{
                  background: 'var(--c-rail)',
                  borderRadius: 'var(--r-xl)',
                  padding: '26px 28px',
                  color: '#fff',
                }}>
                  <div style={{ fontSize: 10, opacity: .65, marginBottom: 8, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>
                    Detected Disease
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 5, letterSpacing: '-.02em' }}>
                    {p.diseaseName?.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: 13, opacity: .72, marginBottom: 10 }}>
                    Confidence: {((p.confidence || 0) * 100).toFixed(1)}%
                  </div>
                  <div className="conf-bar">
                    <div className="conf-fill" style={{ width: `${(p.confidence || 0) * 100}%` }} />
                  </div>
                </div>
              ))}

              <div className="card card-p">
                {result.fertilizerSuggestion && (
                  <div className="advisory">
                    <h4>Fertilizer Suggestion</h4>
                    <p>{result.fertilizerSuggestion}</p>
                  </div>
                )}
                {result.pesticideSuggestion && (
                  <div className="advisory" style={{ borderLeftColor: 'var(--c-amber)' }}>
                    <h4 style={{ color: 'var(--c-amber)' }}>Pesticide Suggestion</h4>
                    <p>{result.pesticideSuggestion}</p>
                  </div>
                )}
                {result.explanation && (
                  <div className="advisory" style={{ borderLeftColor: 'var(--c-blue)' }}>
                    <h4 style={{ color: 'var(--c-blue)' }}>AI Explanation</h4>
                    <p>{result.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card" style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="empty">
                <div className="empty-label" />
                <h3>{t.noAnalysis}</h3>
                <p>{t.uploadFirst}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
