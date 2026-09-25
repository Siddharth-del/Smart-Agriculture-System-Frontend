import { lazy, Suspense, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Radio, PauseCircle, Cpu, BellRing, CheckCircle2, CloudSun, ScanLine, Sprout, MessagesSquare, TrendingUp, MapPin, Thermometer, Droplets } from 'lucide-react'
import { selectUser } from '../auth/authSlice'
import { useLiveSensor } from '../sensors/useLiveSensor'
import MoistureBand from '../sensors/MoistureBand'
import { useWeatherByCityQuery } from '../weather/weatherApi'
import WeatherSummary, { FieldWindows } from '../weather/WeatherSummary'
import { useMyProfileQuery } from '../profile/profileApi'
import { Alert, Badge, Button, Card, CardHeader, EmptyState, ErrorState, PageHeader, Skeleton, SkeletonText } from '../../shared/ui'
import { useDocumentTitle, useNow } from '../../shared/hooks'
import { deriveAlerts, fieldWindows, normaliseWeather, statusMeta } from '../../shared/utils/agronomy'
import { fmtNumber, fmtRelative } from '../../shared/utils/format'

const SensorTrendChart = lazy(() => import('../sensors/SensorTrendChart'))

function greeting(date = new Date()) {
  const h = date.getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function trendInsight(history) {
  if (history.length < 3) return null
  const recent = history.slice(-6)
  const delta = recent.at(-1).soilMoisture - recent[0].soilMoisture
  if (Math.abs(delta) < 3) return { tone: 'neutral', text: `Soil moisture has held steady (±${fmtNumber(Math.abs(delta))}%) over your last ${recent.length} readings.` }
  return delta < 0
    ? { tone: 'warning', text: `Soil moisture fell ${fmtNumber(-delta)} points over the last ${recent.length} readings. Expect to irrigate sooner than usual.` }
    : { tone: 'info', text: `Soil moisture rose ${fmtNumber(delta)} points over the last ${recent.length} readings — irrigation or rain is reaching the root zone.` }
}

export default function FarmerDashboardPage() {
  useDocumentTitle('Overview')
  const user = useSelector(selectUser)
  const now = useNow(30000)
  const sensor = useLiveSensor()
  const profile = useMyProfileQuery()
  const hasProfile = Boolean(profile.data?.profileId)

  // Prefer the farm's own location; fall back to the city the sensor reports.
  const city = (hasProfile && (profile.data.district || profile.data.farmLocation)) || sensor.data?.city || ''
  const weatherQ = useWeatherByCityQuery(city, { skip: !city })
  const wx = normaliseWeather(weatherQ.data)

  const alerts = useMemo(() => deriveAlerts({ reading: sensor.reading, weather: wx, now }), [sensor.reading, wx, now])
  const windows = useMemo(() => fieldWindows(wx), [wx])
  const insight = trendInsight(sensor.history)
  const status = statusMeta(sensor.reading?.status)

  return (
    <div className="page">
      <PageHeader
        title={`${greeting()}, ${profile.data?.fullname?.split(' ')[0] || user?.username}`}
        description={hasProfile ? `${profile.data.village ? `${profile.data.village}, ` : ''}${profile.data.district}, ${profile.data.state}` : 'Here’s what your field needs today.'}
        actions={(
          <span className={`live-pill ${sensor.live ? 'is-live' : ''}`}>
            {sensor.live ? <Radio size={14} aria-hidden="true" /> : <PauseCircle size={14} aria-hidden="true" />}
            {sensor.live ? `Live · every ${sensor.pollSeconds}s` : 'Updates paused'}
          </span>
        )}
      />

      {!profile.isLoading && !hasProfile && (
        <Alert tone="info" title="Finish setting up your farm" action={<Button size="sm" variant="secondary" to="/app/profile">Add farm details</Button>}>
          Add your district and village so weather and alerts match your fields.
        </Alert>
      )}

      <div className="dash-grid">
        {/* Field now — the signature card */}
        <Card className="dash-field" aria-labelledby="field-now">
          <CardHeader
            id="field-now"
            title="Field now"
            description={sensor.reading ? `Updated ${fmtRelative(sensor.reading.recordedAt, now)}` : 'Soil moisture from your ESP32 sensor'}
            actions={sensor.reading && <Badge tone={status.tone} dot>{status.label}</Badge>}
          />
          {sensor.isLoading ? (
            <div className="ui-stack"><Skeleton height={56} width={180} /><Skeleton height={18} /><SkeletonText lines={2} /></div>
          ) : sensor.error && !sensor.data ? (
            <ErrorState compact error={sensor.error} onRetry={sensor.refetch} />
          ) : sensor.noDevice ? (
            <EmptyState compact icon={Cpu} title="No sensor readings yet" action={<Button size="sm" to="/app/field">Connect a sensor</Button>}>
              Register your ESP32 device key and readings will appear here within a minute.
            </EmptyState>
          ) : (
            <>
              <MoistureBand value={sensor.reading.soilMoisture} />
              {sensor.stale && <Alert tone="warning">This reading is over 30 minutes old. Check the sensor’s power and Wi-Fi.</Alert>}
              <dl className="dash-field__meta">
                <div><dt><Thermometer size={14} aria-hidden="true" />Air temp</dt><dd className="ui-num">{fmtNumber(sensor.reading.temperature)}°C</dd></div>
                <div><dt><Droplets size={14} aria-hidden="true" />Humidity</dt><dd className="ui-num">{fmtNumber(sensor.reading.humidity)}%</dd></div>
                <div><dt><MapPin size={14} aria-hidden="true" />Location</dt><dd>{sensor.reading.city || '—'}</dd></div>
                <div><dt><Cpu size={14} aria-hidden="true" />Device</dt><dd className="truncate">{sensor.reading.deviceId || '—'}</dd></div>
              </dl>
            </>
          )}
        </Card>

        <Card className="dash-alerts" aria-labelledby="alerts-h">
          <CardHeader id="alerts-h" title="Alerts" icon={BellRing} description="Checked against your latest reading and local weather" />
          {sensor.isLoading ? <SkeletonText lines={3} /> : alerts.length === 0 ? (
            <EmptyState compact icon={CheckCircle2} title="Nothing needs attention">Your field is within safe limits right now.</EmptyState>
          ) : (
            <ul className="alert-list">
              {alerts.map((a) => (
                <li key={a.id} className={`alert-list__item ui-tone-border--${a.tone}`}>
                  <p className="alert-list__title">{a.title}</p>
                  <p className="alert-list__body">{a.body}</p>
                  {a.action && <Link to={a.action.to} className="text-link">{a.action.label}</Link>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="dash-weather" aria-labelledby="wx-h">
          <CardHeader id="wx-h" title="Weather" icon={CloudSun} actions={<Link to="/app/weather" className="text-link">Details</Link>} />
          {!city ? (
            <EmptyState compact icon={MapPin} title="Location not set" action={<Button size="sm" variant="secondary" to="/app/profile">Add your district</Button>}>
              We use your farm’s district to fetch local conditions.
            </EmptyState>
          ) : weatherQ.isLoading ? <SkeletonText lines={4} /> : weatherQ.error ? (
            <ErrorState compact error={weatherQ.error} onRetry={weatherQ.refetch} title={`No weather for “${city}”`} />
          ) : wx && <WeatherSummary wx={wx} compact />}
        </Card>

        <Card className="dash-trend" aria-labelledby="trend-h">
          <CardHeader id="trend-h" title="Moisture trend" icon={TrendingUp} description="Readings received while AgriPro is open on this device" />
          {sensor.history.length < 2 ? (
            <EmptyState compact icon={TrendingUp} title="Collecting readings">
              The trend appears after two readings. Keep this page open and it fills in automatically.
            </EmptyState>
          ) : (
            <>
              <Suspense fallback={<Skeleton height={220} radius={10} />}>
                <SensorTrendChart readings={sensor.history} />
              </Suspense>
              {insight && <p className={`insight ui-tone-text--${insight.tone}`}>{insight.text}</p>}
            </>
          )}
        </Card>

        {windows.length > 0 && (
          <Card className="dash-windows" aria-labelledby="win-h">
            <CardHeader id="win-h" title="Today’s field work" description={`Based on current conditions in ${wx.city}`} />
            <FieldWindows windows={windows} />
          </Card>
        )}

        <Card className="dash-tools" aria-labelledby="tools-h">
          <CardHeader id="tools-h" title="Advisory tools" />
          <ul className="tool-list">
            <li><Link to="/app/plant-doctor" className="tool-link"><ScanLine size={20} aria-hidden="true" /><span><strong>Diagnose a sick plant</strong>Photograph a leaf to identify disease and get fertilizer and pesticide advice.</span></Link></li>
            <li><Link to="/app/crop-planner" className="tool-link"><Sprout size={20} aria-hidden="true" /><span><strong>Choose what to plant</strong>Enter your soil test results for a crop recommendation.</span></Link></li>
            <li><Link to="/app/assistant" className="tool-link"><MessagesSquare size={20} aria-hidden="true" /><span><strong>Ask the farm assistant</strong>Get a crop care or disease treatment plan in English or Hindi.</span></Link></li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
