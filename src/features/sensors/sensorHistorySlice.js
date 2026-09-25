import { createSlice } from '@reduxjs/toolkit'

// The backend only exposes the latest reading, so the trend chart is built from
// real readings received while this browser session is open. Capped and persisted
// per-tab so a refresh doesn't wipe it.
const KEY = 'ap_sensor_history'
const MAX = 60

const load = () => {
  try { return JSON.parse(sessionStorage.getItem(KEY) || '[]').slice(-MAX) } catch { return [] }
}

const slice = createSlice({
  name: 'sensorHistory',
  initialState: { readings: load() },
  reducers: {
    readingReceived(state, { payload }) {
      if (!payload?.recordedAt || payload.soilMoisture == null) return
      if (state.readings.some((r) => r.recordedAt === payload.recordedAt)) return
      state.readings.push({
        recordedAt: payload.recordedAt,
        soilMoisture: payload.soilMoisture,
        temperature: payload.temperature ?? null,
        humidity: payload.humidity ?? null,
        status: payload.status,
      })
      state.readings = state.readings.slice(-MAX)
      try { sessionStorage.setItem(KEY, JSON.stringify(state.readings)) } catch { /* noop */ }
    },
    historyCleared(state) {
      state.readings = []
      try { sessionStorage.removeItem(KEY) } catch { /* noop */ }
    },
  },
})

export const { readingReceived, historyCleared } = slice.actions
export default slice.reducer
