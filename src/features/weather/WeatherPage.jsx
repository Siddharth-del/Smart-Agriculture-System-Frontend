import { useState } from 'react'
import { useSelector } from 'react-redux'
import { CloudSun, History, X } from 'lucide-react'
import { useWeatherByCityQuery } from './weatherApi'
import WeatherSummary, { FieldWindows } from './WeatherSummary'
import CitySearch from './CitySearch'
import { useMyProfileQuery } from '../profile/profileApi'
import { selectRoles } from '../auth/authSlice'
import { Card, CardHeader, EmptyState, ErrorState, PageHeader, SkeletonText } from '../../shared/ui'
import { useDocumentTitle, useLocalState } from '../../shared/hooks'
import { fieldWindows, normaliseWeather } from '../../shared/utils/agronomy'
import { fmtRelative } from '../../shared/utils/format'

export default function WeatherPage() {
  useDocumentTitle('Weather')
  const roles = useSelector(selectRoles)
  const profile = useMyProfileQuery(undefined, { skip: !roles.includes('FARMER') })
  const profileCity = profile.data?.district || profile.data?.farmLocation || ''
  const [recent, setRecent] = useLocalState('ap_recent_cities', [])
  const [picked, setPicked] = useState(null)
  const city = picked ?? profileCity ?? recent[0] ?? ''

  const q = useWeatherByCityQuery(city, { skip: !city, pollingInterval: 10 * 60 * 1000 })
  const wx = normaliseWeather(q.data)

  const search = (c) => {
    setPicked(c)
    setRecent((r) => [c, ...r.filter((x) => x.toLowerCase() !== c.toLowerCase())].slice(0, 6))
  }

  return (
    <div className="page">
      <PageHeader title="Weather" description="Current conditions and what they mean for work in the field." />

      <Card>
        <CitySearch key={city} initial={city} onSearch={search} loading={q.isFetching} />
        {recent.length > 0 && (
          <div className="chips" aria-label="Recent searches">
            <History size={14} aria-hidden="true" />
            {recent.map((c) => (
              <span key={c} className="chip">
                <button type="button" onClick={() => setPicked(c)} aria-pressed={c === city}>{c}</button>
                <button type="button" aria-label={`Remove ${c}`} onClick={() => setRecent((r) => r.filter((x) => x !== c))}><X size={12} /></button>
              </span>
            ))}
          </div>
        )}
      </Card>

      {!city ? (
        <Card><EmptyState icon={CloudSun} title="Search for your city or district">We’ll show temperature, humidity and wind, plus whether it’s a good time to spray or irrigate.</EmptyState></Card>
      ) : q.isLoading ? (
        <Card><SkeletonText lines={5} /></Card>
      ) : q.error ? (
        <Card><ErrorState error={q.error} onRetry={q.refetch} title={q.error.code === 'NOT_FOUND' || q.error.status >= 500 ? `We couldn’t find weather for “${city}”` : undefined} /></Card>
      ) : wx && (
        <div className="grid-main-side">
          <Card aria-labelledby="now-h">
            <CardHeader id="now-h" title="Right now" description={wx.observedAt ? `Observed ${fmtRelative(wx.observedAt)}` : undefined} />
            <WeatherSummary wx={wx} />
          </Card>
          <Card aria-labelledby="work-h">
            <CardHeader id="work-h" title="Field work guidance" />
            <FieldWindows windows={fieldWindows(wx)} />
            <p className="fine-print">Guidance uses current conditions only. Check a forecast before planning multi-day work.</p>
          </Card>
        </div>
      )}
    </div>
  )
}
