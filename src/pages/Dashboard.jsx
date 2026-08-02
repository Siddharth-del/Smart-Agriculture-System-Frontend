import { useSelector } from 'react-redux'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import {
  Sprout, ScanLine, Sparkles, CloudSun, Droplets, UserRound, Users,
  ArrowUpRight, RotateCcw,
} from 'lucide-react'
import { getT } from '../features/i18n'
import { apiFetch } from '../lib/api'
import { useToast } from '../context/ToastContext'
import { Card, Badge, Button, StatCard, EmptyState } from '../components/ui'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const STATUS_TONE = { OK: 'green', WARNING: 'amber', CRITICAL: 'red' }

function CustomBar(props) {
  const { x, y, width, height, fill } = props
  return <rect x={x} y={y} width={width} height={height} rx={3} ry={3} fill={fill} />
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      <div className="chart-tooltip-value">{payload[0].value}</div>
    </div>
  )
}

export default function Dashboard() {
  useDocumentTitle('Dashboard')
  const navigate = useNavigate()
  const addToast = useToast()
  const { user, token } = useSelector(s => s.auth)
  const { lang } = useSelector(s => s.settings)
  const t = getT(lang)
  const isAdmin = user?.roles?.some(r => r.includes('ADMIN'))

  const [sensorData, setSensorData] = useState(null)
  const [sensorLoading, setSensorLoading] = useState(true)
  const [sensorError, setSensorError] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [log, setLog] = useState([])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setSensorLoading(true)
      try {
        const data = await apiFetch('/api/sensor/latest', {}, token, { retry: 1 })
        if (cancelled) return
        setSensorData(data)
        setSensorError(false)
        setLog(prev => [
          { id: Date.now(), time: new Date(), status: data.status, moisture: data.soilMoisture },
          ...prev,
        ].slice(0, 6))
      } catch {
        if (!cancelled) setSensorError(true)
      } finally {
        if (!cancelled) setSensorLoading(false)
      }
    }
    load()
    const id = setInterval(load, 30_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [token])

  const resetMoisture = async () => {
    setResetting(true)
    try {
      await apiFetch('/api/sensor/reset', { method: 'POST' }, token)
      setSensorData(prev => prev ? { ...prev, soilMoisture: 0 } : prev)
      addToast('Soil moisture reset to 0%', 'success')
    } catch (e) {
      addToast(`Reset failed: ${e.message}`, 'error')
    } finally {
      setResetting(false)
    }
  }

  const chartData = useMemo(() => ([
    { name: 'Moisture', value: parseFloat(sensorData?.soilMoisture?.toFixed?.(1)) || 0, fill: '#6d28d9' },
    { name: 'Temp °C',  value: parseFloat(sensorData?.temperature?.toFixed?.(1)) || 0,  fill: '#8b5cf6' },
    { name: 'Humidity', value: parseFloat(sensorData?.humidity?.toFixed?.(1)) || 0,     fill: '#c4b5fd' },
  ]), [sensorData])

  const modules = [
    { id: 'crop',       label: t.crop,       icon: Sprout,    tag: 'ML' },
    { id: 'disease',    label: t.disease,    icon: ScanLine,  tag: 'AI' },
    { id: 'ai',         label: t.ai,         icon: Sparkles,  tag: 'LLM' },
    { id: 'weather',    label: t.weather,    icon: CloudSun,  tag: 'Live' },
    { id: 'irrigation', label: t.irrigation, icon: Droplets,  tag: 'IoT' },
    ...(!isAdmin ? [{ id: 'profile', label: t.profile, icon: UserRound, tag: '' }] : []),
    ...(isAdmin ? [{ id: 'admin', label: t.admin, icon: Users, tag: 'Admin' }] : []),
  ]

  const tips = [t.tip1, t.tip2, t.tip3]

  return (
    <div className="page">
      <div className="hero hero-green fade-up">
        <div className="hero-eyebrow">Overview</div>
        <h1>{t.goodDay}, {user?.username}</h1>
        <div className="status-pill">
          <span className={`dot ${sensorLoading ? 'dot-gray' : sensorError ? 'dot-red' : 'dot-green'}`} aria-hidden="true" />
          {sensorLoading ? 'Syncing sensor feed…' : sensorError ? 'Sensor offline' : 'Live sensor feed connected'}
        </div>
      </div>

      <section aria-labelledby="modules-heading" style={{ marginBottom: 24 }}>
        <div className="section-label" id="modules-heading">Modules</div>
        <div className="g3 fade-up" style={{ animationDelay: '.05s' }}>
          {modules.map((m) => {
            const Icon = m.icon
            return (
              <Card
                key={m.id}
                hover
                className="module-card"
                onClick={() => navigate(`/app/${m.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/app/${m.id}`) } }}
              >
                <div className="module-card-top">
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--c-surface2)', border: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} strokeWidth={1.75} color="var(--c-text2)" />
                  </div>
                  <span className="module-card-arrow"><ArrowUpRight size={15} strokeWidth={1.75} /></span>
                </div>
                <div className="module-card-title">{m.label}</div>
                {m.tag && <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--c-muted)', marginTop: 3 }}>{m.tag}</div>}
              </Card>
            )
          })}
        </div>
      </section>

      <div className="g2 fade-up" style={{ animationDelay: '.1s' }}>
        <Card padded>
          <div className="row-between card-header">
            <div>
              <div className="card-title">Best Practices</div>
              <div className="card-subtitle">For accurate results</div>
            </div>
            <Badge tone="muted">{tips.length} tips</Badge>
          </div>
          <ol className="tip-list">
            {tips.map((tip, i) => (
              <li key={i} className="tip-item">
                <span className="tip-num">{String(i + 1).padStart(2, '0')}</span>
                <p>{tip}</p>
              </li>
            ))}
          </ol>
        </Card>

        <Card padded>
          <div className="row-between card-header">
            <div>
              <div className="card-title">Live Sensor Readings</div>
              <div className="card-subtitle">
                {sensorData
                  ? `${sensorData.deviceId || 'ESP32'} — ${sensorData.city || ''}`
                  : sensorError ? 'Unable to reach sensor gateway' : 'Fetching from ESP32…'}
              </div>
            </div>
            <div className="row-between" style={{ gap: 8 }}>
              {sensorLoading
                ? <span className="spinner spinner-dark" />
                : sensorError
                  ? <Badge tone="red">Offline</Badge>
                  : sensorData ? <Badge tone="green">Live</Badge> : <Badge tone="muted">No Data</Badge>}
              <Button variant="danger" size="sm" onClick={resetMoisture} loading={resetting} title="Reset soil moisture to 0%">
                <RotateCcw size={13} strokeWidth={2} />
                {resetting ? 'Resetting…' : 'Reset'}
              </Button>
            </div>
          </div>

          {sensorLoading && !sensorData ? (
            <div className="chart-loading"><span className="spinner spinner-dark" style={{ width: 22, height: 22 }} /></div>
          ) : sensorError && !sensorData ? (
            <EmptyState
              title="No sensor data yet"
              description="We couldn't reach the sensor gateway. It will retry automatically every 30 seconds."
            />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={chartData} barSize={38} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--c-muted)', fontWeight: 500 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10.5, fill: 'var(--c-muted)' }} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" shape={<CustomBar />} />
                </BarChart>
              </ResponsiveContainer>

              {sensorData && (
                <div className="stat-row">
                  <StatCard label="Moisture" value={sensorData.soilMoisture?.toFixed?.(1) ?? '—'} unit="%" tone="accent" />
                  <StatCard label="Temp" value={sensorData.temperature?.toFixed?.(1) ?? '—'} unit="°C" tone="blue" />
                  <StatCard label="Humidity" value={sensorData.humidity?.toFixed?.(1) ?? '—'} unit="%" tone="amber" />
                  <StatCard label="Status" value={sensorData.status ?? '—'} tone={STATUS_TONE[sensorData.status] || 'muted'} />
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <section aria-labelledby="activity-heading" style={{ marginTop: 20 }}>
        <Card padded>
          <div className="card-header">
            <div className="card-title" id="activity-heading">Recent Activity</div>
            <div className="card-subtitle">Last {log.length} sensor syncs this session</div>
          </div>
          {log.length === 0 ? (
            <EmptyState title="No activity yet" description="Readings will appear here as they come in." />
          ) : (
            <ul className="activity-list">
              {log.map(entry => (
                <li key={entry.id} className="activity-item">
                  <span className={`dot dot-${(entry.status === 'OK' && 'green') || (entry.status === 'WARNING' && 'amber') || (entry.status === 'CRITICAL' && 'red') || 'gray'}`} aria-hidden="true" />
                  <span className="activity-text">
                    Soil moisture <strong>{entry.moisture?.toFixed?.(1) ?? '—'}%</strong> · status {entry.status ?? 'unknown'}
                  </span>
                  <time className="activity-time" dateTime={entry.time.toISOString()}>
                    {entry.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  )
}
