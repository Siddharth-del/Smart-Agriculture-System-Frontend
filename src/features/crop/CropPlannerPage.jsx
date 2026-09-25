import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Sprout, FlaskConical, CloudSun, RotateCcw, Info } from 'lucide-react'
import { useRecommendCropMutation, cropNameOf } from './cropApi'
import { useWeatherByCityQuery } from '../weather/weatherApi'
import { useMyProfileQuery } from '../profile/profileApi'
import { selectRoles } from '../auth/authSlice'
import { Alert, Badge, Button, Card, CardHeader, EmptyState, Field, Input, Meter, PageHeader, RichText, Skeleton, SkeletonText } from '../../shared/ui'
import { useDebouncedValue, useDocumentTitle, useForm } from '../../shared/hooks'
import { rules } from '../../shared/utils/validation'
import { normaliseWeather, SOIL_LIMITS } from '../../shared/utils/agronomy'
import { fmtNumber, toPercent, titleCase } from '../../shared/utils/format'
import { useToast } from '../../shared/toast/ToastProvider'

const SOIL_KEYS = ['nitrogen', 'phosphorus', 'potassium', 'ph', 'rainfall']
const numRules = (k) => {
  const l = SOIL_LIMITS[k]
  return [rules.required(l.label), rules.number(l.label), rules.range(l.label, l.min, l.max, l.unit ? ` ${l.unit}` : '')]
}


