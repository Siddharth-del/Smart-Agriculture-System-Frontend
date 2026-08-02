import { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { getT } from '../features/i18n'
import { useToast } from '../context/ToastContext'
import { apiFetch } from '../lib/api'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

function Gauge({ value, target }) {
  const pct    = Math.min(Math.max(parseFloat(value) || 0, 0), 100)
  const radius = 66
  const circ   = 2 * Math.PI * radius
  const offset = circ - (pct / 100) * circ
  const color  = pct < target * .5  ? 'var(--c-red)'
               : pct < target       ? 'var(--c-amber)'
               : pct < target * 1.4 ? 'var(--c-accent)'
               :                      'var(--c-blue)'

  return (
    <div className="gauge-wrap">
      <div className="gauge-box">
        <svg className="gauge-svg" width="164" height="164" viewBox="0 0 164 164">
          <circle className="track" cx="82" cy="82" r={radius} />
          <circle className="fill" cx="82" cy="82" r={radius}
            stroke={color} strokeDasharray={circ} strokeDashoffset={offset} />
        </svg>
        <div className="gauge-center">
          <span className="gauge-val" style={{ color }}>{pct.toFixed(1)}</span>
          <span className="gauge-lbl">% moisture</span>
        </div>
      </div>
      <div style={{ width: '100%', padding: '0 8px', marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--c-muted)', marginBottom: 5, fontWeight: 600, letterSpacing: '.03em' }}>
          <span>Current</span><span>Target {target}%</span>
        </div>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
          <div className="bar-marker" style={{ left: `calc(${target}% - 1px)` }} />
        </div>
      </div>
    </div>
  )
}

// ── Device Registration Card ───────────────────────────────────────────────────
function DeviceRegistration({ token, addToast }) {
  const [deviceKey, setDeviceKey]     = useState('')
  const [registering, setRegistering] = useState(false)
  const [registered, setRegistered]   = useState(false)
  const [regError, setRegError]       = useState('')

  const register = async () => {
    const key = deviceKey.trim()
    if (!key) { setRegError('Enter a device API key'); return }
    setRegistering(true); setRegError(''); setRegistered(false)
    try {
      await apiFetch(
        `/api/sensor/register-key?deviceKey=${encodeURIComponent(key)}`,
        { method: 'POST' },
        token
      )
      setRegistered(true)
      addToast(`Device key registered: ${key}`, 'success')
    } catch (e) {
      setRegError(e.message || 'Registration failed')
    } finally {
      setRegistering(false)
    }
  }

  return (
    <div className="card card-p fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: 'var(--c-accent-light)', border: '1px solid var(--c-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
        }}>📡</div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '-.01em' }}>
            Device Registration
          </div>
          <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 1 }}>
            Link your ESP32 API key to your account
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--c-border)', margin: '14px 0' }} />

    

      <div style={{ display: 'flex', gap: 10 }}>
        <input
          className="input"
          placeholder="e.g. ESP32-KEY-A1B2C3 …"
          value={deviceKey}
          onChange={e => { setDeviceKey(e.target.value); setRegError(''); setRegistered(false) }}
          onKeyDown={e => e.key === 'Enter' && register()}
          style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 13 }}
        />
        <button
          className="btn btn-primary"
          onClick={register}
          disabled={registering || !deviceKey.trim()}
          style={{ flexShrink: 0, minWidth: 110 }}
        >
          {registering ? <><div className="spinner" />Registering</> : '  Register'}
        </button>
      </div>

      {regError && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--c-red-light)', border: '1px solid var(--c-red)', borderRadius: 10, fontSize: 13, color: 'var(--c-red)' }}>
          ✕ {regError}
        </div>
      )}

      {registered && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--c-green-light)', border: '1px solid var(--c-accent)', borderRadius: 10, fontSize: 13, color: 'var(--c-accent)' }}>
          ✓ Device key <strong style={{ fontFamily: 'var(--font-mono)' }}>{deviceKey}</strong> registered successfully.
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Irrigation() {
  useDocumentTitle('Irrigation')
  const addToast = useToast()
  const { token, user } = useSelector(s => s.auth)
  const { lang }        = useSelector(s => s.settings)
  const t               = getT(lang)

  const [city, setCity]             = useState('Delhi')
  const [moisture, setMoisture]     = useState('')
  const [threshold, setThreshold]   = useState(30)
  const [interval_, setInterval_]   = useState(60)
  const [busy, setBusy]             = useState(false)
  const [resetting, setResetting]   = useState(false)
  const [monitoring, setMonitoring] = useState(false)

  const [sensorFetching, setSensorFetching] = useState(false)
  const [sensorLive, setSensorLive]         = useState(null)
  const sensorTimerRef = useRef(null)

  const [lastResp, setLastResp]   = useState(null)
  const [weather, setWeather]     = useState(null)
  const [history, setHistory]     = useState([])
  const [log, setLog]             = useState([])
  const [status, setStatus]       = useState('idle')
  const [lastFetch, setLastFetch] = useState(null)
  const timerRef = useRef(null)

  const getStatus = (m) => {
    const v = parseFloat(m) || 0
    if (v < threshold * .5) return 'danger'
    if (v < threshold)      return 'warn'
    return 'ok'
  }

  const fetchWeather = async (c) => {
    try {
      const d = await apiFetch(`/api/weather/city/${encodeURIComponent(c)}`, {}, token)
      setWeather(d)
    } catch {}
  }

  const fetchSensorLatest = async () => {
    setSensorFetching(true)
    try {
      const data = await apiFetch('/api/sensor/latest', {}, token)
      setSensorLive(data)

      if (data.soilMoisture != null) {
        const m = parseFloat(data.soilMoisture.toFixed(2))
        setMoisture(String(m))
        setLastFetch(new Date())
        const newStatus = getStatus(m)
        setStatus(newStatus)

        setHistory(prev => [{
          id: Date.now(),
          moisture: m,
          city: data.city || city,
          response: data.status,
          at: new Date(),
          status: newStatus,
        }, ...prev].slice(0, 20))

        setLog(prev => [{
          id: Date.now() + 1,
          time: new Date().toLocaleTimeString(),
          msg: `Device ${data.deviceId || 'ESP32'} → moisture: ${m}% | temp: ${data.temperature?.toFixed(1)}°C | humidity: ${data.humidity?.toFixed(1)}% | status: ${data.status}`,
          type: newStatus === 'danger' ? 'alert' : newStatus === 'warn' ? 'warn' : 'ok',
        }, ...prev].slice(0, 50))

        if (newStatus !== 'ok') {
          await sendAlert(m, data.city || city, true)
        } else {
          addToast('Sensor read — moisture OK, no alert needed', 'success')
          fetchWeather(data.city || city)
        }
      } else {
        addToast('Sensor returned no data yet', 'info')
      }
    } catch (e) {
      addToast(`Sensor fetch failed: ${e.message}`, 'error')
    } finally {
      setSensorFetching(false)
    }
  }

  const resetMoisture = async () => {
    setResetting(true)
    try {
      await apiFetch('/api/sensor/reset', { method: 'POST' }, token)
      setMoisture('0')
      setStatus('idle')
      setSensorLive(prev => prev ? { ...prev, soilMoisture: 0 } : prev)
      setLog(prev => [{
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        msg: 'Soil moisture reset to 0% by user',
        type: 'info',
      }, ...prev].slice(0, 50))
      addToast('Soil moisture reset to 0%', 'success')
    } catch (e) {
      addToast(`Reset failed: ${e.message}`, 'error')
    } finally {
      setResetting(false)
    }
  }

  const startSensorMonitoring = () => {
    if (!city.trim()) { addToast('Enter a city name', 'error'); return }
    setMonitoring(true)
    setLog(prev => [{ id: Date.now(), time: new Date().toLocaleTimeString(), msg: `Monitoring started — ${city} — polling every ${interval_}s`, type: 'info' }, ...prev])
    addToast(`Monitoring started — polling every ${interval_}s`, 'success')
    fetchSensorLatest()
    sensorTimerRef.current = setInterval(fetchSensorLatest, interval_ * 1000)
  }

  const stopSensorMonitoring = () => {
    clearInterval(sensorTimerRef.current)
    setMonitoring(false)
    setStatus('idle')
    addToast('Sensor monitoring stopped', 'info')
    setLog(prev => [{ id: Date.now(), time: new Date().toLocaleTimeString(), msg: 'Monitoring stopped', type: 'info' }, ...prev])
  }

  const sendAlert = async (m, c, isAuto = false) => {
    const val = parseFloat(m)
    if (isNaN(val)) return
    setBusy(true)
    try {
      const resp = await apiFetch(
        `/api/alert/city/${encodeURIComponent((c || city).trim())}`,
        { method: 'POST', body: JSON.stringify({ soilMoisture: val }) },
        token
      )
      setLastResp(resp)
      const emailStatus = resp.emailStatus || ''

      setLog(prev => [{
        id: Date.now() + 2,
        time: new Date().toLocaleTimeString(),
        msg: `Alert for ${(c || city).trim()} — ${val}% → ${resp.message} | Email: ${emailStatus}`,
        type: emailStatus === 'Email Sent' ? 'alert' : emailStatus.startsWith('Cooldown') ? 'warn' : 'info',
      }, ...prev].slice(0, 50))

      if      (emailStatus === 'Email Sent')        addToast(`Alert email sent to ${user?.email || user?.username}`, 'error')
      else if (emailStatus.startsWith('Cooldown'))  addToast(`Irrigation needed — ${emailStatus}`, 'info')
      else if (!resp.irrigationRequired)            addToast('Soil moisture is OK — no alert sent', 'success')

      fetchWeather((c || city).trim())
    } catch (e) {
      if (!isAuto) addToast(`Request failed: ${e.message}`, 'error')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => () => {
    clearInterval(timerRef.current)
    clearInterval(sensorTimerRef.current)
  }, [])

  const statusMap = {
    idle:   { label: 'Not Monitoring', dot: 'dot-gray',  badge: 'badge-muted' },
    ok:     { label: 'Optimal',        dot: 'dot-green', badge: 'badge-green' },
    warn:   { label: 'Low Moisture',   dot: 'dot-amber', badge: 'badge-amber' },
    danger: { label: 'Critical Low',   dot: 'dot-red',   badge: 'badge-red'   },
  }
  const sm = statusMap[status]

  const bannerMap = {
    ok:     { cls: 'alert-ok',     color: 'var(--c-accent)', title: 'Soil moisture is optimal',        body: `${moisture}% is above the ${threshold}% threshold. No irrigation needed.` },
    warn:   { cls: 'alert-warn',   color: 'var(--c-amber)',  title: 'Moisture below target',           body: `${moisture}% is below the ${threshold}% threshold. Consider irrigating soon.` },
    danger: { cls: 'alert-danger', color: 'var(--c-red)',    title: 'Critical — irrigate immediately', body: `Moisture critically low at ${moisture}%. Alert email sent to ${user?.username}.` },
  }

  return (
    <div className="page">
      <div className="hero hero-blue fade-up" style={{ marginBottom: 26 }}>
        <div style={{ fontSize: 11, opacity: .55, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>
          IoT Monitoring
        </div>
        <h1>{t.irrigTitle}</h1>
        <p style={{ marginTop: 8 }}>{t.irrigSub}</p>
        <div className="status-pill">
          <span className={`dot ${sm.dot}`} />
          {monitoring ? `Live — polling every ${interval_}s` : 'Not monitoring'}
          {lastFetch && monitoring && (
            <span style={{ opacity: .65 }}> — last: {lastFetch.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {status !== 'idle' && bannerMap[status] && (
        <div className={`alert-strip ${bannerMap[status].cls}`}>
          <div className="alert-bar" />
          <div>
            <div className="alert-title" style={{ color: bannerMap[status].color }}>{bannerMap[status].title}</div>
            <div className="alert-body">{bannerMap[status].body}</div>
          </div>
        </div>
      )}

      {lastResp && (
        <div className={`alert-strip ${
          lastResp.emailStatus === 'Email Sent'           ? 'alert-danger'
          : lastResp.emailStatus?.startsWith('Cooldown') ? 'alert-warn'
          : !lastResp.irrigationRequired                  ? 'alert-ok'
          : 'alert-warn'
        }`} style={{ marginBottom: 22 }}>
          <div className="alert-bar" />
          <div>
            <div className="alert-title">Server Response</div>
            <div className="alert-body" style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
              {lastResp.message} — Email: {lastResp.emailStatus}
            </div>
          </div>
        </div>
      )}

      <div className="g2" style={{ alignItems: 'start' }}>
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Gauge */}
          <div className="card card-p fade-up">
            <div className="row-between" style={{ marginBottom: 18 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, letterSpacing: '-.01em' }}>
                  Soil Moisture
                </div>
                <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>
                  {city || '—'} — {lastFetch ? lastFetch.toLocaleTimeString() : 'No reading yet'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge ${sm.badge}`}>{sm.label}</span>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={resetMoisture}
                  disabled={resetting}
                  title="Reset soil moisture to 0%"
                >
                  {resetting ? <><div className="spinner" />Resetting…</> : '↺ Reset'}
                </button>
              </div>
            </div>

            <Gauge value={parseFloat(moisture) || 0} target={threshold} />

            {sensorLive && sensorLive.status !== 'No Data' && (
              <div className="g3" style={{ marginTop: 16, gap: 10 }}>
                {[
                  ['Moisture',    `${sensorLive.soilMoisture?.toFixed(1) ?? '—'}%`],
                  ['Temperature', `${sensorLive.temperature?.toFixed(1) ?? '—'}°C`],
                  ['Humidity',    `${sensorLive.humidity?.toFixed(1) ?? '—'}%`],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{
                    background: 'var(--c-surface2)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 'var(--r-lg)',
                    padding: '12px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{val}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--c-muted)' }}>{lbl}</div>
                  </div>
                ))}
              </div>
            )}

            {sensorLive?.deviceId && (
              <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--c-muted)', display: 'flex', gap: 14, flexWrap: 'wrap', fontFamily: 'var(--font-mono)' }}>
                <span>Device: <span className="code-chip">{sensorLive.deviceId}</span></span>
                {sensorLive.city && <span>City: <span className="code-chip">{sensorLive.city}</span></span>}
                {sensorLive.emailStatus && <span>Email: <span className="code-chip">{sensorLive.emailStatus}</span></span>}
              </div>
            )}
          </div>

          {/* Config */}
          <div className="card card-p fade-up">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '-.01em', marginBottom: 18 }}>
              Configuration
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-group">
                <label className="label">{t.city}</label>
                <input
                  className="input"
                  placeholder="e.g. Delhi, Mumbai"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                  {['Delhi', 'Mumbai', 'Jaipur', 'Mathura', 'Lucknow'].map(c => (
                    <button key={c} className="badge badge-muted" onClick={() => setCity(c)}>{c}</button>
                  ))}
                </div>
              </div>

              <div className="fg" style={{ gap: 10 }}>
                <div className="input-group">
                  <label className="label">{t.threshold}</label>
                  <input className="input" type="number" min="10" max="100" value={threshold} onChange={e => setThreshold(Number(e.target.value))} />
                </div>
                <div className="input-group">
                  <label className="label">{t.interval}</label>
                  <input className="input" type="number" min="10" max="3600" value={interval_} onChange={e => setInterval_(Number(e.target.value))} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {!monitoring ? (
                  <button className="btn btn-primary btn-full" onClick={startSensorMonitoring} disabled={sensorFetching}>
                    {sensorFetching ? <><div className="spinner" />Connecting to device…</> : 'Start Monitoring'}
                  </button>
                ) : (
                  <button className="btn btn-danger btn-full" onClick={stopSensorMonitoring}>Stop Monitoring</button>
                )}
                <button className="btn btn-secondary btn-full" onClick={fetchSensorLatest} disabled={sensorFetching || monitoring}>
                  {sensorFetching ? <><div className="spinner" />Fetching…</> : 'Fetch Sensor Once'}
                </button>
              </div>
            </div>
          </div>

          {/* ── DEVICE REGISTRATION ── placed here, below config, in the left column */}
          <DeviceRegistration token={token} addToast={addToast} />
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {weather && (
            <div className="card card-p fade-in">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '-.01em', marginBottom: 16 }}>
                Weather — {weather.name}
              </div>
              <div className="g3" style={{ gap: 10 }}>
                {[
                  [t.humidity, `${weather.main?.humidity}%`,         'var(--c-blue)'],
                  [t.wind,     `${weather.wind?.speed} m/s`,         'var(--c-accent)'],
                  ['Temp',     `${Math.round(weather.main?.temp)}°C`,'var(--c-amber)'],
                ].map(([lbl, val, color]) => (
                  <div key={lbl} style={{
                    background: 'var(--c-surface2)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 'var(--r-lg)',
                    padding: '14px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color }}>{val}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--c-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700 }}>{lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reading History */}
          <div className="card fade-up">
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '-.01em' }}>{t.history}</div>
                <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>Last {history.length} readings</div>
              </div>
              {history.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setHistory([])}>Clear</button>}
            </div>
            {history.length === 0 ? (
              <div className="empty" style={{ padding: '40px 20px' }}>
                <div className="empty-label" />
                <h3>{t.noReadings}</h3>
                <p>Start monitoring or fetch sensor data</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Time</th><th>City</th><th>Moisture</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {history.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontSize: 11.5, color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>{r.at.toLocaleTimeString()}</td>
                        <td style={{ color: 'var(--c-muted)' }}>{r.city}</td>
                        <td>
                          <strong style={{ color: r.status === 'danger' ? 'var(--c-red)' : r.status === 'warn' ? 'var(--c-amber)' : 'var(--c-accent)' }}>
                            {r.moisture.toFixed(1)}%
                          </strong>
                        </td>
                        <td>
                          <span className={`badge ${r.status === 'danger' ? 'badge-red' : r.status === 'warn' ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: 10.5 }}>
                            {r.status === 'danger' ? 'Critical' : r.status === 'warn' ? 'Warning' : r.response || 'OK'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Activity log */}
          <div className="card card-p fade-up">
            <div className="row-between" style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '-.01em' }}>{t.actLog}</div>
              {log.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setLog([])}>Clear</button>}
            </div>
            {log.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--c-muted)', fontSize: 13 }}>
                <div className="empty-label" style={{ margin: '0 auto 12px' }} />
                {t.noActivity}
              </div>
            ) : (
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {log.map(l => (
                  <div key={l.id} className="log-entry">
                    <span className="log-time">{l.time}</span>
                    <span style={{ flex: 1, fontSize: 12, color: 'var(--c-text2)', lineHeight: 1.55 }}>{l.msg}</span>
                    <span className={`badge ${l.type === 'alert' ? 'badge-red' : l.type === 'warn' ? 'badge-amber' : l.type === 'ok' ? 'badge-green' : 'badge-blue'}`} style={{ fontSize: 10, flexShrink: 0 }}>
                      {l.type === 'alert' ? 'Alert' : l.type === 'warn' ? 'Warn' : l.type === 'ok' ? 'OK' : 'Info'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
