import { Server, RefreshCw, Settings2, Globe } from 'lucide-react'
import { useHealthQuery } from './adminApi'
import { env } from '../../config/env'
import { Badge, Button, Card, CardHeader, DescriptionList, PageHeader, Skeleton } from '../../shared/ui'
import { useDocumentTitle, useOnlineStatus } from '../../shared/hooks'
import { fmtDateTime, fmtRelative } from '../../shared/utils/format'

export default function SystemPage() {
  useDocumentTitle('System')
  const health = useHealthQuery(undefined, { pollingInterval: 30000 })
  const online = useOnlineStatus()
  const h = health.data
  return (
    <div className="page">
      <PageHeader title="System" description="Backend availability and this frontend’s configuration." actions={<Button variant="secondary" size="sm" icon={RefreshCw} onClick={health.refetch} loading={health.isFetching}>Check now</Button>} />
      <div className="grid-2">
        <Card aria-labelledby="api-h">
          <CardHeader id="api-h" title="Backend API" icon={Server} actions={h && <Badge tone={h.up ? 'success' : 'danger'} dot>{h.up ? 'Operational' : 'Unreachable'}</Badge>} />
          {health.isLoading ? <Skeleton height={120} /> : (
            <DescriptionList items={[
              { term: 'Service', value: h?.service || '—' },
              { term: 'Response time', value: h ? `${h.latencyMs} ms` : '—' },
              { term: 'Last checked', value: h ? `${fmtRelative(h.checkedAt)}` : '—' },
              !h?.up && { term: 'Error', value: h?.error },
              { term: 'Base URL', value: <code className="ui-mono break">{env.apiBaseUrl || '(same origin)'}</code> },
            ]} />
          )}
        </Card>
        <Card aria-labelledby="fe-h">
          <CardHeader id="fe-h" title="Frontend" icon={Settings2} />
          <DescriptionList items={[
            { term: 'Version', value: env.appVersion },
            { term: 'Built', value: fmtDateTime(env.buildTime) },
            { term: 'Mode', value: env.isProd ? 'Production' : 'Development' },
            { term: 'Sensor refresh', value: `Every ${Math.round(env.sensorPollMs / 1000)} s` },
            { term: 'Request timeout', value: `${Math.round(env.requestTimeoutMs / 1000)} s` },
            { term: 'Max upload', value: `${env.maxUploadMb} MB` },
          ]} />
        </Card>
        <Card aria-labelledby="client-h">
          <CardHeader id="client-h" title="This device" icon={Globe} />
          <DescriptionList items={[
            { term: 'Network', value: <Badge tone={online ? 'success' : 'warning'} dot>{online ? 'Online' : 'Offline'}</Badge> },
            { term: 'Language', value: navigator.language },
            { term: 'Time zone', value: Intl.DateTimeFormat().resolvedOptions().timeZone },
          ]} />
        </Card>
      </div>
    </div>
  )
}
