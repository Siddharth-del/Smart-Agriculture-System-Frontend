import { Binoculars, X, MapPin } from 'lucide-react'
import { useWeatherByCityQuery } from '../weather/weatherApi'
import WeatherSummary, { FieldWindows } from '../weather/WeatherSummary'
import CitySearch from '../weather/CitySearch'
import { Alert, Card, CardHeader, EmptyState, ErrorState, IconButton, PageHeader, SkeletonText } from '../../shared/ui'
import { useDocumentTitle, useLocalState } from '../../shared/hooks'
import { fieldWindows, normaliseWeather } from '../../shared/utils/agronomy'

function WatchCard({ city, onRemove }) {
  const q = useWeatherByCityQuery(city, { pollingInterval: 15 * 60 * 1000 })
  const wx = normaliseWeather(q.data)
  return (
    <Card aria-label={`Conditions in ${city}`}>
      <CardHeader title={wx?.city || city} icon={MapPin} as="h2" actions={<IconButton icon={X} label={`Remove ${city}`} onClick={onRemove} />} />
      {q.isLoading ? <SkeletonText lines={5} /> : q.error ? <ErrorState compact error={q.error} onRetry={q.refetch} title={`No data for “${city}”`} /> : wx && (
        <div className="ui-stack">
          <WeatherSummary wx={wx} compact />
          <FieldWindows windows={fieldWindows(wx)} />
        </div>
      )}
    </Card>
  )
}

export default function AgronomistPage() {
  useDocumentTitle('Field watchlist')
  const [cities, setCities] = useLocalState('ap_agronomist_watchlist', [])
  const add = (c) => setCities((list) => (list.some((x) => x.toLowerCase() === c.toLowerCase()) ? list : [c, ...list].slice(0, 12)))

  return (
    <div className="page">
      <PageHeader title="Field watchlist" description="Track spraying, irrigation and disease-risk conditions across the districts you advise." />
      <Alert tone="info" title="Farmer records and diagnosis tools need backend access">
        Agronomist accounts can’t yet call the crop, disease and advisory APIs. Once the backend grants the AGRONOMIST role access, those tools will appear in your menu automatically.
      </Alert>
      <Card><CitySearch onSearch={add} label="Add a district or town" submitLabel="Add to watchlist" /></Card>
      {cities.length === 0 ? (
        <Card><EmptyState icon={Binoculars} title="Your watchlist is empty">Add the districts where your farmers are, and check conditions for all of them at a glance.</EmptyState></Card>
      ) : (
        <div className="grid-auto">{cities.map((c) => <WatchCard key={c} city={c} onRemove={() => setCities((l) => l.filter((x) => x !== c))} />)}</div>
      )}
    </div>
  )
}