export default function CropPlannerPage() {
  useDocumentTitle('Crop planner')
  const toast = useToast()
  const roles = useSelector(selectRoles)
  const profile = useMyProfileQuery(undefined, { skip: !roles.includes('FARMER') })
  const [recommend, { data: result, isLoading, error, reset: resetResult }] = useRecommendCropMutation()
  const [submitted, setSubmitted] = useState(null)

  const defaultLocation = profile.data?.district || profile.data?.farmLocation || ''
  const form = useForm(
    { nitrogen: '', phosphorus: '', potassium: '', ph: '', rainfall: '', location: defaultLocation },
    {
      ...Object.fromEntries(SOIL_KEYS.map((k) => [k, numRules(k)])),
      location: [rules.required('Location'), rules.maxLength('Location', 100)],
    },
  )
  // Pre-fill location once the profile loads, without overwriting user input.
  const { setField } = form
  const locationEmpty = !form.values.location
  useEffect(() => {
    if (defaultLocation && locationEmpty) setField('location', defaultLocation)
    // Only react to the profile arriving, not to the user clearing the field.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultLocation, setField])

  // Temperature and humidity are not sent: the backend reads them from live weather
  // for this location. Previewing the same source keeps the user informed.
  const loc = useDebouncedValue(form.values.location.trim(), 700)
  const wxQ = useWeatherByCityQuery(loc, { skip: loc.length < 2 })
  const wx = normaliseWeather(wxQ.data)

  const onSubmit = form.handleSubmit(async (v) => {
    const payload = { ...Object.fromEntries(SOIL_KEYS.map((k) => [k, Number(v[k])])), location: v.location.trim() }
    try {
      await recommend(payload).unwrap()
      setSubmitted({ ...payload, temperature: wx?.temp, humidity: wx?.humidity })
      requestAnimationFrame(() => document.getElementById('crop-result')?.focus())
    } catch (e) {
      if (e.fieldErrors) form.setServerErrors(e.fieldErrors)
      else toast.error(e.message)
    }
  })

  const confidence = toPercent(result?.cropConfidence)
  const confTone = confidence == null ? 'neutral' : confidence >= 70 ? 'success' : confidence >= 40 ? 'warning' : 'danger'
  const cropName = titleCase(cropNameOf(result))

  const summary = useMemo(() => submitted && [
    ['N', submitted.nitrogen], ['P', submitted.phosphorus], ['K', submitted.potassium], ['pH', submitted.ph],
    ['Rain', `${submitted.rainfall} mm`], ['Temp', submitted.temperature != null ? `${fmtNumber(submitted.temperature)}°C` : '—'],
    ['Humidity', submitted.humidity != null ? `${fmtNumber(submitted.humidity)}%` : '—'],
  ], [submitted])

  return (
    <div className="page">
      <PageHeader title="Crop planner" description="Enter your soil test results to find the crop best suited to your field." />

      <div className="grid-main-side grid-main-side--even">
        <Card aria-labelledby="soil-h">
          <CardHeader id="soil-h" title="Soil and climate" icon={FlaskConical} description="Values from your Soil Health Card or lab report." />
          <form onSubmit={onSubmit} noValidate className="ui-stack">
            <fieldset className="form-grid-3">
              <legend className="sr-only">Soil nutrients</legend>
              {['nitrogen', 'phosphorus', 'potassium'].map((k) => (
                <Field key={k} label={SOIL_LIMITS[k].label} error={form.field(k).error} required>
                  <Input {...form.field(k)} type="number" inputMode="decimal" min={0} max={300} step="any" suffix="kg/ha" />
                </Field>
              ))}
            </fieldset>
            <div className="form-grid-2">
              <Field label="Soil pH" hint="0 to 14. Most crops prefer 6–7.5." error={form.field('ph').error} required>
                <Input {...form.field('ph')} type="number" inputMode="decimal" min={0} max={14} step={0.1} />
              </Field>
              <Field label="Annual rainfall" hint="Average for your area." error={form.field('rainfall').error} required>
                <Input {...form.field('rainfall')} type="number" inputMode="decimal" min={0} max={2000} step="any" suffix="mm" />
              </Field>
            </div>
            <Field label="Farm location" hint="City or district, used to read live temperature and humidity." error={form.field('location').error} required>
              <Input {...form.field('location')} autoComplete="address-level2" />
            </Field>

            <div className="climate-preview" aria-live="polite">
              <CloudSun size={18} aria-hidden="true" />
              {loc.length < 2 ? <span>Temperature and humidity will be read from live weather for your location.</span>
                : wxQ.isFetching ? <Skeleton width={220} />
                  : wx ? <span>Using <strong className="ui-num">{fmtNumber(wx.temp)}°C</strong> and <strong className="ui-num">{fmtNumber(wx.humidity)}%</strong> humidity from {wx.city}.</span>
                    : <span className="ui-tone-text--warning">We couldn’t find weather for “{loc}”. Check the spelling — the recommendation needs it.</span>}
            </div>

            <div className="form-actions">
              <Button type="button" variant="ghost" icon={RotateCcw} onClick={() => { form.reset({ nitrogen: '', phosphorus: '', potassium: '', ph: '', rainfall: '', location: defaultLocation }); resetResult(); setSubmitted(null) }}>Clear</Button>
              <Button type="submit" icon={Sprout} loading={isLoading}>Recommend a crop</Button>
            </div>
          </form>
        </Card>

        <Card aria-labelledby="rec-h" aria-busy={isLoading}>
          <CardHeader id="rec-h" title="Recommendation" icon={Sprout} />
          {isLoading ? (
            <div className="ui-stack" role="status" aria-label="Analysing soil"><Skeleton height={40} width="60%" /><Skeleton height={10} /><SkeletonText lines={5} /><p className="fine-print">Analysing soil and preparing advice — this can take up to 30 seconds.</p></div>
          ) : error && !result ? (
            <Alert tone="danger" title="No recommendation">{error.message}</Alert>
          ) : !result ? (
            <EmptyState icon={Sprout} title="Your recommendation appears here">Fill in all five soil values and your location, then select Recommend a crop.</EmptyState>
          ) : (
            <div className="ui-stack" id="crop-result" tabIndex={-1}>
              <div className="rec-hero">
                <p className="rec-hero__label">Best match</p>
                <p className="rec-hero__crop">{cropName || 'Unknown crop'}</p>
                <Badge tone={confTone}>{confidence == null ? 'Confidence unavailable' : confidence >= 70 ? 'Strong match' : confidence >= 40 ? 'Moderate match' : 'Weak match'}</Badge>
              </div>
              {confidence != null && <Meter label="Model confidence" value={confidence} tone={confTone} />}
              {confidence != null && confidence < 40 && (
                <Alert tone="warning" icon={Info}>Low confidence usually means the soil values sit between crop profiles. Recheck your soil report or ask an agronomist before planting.</Alert>
              )}
              {summary && (
                <ul className="kv-chips" aria-label="Inputs used">
                  {summary.map(([k, v]) => <li key={k}><span>{k}</span><strong className="ui-num">{v}</strong></li>)}
                </ul>
              )}
              {result.explanation && (<><h3 className="subhead">Why this crop</h3><RichText text={result.explanation} /></>)}
              <Button variant="secondary" to={`/app/assistant?topic=crop&q=${encodeURIComponent(cropName)}`}>Get a care plan for {cropName}</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
