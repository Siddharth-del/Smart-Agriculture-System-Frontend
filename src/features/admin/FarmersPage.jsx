import { useMemo, useState } from 'react'
import { Search, Users, Download, RefreshCw, Trash2, Eye } from 'lucide-react'
import { useFarmersQuery } from './adminApi'
import FarmerDetailDialog from './FarmerDetailDialog'
import { useDeleteFarmerFlow } from './useDeleteFarmerFlow'
import { Button, Card, DataTable, EmptyState, ErrorState, IconButton, Input, PageHeader, Select, Skeleton } from '../../shared/ui'
import { useDebouncedValue, useDocumentTitle } from '../../shared/hooks'

const csvCell = (v) => {
  const s = String(v ?? '')
  // Neutralise spreadsheet formula injection and escape quotes.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return `"${safe.replace(/"/g, '""')}"`
}

export default function FarmersPage() {
  useDocumentTitle('Farmers')
  const q = useFarmersQuery()
  const [search, setSearch] = useState('')
  const [state, setState] = useState('')
  const [selected, setSelected] = useState(null)
  const term = useDebouncedValue(search.trim().toLowerCase(), 200)
  const { requestDelete, dialog } = useDeleteFarmerFlow({ onDeleted: () => setSelected(null) })

  const states = useMemo(() => [...new Set((q.data || []).map((f) => f.state).filter(Boolean))].sort(), [q.data])
  const rows = useMemo(() => (q.data || []).filter((f) => {
    if (state && f.state !== state) return false
    if (!term) return true
    return [f.fullname, f.username, f.email, f.contactNumber, f.village, f.district, f.state, f.pincode].some((v) => v?.toLowerCase().includes(term))
  }), [q.data, term, state])

  const exportCsv = () => {
    const cols = ['userId', 'fullname', 'username', 'email', 'contactNumber', 'village', 'district', 'state', 'pincode', 'farmLocation']
    const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `agripro-farmers-${new Date().toISOString().slice(0, 10)}.csv` })
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns = [
    { key: 'fullname', header: 'Farmer', render: (f) => <span className="cell-person"><strong>{f.fullname || '—'}</strong><span>@{f.username}</span></span>, sortValue: (f) => f.fullname?.toLowerCase() },
    { key: 'contactNumber', header: 'Mobile', hideOnMobile: true },
    { key: 'district', header: 'District' },
    { key: 'state', header: 'State' },
    { key: 'email', header: 'Email', hideOnMobile: true, render: (f) => <span className="truncate">{f.email}</span> },
    {
      key: 'actions', header: 'Actions', sortable: false, align: 'right',
      render: (f) => (
        <span className="cell-actions">
          <IconButton icon={Eye} label={`View ${f.fullname || f.username}`} onClick={() => setSelected(f.userId)} />
          <IconButton icon={Trash2} label={`Delete ${f.fullname || f.username}`} className="ui-iconbtn--danger" onClick={() => requestDelete(f)} />
        </span>
      ),
    },
  ]

  return (
    <div className="page">
      <PageHeader
        title="Farmers"
        description={q.data ? `${q.data.length} registered farm profiles` : 'Registered farm profiles'}
        actions={(
          <>
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={q.refetch} loading={q.isFetching && !q.isLoading}>Refresh</Button>
            <Button variant="secondary" size="sm" icon={Download} onClick={exportCsv} disabled={!rows.length}>Export CSV</Button>
          </>
        )}
      />
      <Card padded={false}>
        <div className="table-toolbar">
          <label className="sr-only" htmlFor="farmer-search">Search farmers</label>
          <Input id="farmer-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, village, district…" prefix={<Search size={16} aria-hidden="true" />} type="search" />
          <label className="sr-only" htmlFor="farmer-state">Filter by state</label>
          <Select id="farmer-state" value={state} onChange={(e) => setState(e.target.value)} options={states} placeholder="All states" />
        </div>
        {q.isLoading ? (
          <div className="ui-stack card-pad">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height={44} />)}</div>
        ) : q.error && !q.data ? (
          <ErrorState error={q.error} onRetry={q.refetch} />
        ) : !q.data.length ? (
          <EmptyState icon={Users} title="No farmers registered yet">Farmers appear here after they sign up and create a farm profile.</EmptyState>
        ) : !rows.length ? (
          <EmptyState icon={Search} title="No farmers match" action={<Button variant="secondary" size="sm" onClick={() => { setSearch(''); setState('') }}>Clear filters</Button>}>Try a different name, district or state.</EmptyState>
        ) : (
          <DataTable caption="Registered farmers" columns={columns} rows={rows} rowKey={(r) => r.userId} onRowClick={(r) => setSelected(r.userId)} initialSort={{ key: 'fullname', dir: 'asc' }} />
        )}
      </Card>
      <FarmerDetailDialog userId={selected} onClose={() => setSelected(null)} onDelete={requestDelete} />
      {dialog}
    </div>
  )
}
