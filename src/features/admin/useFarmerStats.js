import { useMemo } from 'react'

/** Aggregates computed from the real /api/admin/farmers response. */
export function useFarmerStats(farmers) {
  return useMemo(() => {
    const list = farmers || []
    const byState = new Map()
    let complete = 0
    for (const f of list) {
      const s = (f.state || 'Not set').trim()
      byState.set(s, (byState.get(s) || 0) + 1)
      if (f.district && f.contactNumber && f.farmLocation) complete++
    }
    const states = [...byState.entries()].map(([state, count]) => ({ state, count })).sort((a, b) => b.count - a.count)
    return {
      total: list.length,
      states,
      stateCount: states.filter((s) => s.state !== 'Not set').length,
      districtCount: new Set(list.map((f) => f.district?.trim().toLowerCase()).filter(Boolean)).size,
      completeness: list.length ? Math.round((complete / list.length) * 100) : 0,
      recent: [...list].sort((a, b) => (b.profileId ?? 0) - (a.profileId ?? 0)).slice(0, 5),
    }
  }, [farmers])
}
