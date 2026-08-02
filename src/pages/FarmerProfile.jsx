import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { getT } from '../features/i18n'
import { useToast } from '../context/ToastContext'
import { apiFetch } from '../lib/api'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function FarmerProfile() {
  useDocumentTitle('Farmer Profile')
  const addToast = useToast()
  const { token }     = useSelector(s => s.auth)
  const { lang }      = useSelector(s => s.settings)
  const t             = getT(lang)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const blank = { fullname: '', contactNumber: '', address: '', village: '', district: '', state: '', pincode: '', farmLocation: '' }
  const [form, setForm] = useState(blank)

  const fields = [
    { k: 'fullname',      l: t.fullname },    { k: 'contactNumber', l: t.contact },
    { k: 'address',       l: t.address },     { k: 'village',       l: t.village },
    { k: 'district',      l: t.district },    { k: 'state',         l: t.state },
    { k: 'pincode',       l: t.pincode },     { k: 'farmLocation',  l: t.farmLoc },
  ]

  useEffect(() => {
    apiFetch('/api/farmer/profile', {}, token)
      .then(d => { setProfile(d); setForm(d) })
      .catch((e) => {
        // A 404 / "not found" just means the farmer hasn't created a profile yet.
        // Silently set profile to null so the "Create Profile" form is shown.
        // Only show a toast for unexpected errors (not 404/not-found).
        const msg = (e?.message || '').toLowerCase()
        const isNotFound =
          msg.includes('404') ||
          msg.includes('not found') ||
          msg.includes('farmerprofile')
        if (!isNotFound) {
          addToast('Could not load profile: ' + e.message, 'error')
        }
        setProfile(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  const save = async () => {
    setSaving(true)
    try {
      const data = await apiFetch(
        '/api/farmer/profile',
        { method: profile ? 'PUT' : 'POST', body: JSON.stringify(form) },
        token
      )
      setProfile(data); setEditing(false); addToast(t.saved, 'success')
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const del = async () => {
    if (!confirm(t.confirmDel)) return
    try {
      await apiFetch('/api/farmer/profile', { method: 'DELETE' }, token)
      setProfile(null); setForm(blank); addToast(t.deleted, 'info')
    } catch (e) {
      addToast(e.message, 'error')
    }
  }

  if (loading) return (
    <div className="page">
      <div style={{ height: 280, borderRadius: 'var(--r-xl)', background: 'var(--c-border)', opacity: .3, animation: 'pulse 1.5s infinite' }} />
    </div>
  )

  return (
    <div className="page">
      <div style={{ maxWidth: 680 }}>
        {(!profile || editing) ? (
          <div className="card card-p fade-up">
            <div className="row-between" style={{ marginBottom: 26 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, letterSpacing: '-.01em', marginBottom: 3 }}>
                  {profile ? t.editProfile : t.createProfile}
                </div>
                <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>
                  {profile
                    ? 'Update your farm profile information'
                    : 'You have not set up a profile yet. Fill in the details below to get started.'}
                </div>
              </div>
              {editing && (
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>{t.cancel}</button>
              )}
            </div>

            <div className="fg" style={{ marginBottom: 26 }}>
              {fields.map(f => (
                <div className="input-group" key={f.k}>
                  <label className="label">{f.l}</label>
                  <input
                    className="input"
                    value={form[f.k] || ''}
                    onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                  />
                </div>
              ))}
            </div>

            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? <><div className="spinner" />{t.saving}</> : t.save}
            </button>
          </div>
        ) : (
          <div className="card fade-in">
            <div style={{
              padding: '30px 30px 24px',
              background: 'var(--c-rail)',
              borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
              color: '#fff',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 52, height: 52,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 20, fontWeight: 700,
                  border: '1px solid rgba(255,255,255,.15)',
                }}>
                  {profile.fullname?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>
                    {profile.fullname}
                  </div>
                  <div style={{ opacity: .65, fontSize: 13, marginTop: 2 }}>
                    @{profile.username} — {profile.email}
                  </div>
                </div>
              </div>
            </div>

            <div className="card-p">
              <div className="fg" style={{ marginBottom: 24 }}>
                {fields.filter(f => f.k !== 'fullname').map(f => (
                  <div key={f.k}>
                    <div className="label" style={{ marginBottom: 4 }}>{f.l}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--c-text)' }}>{profile[f.k] || '—'}</div>
                  </div>
                ))}
              </div>

              <div className="divider" />

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>{t.edit}</button>
                <button className="btn btn-danger btn-sm" onClick={del}>{t.delete}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
