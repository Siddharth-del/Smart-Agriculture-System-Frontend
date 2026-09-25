import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'

/**
 * Sortable, paginated table. On narrow screens rows reflow into labelled
 * cards via CSS (each cell carries data-label), so no horizontal scrolling.
 * columns: [{ key, header, render?, sortValue?, sortable?, align?, hideOnMobile? }]
 */
export function DataTable({ columns, rows, rowKey, caption, pageSize = 10, onRowClick, initialSort }) {
  const [sort, setSort] = useState(initialSort || null)
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    const get = col?.sortValue || ((r) => r[sort.key])
    return [...rows].sort((a, b) => {
      const av = get(a) ?? ''; const bv = get(b) ?? ''
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' })
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [rows, sort, columns])

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(page, pages - 1)
  const visible = sorted.slice(current * pageSize, (current + 1) * pageSize)

  const toggle = (key) => setSort((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null))

  return (
    <div className="ui-table-wrap">
      <table className="ui-table">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort?.key === c.key
              const Icon = !active ? ChevronsUpDown : sort.dir === 'asc' ? ChevronUp : ChevronDown
              return (
                <th key={c.key} scope="col" style={{ textAlign: c.align }} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {c.sortable === false ? c.header : (
                    <button type="button" className="ui-table__sort" onClick={() => toggle(c.key)}>
                      {c.header}<Icon size={14} aria-hidden="true" />
                    </button>
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => (
            <tr
              key={rowKey(r)}
              className={onRowClick ? 'is-clickable' : undefined}
              onClick={onRowClick ? (e) => { if (!e.target.closest('button,a')) onRowClick(r) } : undefined}
            >
              {columns.map((c) => (
                <td key={c.key} data-label={c.header} style={{ textAlign: c.align }} className={c.hideOnMobile ? 'hide-mobile' : undefined}>
                  {c.render ? c.render(r) : r[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {pages > 1 && (
        <nav className="ui-pager" aria-label="Table pages">
          <span className="ui-pager__info">
            {current * pageSize + 1}–{Math.min((current + 1) * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="ui-pager__btns">
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</button>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Next</button>
          </div>
        </nav>
      )}
    </div>
  )
}
