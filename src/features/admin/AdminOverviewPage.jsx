import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Map, MapPinned, ClipboardCheck, Server, Activity, BellOff, BarChart3 } from 'lucide-react'
import { useFarmersQuery, useHealthQuery } from './adminApi'
import { useFarmerStats } from './useFarmerStats'
import FarmerDetailDialog from './FarmerDetailDialog'
import { useDeleteFarmerFlow } from './useDeleteFarmerFlow'
import { Badge, Card, CardHeader, EmptyState, ErrorState, PageHeader, Skeleton, Stat } from '../../shared/ui'
import { useDocumentTitle } from '../../shared/hooks'
import { fmtRelative } from '../../shared/utils/format'

const FarmersByStateChart = lazy(() => import('./FarmersByStateChart'))

export default function AdminOverviewPage() {
  useDocumentTitle('Admin overview')
  const farmers = useFarmersQuery(undefined, { pollingInterval: 120000 })
  const health = useHealthQuery(undefined, { pollingInterval: 60000 })
  const stats = useFarmerStats(farmers.data)
  const [selected, setSelected] = useState(null)
  const { requestDelete, dialog } = useDeleteFarmerFlow({ onDeleted: () => setSelected(null) })

  return (
    <div className="page">
      <PageHeader
        title="Admin overview"
        description="Registered farmers and platform health."
        meta={health.data && (
          <Badge tone={health.data.up ? 'success' : 'danger'} dot>{health.data.up ? `API online · ${health.data.latencyMs} ms` : 'API unreachable'}</Badge>
        )}
      />

      {farmers.error && !farmers.data ? <Card><ErrorState error={farmers.error} onRetry={farmers.refetch} /></Card> : (
        <>
          <div className="stat-grid">
            {farmers.isLoading ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} height={96} radius={12} />) : (
              <>
                <Stat icon={Users} label="Farmer profiles" value={stats.total} />
                <Stat icon={Map} label="States covered" value={stats.stateCount} />
                <Stat icon={MapPinned} label="Districts" value={stats.districtCount} />
                <Stat icon={ClipboardCheck} label="Profiles complete" value={stats.completeness} unit="%" hint="District, phone and farm location filled" />
              </>
            )}
          </div>

          <div className="grid-main-side">
            <Card aria-labelledby="state-h">
              <CardHeader id="state-h" title="Farmers by state" icon={BarChart3} />
              {farmers.isLoading ? <Skeleton height={220} radius={10} /> : stats.total === 0 ? (
                <EmptyState compact icon={Users} title="No farmers yet">Farmers appear here once they create a farm profile.</EmptyState>
              ) : <Suspense fallback={<Skeleton height={220} radius={10} />}><FarmersByStateChart data={stats.states} /></Suspense>}
            </Card>

            <Card aria-labelledby="recent-h">
              <CardHeader id="recent-h" title="Latest profiles" icon={Activity} actions={<Link className="text-link" to="/app/admin/farmers">View all</Link>} />
              {farmers.isLoading ? <Skeleton height={200} radius={10} /> : stats.recent.length === 0 ? (
                <EmptyState compact icon={Users} title="No profiles yet" />
              ) : (
                <ul className="people-list">
                  {stats.recent.map((f) => (
                    <li key={f.userId}>
                      <button type="button" className="people-list__row" onClick={() => setSelected(f.userId)}>
                        <span className="shell-user__avatar" aria-hidden="true">{(f.fullname || f.username || '?')[0].toUpperCase()}</span>
                        <span className="people-list__meta"><strong>{f.fullname || f.username}</strong><span>{[f.district, f.state].filter(Boolean).join(', ') || 'Location not set'}</span></span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}

      <div className="grid-2">
        <Card aria-labelledby="sys-h">
          <CardHeader id="sys-h" title="System" icon={Server} actions={<Link className="text-link" to="/app/admin/system">Details</Link>} />
          {health.isLoading ? <Skeleton height={60} /> : (
            <p className="ui-prose">
              {health.data?.up ? <>The API responded in <strong>{health.data.latencyMs} ms</strong>, checked {fmtRelative(health.data.checkedAt)}.</> : <>The health check failed: {health.data?.error}</>}
            </p>
          )}
        </Card>
        <Card aria-labelledby="act-h">
          <CardHeader id="act-h" title="Activity and alert log" icon={BellOff} />
          <EmptyState compact icon={BellOff} title="Not available yet">
            The backend doesn’t expose an activity or alert history endpoint. Once it does, platform-wide alerts and sign-ins will be listed here.
          </EmptyState>
        </Card>
      </div>

      <FarmerDetailDialog userId={selected} onClose={() => setSelected(null)} onDelete={requestDelete} />
      {dialog}
    </div>
  )
}
