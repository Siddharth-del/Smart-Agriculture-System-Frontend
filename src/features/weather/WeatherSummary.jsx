import { Cloud, CloudRain, CloudSun, Sun, CloudLightning, CloudFog, Snowflake, Droplets, Wind, Gauge } from 'lucide-react'
import { fmtNumber } from '../../shared/utils/format'

export function conditionIcon(condition = '') {
  if (/thunder/i.test(condition)) return CloudLightning
  if (/rain|drizzle/i.test(condition)) return CloudRain
  if (/snow/i.test(condition)) return Snowflake
  if (/mist|fog|haze|smoke|dust/i.test(condition)) return CloudFog
  if (/clear/i.test(condition)) return Sun
  if (/cloud/i.test(condition)) return /few|scattered/i.test(condition) ? CloudSun : Cloud
  return CloudSun
}

export default function WeatherSummary({ wx, compact }) {
  const Icon = conditionIcon(wx.description || wx.condition)
  return (
    <div className={`wx ${compact ? 'wx--compact' : ''}`}>
      <div className="wx__main">
        <Icon size={compact ? 36 : 52} className="wx__icon" aria-hidden="true" />
        <div>
          <p className="wx__temp ui-num">{fmtNumber(wx.temp)}°<span>C</span></p>
          <p className="wx__desc">{wx.description || wx.condition}</p>
          <p className="wx__place">{wx.city}{wx.country ? `, ${wx.country}` : ''}</p>
        </div>
      </div>
      <dl className="wx__metrics">
        <div><dt><Droplets size={14} aria-hidden="true" />Humidity</dt><dd className="ui-num">{fmtNumber(wx.humidity)}%</dd></div>
        <div><dt><Wind size={14} aria-hidden="true" />Wind</dt><dd className="ui-num">{fmtNumber(wx.windKmh)} km/h</dd></div>
        {!compact && <div><dt><Gauge size={14} aria-hidden="true" />Pressure</dt><dd className="ui-num">{fmtNumber(wx.pressure)} hPa</dd></div>}
      </dl>
    </div>
  )
}

export function FieldWindows({ windows }) {
  return (
    <ul className="windows">
      {windows.map((w) => (
        <li key={w.key} className={`windows__item ui-tone-border--${w.tone}`}>
          <div className="windows__head">
            <span className="windows__title">{w.title}</span>
            <span className={`ui-badge ui-tone--${w.tone}`}>{w.verdict}</span>
          </div>
          <p className="windows__detail">{w.detail}</p>
        </li>
      ))}
    </ul>
  )
}
