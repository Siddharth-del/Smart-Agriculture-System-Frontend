// Pure, testable rules that turn real readings into plain-language guidance.
// Nothing here invents data: every function returns null/[] when input is missing.

export const MOISTURE_BANDS = [
  { max: 30, key: 'dry', label: 'Below threshold', tone: 'danger' }, // matches irrigation.moisture.threshold default
  { max: 60, key: 'optimal', label: 'Optimal', tone: 'success' },
  { max: 80, key: 'moist', label: 'Moist', tone: 'info' },
  { max: 100, key: 'wet', label: 'Waterlogged', tone: 'warning' },
]
export const moistureBand = (v) => (v == null ? null : MOISTURE_BANDS.find((b, i) => (i === 0 ? v < b.max : v <= b.max)) || MOISTURE_BANDS.at(-1))

export const STATUS_META = {
  OK: { label: 'Healthy', tone: 'success' },
  WARNING: { label: 'Needs attention', tone: 'warning' },
  CRITICAL: { label: 'Irrigate now', tone: 'danger' },
  'No Data': { label: 'No readings yet', tone: 'neutral' },
}
export const statusMeta = (s) => STATUS_META[s] || { label: s || 'Unknown', tone: 'neutral' }

/** Minutes after which a sensor reading is considered stale. */
export const STALE_AFTER_MIN = 30

/** Normalise the backend's OpenWeather-shaped response. */
export function normaliseWeather(w) {
  if (!w?.main) return null
  const cond = w.weather?.[0] || {}
  return {
    city: w.name, country: w.sys?.country,
    temp: w.main.temp, humidity: w.main.humidity, pressure: w.main.pressure,
    windKmh: w.wind?.speed != null ? w.wind.speed * 3.6 : null,
    condition: cond.main || '', description: cond.description || '',
    observedAt: w.dt ? new Date(w.dt * 1000) : null,
    lat: w.coord?.lat, lon: w.coord?.lon,
  }
}

const isWet = (c = '') => /rain|drizzle|thunder|snow/i.test(c)

/** Field-work suitability from current conditions. */
export function fieldWindows(wx) {
  if (!wx) return []
  const out = []
  const sprayOk = wx.windKmh != null && wx.windKmh < 15 && !isWet(wx.condition) && wx.temp < 32
  out.push({
    key: 'spray', title: 'Spraying',
    tone: sprayOk ? 'success' : 'warning',
    verdict: sprayOk ? 'Suitable now' : 'Hold off',
    detail: sprayOk
      ? 'Low wind and dry conditions keep drift and wash-off low.'
      : [wx.windKmh >= 15 && 'wind is strong enough to cause drift', isWet(wx.condition) && 'rain will wash product off', wx.temp >= 32 && 'heat increases evaporation']
          .filter(Boolean).join(', ').replace(/^./, (c) => c.toUpperCase()) + '.',
  })
  const irrigateTone = isWet(wx.condition) ? 'info' : wx.temp >= 34 || wx.humidity < 35 ? 'warning' : 'success'
  out.push({
    key: 'irrigate', title: 'Irrigation',
    tone: irrigateTone,
    verdict: isWet(wx.condition) ? 'Skip if raining' : irrigateTone === 'warning' ? 'Water early or late' : 'Normal schedule',
    detail: isWet(wx.condition)
      ? 'Rainfall is already adding moisture — check the soil sensor before watering.'
      : irrigateTone === 'warning'
        ? 'High heat or dry air means faster evaporation; avoid midday watering.'
        : 'Conditions are moderate; follow your soil moisture readings.',
  })
  const fungal = wx.humidity >= 80 && wx.temp >= 18 && wx.temp <= 30
  out.push({
    key: 'disease', title: 'Fungal disease risk',
    tone: fungal ? 'danger' : wx.humidity >= 65 ? 'warning' : 'success',
    verdict: fungal ? 'High' : wx.humidity >= 65 ? 'Moderate' : 'Low',
    detail: fungal
      ? 'Warm, humid air favours blight and mildew. Scout leaves and consider a preventive spray.'
      : 'Keep scouting leaves weekly and upload anything unusual to Plant Doctor.',
  })
  return out
}

/** Alerts derived from the latest real sensor reading and current weather. */
export function deriveAlerts({ reading, weather, now = Date.now() }) {
  const alerts = []
  if (reading?.status === 'CRITICAL') {
    alerts.push({ id: 'moist-critical', tone: 'danger', title: 'Soil is critically dry', body: `Moisture is at ${Math.round(reading.soilMoisture)}%. Irrigate as soon as possible.`, action: { to: '/app/field', label: 'Open field monitor' } })
  } else if (reading?.status === 'WARNING') {
    alerts.push({ id: 'moist-warning', tone: 'warning', title: 'Soil moisture is dropping', body: `Moisture is at ${Math.round(reading.soilMoisture)}%. Plan irrigation within the day.`, action: { to: '/app/field', label: 'Open field monitor' } })
  }
  if (reading?.recordedAt) {
    const ageMin = (now - new Date(reading.recordedAt).getTime()) / 60000
    if (ageMin > STALE_AFTER_MIN) {
      alerts.push({ id: 'stale', tone: 'warning', title: 'Sensor has gone quiet', body: `No new reading for ${Math.round(ageMin / 60) >= 1 ? `${Math.round(ageMin / 60)} h` : `${Math.round(ageMin)} min`}. Check the ESP32's power and Wi-Fi.` })
    }
  }
  if (reading?.emailStatus && /fail|error/i.test(reading.emailStatus)) {
    alerts.push({ id: 'email', tone: 'warning', title: 'Alert email was not delivered', body: 'The backend could not send your irrigation alert email.' })
  }
  if (weather) {
    if (weather.temp >= 38) alerts.push({ id: 'heat', tone: 'danger', title: 'Heat stress conditions', body: `${Math.round(weather.temp)}°C in ${weather.city}. Irrigate early morning and shade nurseries.` })
    if (isWet(weather.condition) && reading?.status && reading.status !== 'OK') {
      alerts.push({ id: 'rain', tone: 'info', title: 'Rain may cover irrigation', body: `${weather.description} reported in ${weather.city}. Re-check moisture after it passes.` })
    }
  }
  return alerts
}

/** Crop request ranges — identical to CropRequestDTO constraints. */
export const SOIL_LIMITS = {
  nitrogen: { min: 0, max: 300, unit: 'kg/ha', label: 'Nitrogen (N)' },
  phosphorus: { min: 0, max: 300, unit: 'kg/ha', label: 'Phosphorus (P)' },
  potassium: { min: 0, max: 300, unit: 'kg/ha', label: 'Potassium (K)' },
  ph: { min: 0, max: 14, unit: '', label: 'Soil pH', step: 0.1 },
  rainfall: { min: 0, max: 2000, unit: 'mm', label: 'Rainfall' },
}
