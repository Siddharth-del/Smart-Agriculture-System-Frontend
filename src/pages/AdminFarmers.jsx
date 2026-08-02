import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { getT } from '../features/i18n'
import { useToast } from '../context/ToastContext'
import { apiFetch } from '../lib/api'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

function FarmerModal({ farmer, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20, backdropFilter: 'blur(4px)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="card"
        style={{ maxWidth: 460, width: '100%', padding: 30 }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="farmer-modal-title"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div id="farmer-modal-title" style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '-.02em' }}>{farmer.fullname || '—'}</div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 3 }}>@{farmer.username} · ID: {farmer.userId}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close details">Close ✕</button>
        </div>
        <div style={{ height: 1, background: 'var(--c-border)', margin: '0 0 20px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
          {[
            ['Email',         farmer.email],
            ['Contact',       farmer.contactNumber],
            ['Address',       farmer.address],
            ['Village',       farmer.village],
            ['District',      farmer.district],
            ['State',         farmer.state],
            ['Pincode',       farmer.pincode],
            ['Farm Location', farmer.farmLocation],
          ].filter(([, v]) => v).map(([lbl, val]) => (
            <div key={lbl}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--c-muted)', marginBottom: 4 }}>{lbl}</div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--c-text)', lineHeight: 1.4 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Crop lookup sub-panel ──────────────────────────────────────────────────────
function CropByName({ token, addToast }) {
  const [name, setName]       = useState('')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const search = async () => {
    const q = name.trim()
    if (!q) { setError('Enter a crop name'); return }
    setLoading(true); setResult(null); setError('')
    try {
     const data = await apiFetch(`/api/ml/crop/${encodeURIComponent(q)}`, {}, token)
      setResult(data[0])
    } catch (e) {
      setError(`No crop found for "${q}"`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>
      <div className="card card-p">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Find Crop by Name</div>
        <div style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 18 }}>Search the crop database by crop name.</div>

        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="input"
            placeholder="e.g. Wheat, Rice, Maize …"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); setResult(null) }}
            onKeyDown={e => e.key === 'Enter' && search()}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            onClick={search}
            disabled={loading || !name.trim()}
            style={{ flexShrink: 0, minWidth: 100 }}
          >
            {loading ? <><div className="spinner" /> Searching</> : 'Search'}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--c-red-light)', border: '1px solid var(--c-red)', borderRadius: 10, fontSize: 13, color: 'var(--c-red)' }}>
            ✕ {error}
          </div>
        )}
      </div>

      {result && (
        <div className="card card-p fade-up">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{result.name}</div>
          <div style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 18 }}>ID: {result.id ?? result.cropId ?? '—'}</div>
          <div style={{ height: 1, background: 'var(--c-border)', marginBottom: 18 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
            {[
              ['Season',          result.season],
              ['Soil Type',       result.soilType],
              ['Water Needs',     result.waterNeeds],
              ['Growth Period',   result.growthPeriod],
              ['Min Temp (°C)',   result.minTemperature],
              ['Max Temp (°C)',   result.maxTemperature],
              ['Min Humidity',    result.minHumidity],
              ['Max Humidity',    result.maxHumidity],
              ['pH Min',          result.phMin],
              ['pH Max',          result.phMax],
              ['Category',        result.category],
              ['Description',     result.description],
            ].filter(([, v]) => v !== undefined && v !== null && v !== '').map(([lbl, val]) => (
              <div key={lbl}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--c-muted)', marginBottom: 4 }}>{lbl}</div>
                <div style={{ fontSize: 13.5, color: 'var(--c-text)', lineHeight: 1.4 }}>{String(val)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Disease lookup sub-panel ───────────────────────────────────────────────────
function DiseaseByName({ token, addToast }) {
  const [name, setName]       = useState('')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const search = async () => {
    const q = name.trim()
    if (!q) { setError('Enter a disease name'); return }
    setLoading(true); setResult(null); setError('')
    try {
     const data = await apiFetch(`/api/ml/disease/${encodeURIComponent(q)}`, {}, token)    
       setResult(data[0])
    } catch (e) {
      setError(`No disease found for "${q}"`)
    } finally {
      setLoading(false)
    }
  }

  const severityBadge = (s) => {
    if (!s) return 'badge-muted'
    const sl = s.toLowerCase()
    if (sl === 'high' || sl === 'severe') return 'badge-red'
    if (sl === 'medium' || sl === 'moderate') return 'badge-amber'
    return 'badge-green'
  }

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>
      <div className="card card-p">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Find Disease by Name</div>
        <div style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 18 }}>Search the plant disease database by disease name.</div>

        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="input"
            placeholder="e.g. Leaf Blight, Rust, Mosaic …"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); setResult(null) }}
            onKeyDown={e => e.key === 'Enter' && search()}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            onClick={search}
            disabled={loading || !name.trim()}
            style={{ flexShrink: 0, minWidth: 100 }}
          >
            {loading ? <><div className="spinner" /> Searching</> : 'Search'}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--c-red-light)', border: '1px solid var(--c-red)', borderRadius: 10, fontSize: 13, color: 'var(--c-red)' }}>
            ✕ {error}
          </div>
        )}
      </div>

      {result && (
        <div className="card card-p fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>{result.name}</div>
            {result.severity && (
              <span className={`badge ${severityBadge(result.severity)}`} style={{ fontSize: 11 }}>
                {result.severity}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 18 }}>ID: {result.id ?? result.diseaseId ?? '—'}</div>
          <div style={{ height: 1, background: 'var(--c-border)', marginBottom: 18 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
            {[
              ['Affected Crop',   result.affectedCrop],
              ['Pathogen Type',   result.pathogenType],
              ['Symptoms',        result.symptoms],
              ['Cause',           result.cause],
              ['Treatment',       result.treatment],
              ['Prevention',      result.prevention],
              ['Season',          result.season],
              ['Spread Method',   result.spreadMethod],
            ].filter(([, v]) => v !== undefined && v !== null && v !== '').map(([lbl, val]) => (
              <div key={lbl} style={{ gridColumn: ['Symptoms','Treatment','Prevention'].includes(lbl) ? '1 / -1' : undefined }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--c-muted)', marginBottom: 4 }}>{lbl}</div>
                <div style={{ fontSize: 13.5, color: 'var(--c-text)', lineHeight: 1.6 }}>{String(val)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function AdminFarmers() {
  useDocumentTitle('Admin · Farmers')
  const addToast = useToast()
  const { token }    = useSelector(s => s.auth)
  const { lang }     = useSelector(s => s.settings)
  const t            = getT(lang)

  const [tab, setTab]           = useState('all')
  const [farmers, setFarmers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)

  const [findId, setFindId]         = useState('')
  const [finding, setFinding]       = useState(false)
  const [findResult, setFindResult] = useState(null)
  const [findError, setFindError]   = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/api/admin/farmers', {}, token)
      setFarmers(data)
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const del = async (id) => {
    if (!confirm('Delete this farmer profile?')) return
    try {
      await apiFetch(`/api/admin/farmers/${id}`, { method: 'DELETE' }, token)
      addToast('Farmer deleted', 'info')
      load()
    } catch (e) {
      addToast(e.message, 'error')
    }
  }

  const viewFarmer = async (id) => {
    try {
      const data = await apiFetch(`/api/admin/farmers/${id}`, {}, token)
      setSelected(data)
    } catch (e) {
      addToast(e.message, 'error')
    }
  }

  const findById = async () => {
    const id = findId.trim()
    if (!id) { setFindError('Enter a User ID'); return }
    if (isNaN(Number(id))) { setFindError('User ID must be a number'); return }
    setFinding(true); setFindResult(null); setFindError('')
    try {
      const data = await apiFetch(`/api/admin/farmers/${id}`, {}, token)
      setFindResult(data)
    } catch (e) {
      setFindError(`No farmer found with ID ${id}`)
    } finally {
      setFinding(false)
    }
  }

  const TABS = [
    { key: 'all',     label: 'All Farmers' },
    { key: 'find',    label: 'Find by User ID' },
    { key: 'crop',    label: '🌾 Crop by Name' },
    { key: 'disease', label: '🦠 Disease by Name' },
  ]

  const TAB_STYLE = (active) => ({
    padding: '8px 18px',
    borderRadius: 9,
    border: 'none',
    background: active ? 'var(--c-accent-light)' : 'none',
    color: active ? 'var(--c-accent)' : 'var(--c-muted)',
    fontWeight: active ? 700 : 500,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'Outfit, sans-serif',
    transition: 'all .15s',
    whiteSpace: 'nowrap',
  })

  return (
    <div className="page">

      {/* Page header */}
      <div className="hero hero-green fade-up" style={{ marginBottom: 24 }}>
        <h1>{t.regFarmers || 'Admin Panel'}</h1>
        <p style={{ marginTop: 6, opacity: .7 }}>Manage farmers and look up crops, diseases by name</p>
        <div className="status-pill">
          <span className="dot dot-green" />
          {farmers.length} registered farmers
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--c-surface2)', borderRadius: 12, padding: 5, width: 'fit-content', border: '1px solid var(--c-border)', flexWrap: 'wrap' }}>
        {TABS.map(({ key, label }) => (
          <button key={key} style={TAB_STYLE(tab === key)} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {/* ── TAB: ALL FARMERS ── */}
      {tab === 'all' && (
        <div className="card fade-up">
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>All Registered Farmers</div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>{farmers.length} total</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={load}>↺ Refresh</button>
          </div>

          {loading ? (
            <div style={{ padding: 52, textAlign: 'center' }}>
              <div className="spinner spinner-dark" style={{ width: 28, height: 28, margin: 'auto' }} />
            </div>
          ) : farmers.length === 0 ? (
            <div className="empty">
              <div className="empty-icon"></div>
              <h3>{t.noFarmers || 'No farmers yet'}</h3>
              <p>Registered farmers will appear here</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Name</th><th>Username</th><th>Email</th><th>Location</th><th>Contact</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {farmers.map(f => (
                    <tr key={f.userId}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, background: 'var(--c-surface2)', padding: '2px 7px', borderRadius: 5, color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}>
                          #{f.userId}
                        </span>
                      </td>
                      <td><strong style={{ color: 'var(--c-text)', fontWeight: 600 }}>{f.fullname || '—'}</strong></td>
                      <td style={{ color: 'var(--c-muted)', fontSize: 12.5 }}>@{f.username}</td>
                      <td style={{ color: 'var(--c-text2)' }}>{f.email}</td>
                      <td style={{ color: 'var(--c-muted)' }}>{f.district ? `${f.district}, ${f.state}` : '—'}</td>
                      <td style={{ color: 'var(--c-muted)' }}>{f.contactNumber || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 7 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => viewFarmer(f.userId)}>View</button>
                          <button className="btn btn-danger btn-sm" onClick={() => del(f.userId)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: FIND BY USER ID ── */}
      {tab === 'find' && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>
          <div className="card card-p">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Find Farmer by User ID</div>
            <div style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 20 }}>Enter the exact numeric User ID to look up a specific farmer profile.</div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <input
                  className="input"
                  type="number"
                  placeholder="e.g. 3, 12, 47 ..."
                  value={findId}
                  onChange={e => { setFindId(e.target.value); setFindError(''); setFindResult(null) }}
                  onKeyDown={e => e.key === 'Enter' && findById()}
                  style={{ width: '100%' }}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={findById}
                disabled={finding || !findId.trim()}
                style={{ flexShrink: 0, minWidth: 100 }}
              >
                {finding ? <><div className="spinner" /> Searching</> : 'Search'}
              </button>
            </div>

            {findError && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--c-red-light)', border: '1px solid var(--c-red)', borderRadius: 10, fontSize: 13, color: 'var(--c-red)', display: 'flex', alignItems: 'center', gap: 8 }}>
                ✕ {findError}
              </div>
            )}

            <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--c-surface2)', borderRadius: 10, border: '1px solid var(--c-border)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-muted)', marginBottom: 6, letterSpacing: '.04em', textTransform: 'uppercase' }}>Available IDs</div>
              {farmers.length === 0 ? (
                <span style={{ fontSize: 12.5, color: 'var(--c-muted)' }}>Loading...</span>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {farmers.slice(0, 20).map(f => (
                    <button key={f.userId} className="badge badge-muted"
                      style={{ cursor: 'pointer' }}
                      onClick={() => { setFindId(String(f.userId)); setFindResult(null); setFindError('') }}>
                      #{f.userId} {f.username}
                    </button>
                  ))}
                  {farmers.length > 20 && <span style={{ fontSize: 12, color: 'var(--c-muted)', padding: '2px 6px' }}>+{farmers.length - 20} more</span>}
                </div>
              )}
            </div>
          </div>

          {findResult && (
            <div className="card card-p fade-up">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--c-accent-light)', border: '1px solid var(--c-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--c-accent)' }}>
                    {findResult.fullname?.[0] || findResult.username?.[0] || '?'}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700 }}>{findResult.fullname || '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>@{findResult.username} · ID #{findResult.userId}</div>
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => { del(findResult.userId); setFindResult(null) }}>Delete</button>
              </div>

              <div style={{ height: 1, background: 'var(--c-border)', margin: '0 0 18px' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
                {[
                  ['Email',         findResult.email],
                  ['Contact',       findResult.contactNumber],
                  ['Address',       findResult.address],
                  ['Village',       findResult.village],
                  ['District',      findResult.district],
                  ['State',         findResult.state],
                  ['Pincode',       findResult.pincode],
                  ['Farm Location', findResult.farmLocation],
                ].filter(([, v]) => v).map(([lbl, val]) => (
                  <div key={lbl}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--c-muted)', marginBottom: 4 }}>{lbl}</div>
                    <div style={{ fontSize: 13.5, color: 'var(--c-text)', lineHeight: 1.4 }}>{val}</div>
                  </div>
                ))}
              </div>

              {[findResult.email, findResult.contactNumber, findResult.address, findResult.village, findResult.district].every(v => !v) && (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--c-muted)', fontSize: 13 }}>
                  This farmer has not completed their profile yet.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: CROP BY NAME ── */}
      {tab === 'crop' && <CropByName token={token} addToast={addToast} />}

      {/* ── TAB: DISEASE BY NAME ── */}
      {tab === 'disease' && <DiseaseByName token={token} addToast={addToast} />}

      {selected && <FarmerModal farmer={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
