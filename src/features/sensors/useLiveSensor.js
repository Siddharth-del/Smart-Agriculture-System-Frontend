import { useSelector } from 'react-redux'
import { env } from '../../config/env'
import { useOnlineStatus, usePageVisible } from '../../shared/hooks'
import { useLatestReadingQuery } from './sensorApi'
import { STALE_AFTER_MIN } from '../../shared/utils/agronomy'

/**
 * Near-real-time sensor feed. Polls /api/sensor/latest while the tab is visible
 * and online; pauses otherwise to save the farmer's mobile data and battery.
 */
export function useLiveSensor({ skip = false, paused = false } = {}) {
  const visible = usePageVisible()
  const online = useOnlineStatus()
  const live = visible && online && !skip && !paused
  const query = useLatestReadingQuery(undefined, {
    skip,
    pollingInterval: live ? env.sensorPollMs : 0,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  })
  const history = useSelector((s) => s.sensorHistory.readings)

  const reading = query.data
  const hasData = Boolean(reading && reading.status !== 'No Data' && reading.soilMoisture != null)
  const ageMin = reading?.recordedAt ? (Date.now() - new Date(reading.recordedAt).getTime()) / 60000 : null

  return {
    ...query,
    reading: hasData ? reading : null,
    noDevice: Boolean(reading && !hasData),
    history,
    live,
    stale: ageMin != null && ageMin > STALE_AFTER_MIN,
    pollSeconds: Math.round(env.sensorPollMs / 1000),
  }
}
