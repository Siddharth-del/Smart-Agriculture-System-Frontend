import { lazy, Suspense, useState } from 'react'
import { Cpu, KeyRound, Pause, Play, RefreshCw, RotateCcw, Send, TrendingUp, Radio, PauseCircle, BookOpen } from 'lucide-react'
import { useLiveSensor } from './useLiveSensor'
import MoistureBand from './MoistureBand'
import { useRegisterDeviceKeyMutation, useResetMoistureMutation, useTriggerIrrigationAlertMutation } from './sensorApi'
import { historyCleared } from './sensorHistorySlice'
import { useDispatch } from 'react-redux'
import { env } from '../../config/env'
import {
  Alert, Badge, Button, Card, CardHeader, ConfirmDialog, DescriptionList, Dialog, EmptyState, ErrorState, Field, Input, PageHeader, Skeleton,
} from '../../shared/ui'
import { useDocumentTitle, useForm, useNow } from '../../shared/hooks'
import { rules } from '../../shared/utils/validation'
import { statusMeta } from '../../shared/utils/agronomy'
import { fmtDateTime, fmtNumber, fmtRelative } from '../../shared/utils/format'
import { useToast } from '../../shared/toast/ToastProvider'

const SensorTrendChart = lazy(() => import('./SensorTrendChart'))

function RegisterKeyDialog({ open, onClose }) {
  const toast = useToast()
  const [register, { isLoading, error, reset }] = useRegisterDeviceKeyMutation()
  const form = useForm({ key: '' }, {
    key: [rules.required('Device key'), rules.minLength('Device key', 8), rules.maxLength('Device key', 128),
      rules.pattern(/^[\w-]+$/, 'Use letters, numbers, hyphens or underscores only.')],
  })
  const close = () => { form.reset(); reset(); onClose() }
  const submit = form.handleSubmit(async ({ key }) => {
    try {
      await register(key.trim()).unwrap()
      toast.success('Device key registered. New readings will appear shortly.')
      close()
    } catch { /* shown inline */ }
  })
  return (
    <Dialog
      open={open} onClose={close} title="Register device key"
      description="Use the same key you flashed into your ESP32 firmware."
      footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button type="submit" form="devkey" loading={isLoading}>Register key</Button></>}
    >
      <form id="devkey" onSubmit={submit} noValidate className="ui-stack">
        {error && <Alert tone="danger">{/already/i.test(error.message) ? 'Another account already uses this key. Generate a new one for this device.' : error.message}</Alert>}
        <Field label="Device key" hint="The value your firmware sends in the X-Device-Api-Key header." error={form.field('key').error} required>
          <Input {...form.field('key')} autoComplete="off" spellCheck={false} autoCapitalize="none" className="ui-mono" />
        </Field>
      </form>
    </Dialog>
  )
}

function IrrigationCheck({ defaultCity, defaultMoisture }) {
  const toast = useToast()
  const [trigger, { isLoading, data, error, reset }] = useTriggerIrrigationAlertMutation()
  const form = useForm(
    { city: defaultCity || '', soilMoisture: defaultMoisture != null ? String(Math.round(defaultMoisture)) : '' },
    { city: [rules.required('City')], soilMoisture: [rules.required('Soil moisture'), rules.number('Soil moisture'), rules.range('Soil moisture', 0, 100, '%')] },
  )
  const submit = form.handleSubmit(async ({ city, soilMoisture }) => {
    reset()
    try {
      await trigger({ city: city.trim(), soilMoisture: Number(soilMoisture) }).unwrap()
      toast.success('Irrigation check complete.')
    } catch { /* inline */ }
  })
  return (
    <Card aria-labelledby="check-h">
      <CardHeader id="check-h" title="Run an irrigation check" icon={Send} description="Checks a moisture value against local weather and emails you if irrigation is needed." />
      <form onSubmit={submit} noValidate className="form-grid-2">
        <Field label="City" error={form.field('city').error} required><Input {...form.field('city')} autoComplete="address-level2" /></Field>
        <Field label="Soil moisture" error={form.field('soilMoisture').error} required>
          <Input {...form.field('soilMoisture')} type="number" inputMode="decimal" min={0} max={100} step={1} suffix="%" />
        </Field>
        <div className="form-actions span-2"><Button type="submit" variant="secondary" icon={Send} loading={isLoading}>Run check</Button></div>
      </form>
      {error && <Alert tone="danger">{error.message}</Alert>}
      {data && <Alert tone="success" title="Result">{typeof data === 'string' ? data : data.message}</Alert>}
    </Card>
  )
}

export default function FieldMonitorPage() {
  useDocumentTitle('Field monitor')
  const dispatch = useDispatch()
  const toast = useToast()
  const now = useNow(15000)
  const [paused, setPaused] = useState(false)
  const [keyOpen, setKeyOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const sensor = useLiveSensor({ paused })
  const [resetMoisture, resetState] = useResetMoistureMutation()
  const status = statusMeta(sensor.reading?.status)

  const doReset = async () => {
    try {
      await resetMoisture().unwrap()
      toast.success('Soil moisture baseline reset.')
      setConfirmReset(false)
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="page">
      <PageHeader
        title="Field monitor"
        description="Live readings from your ESP32 soil sensor."
        actions={(
          <>
            <span className={`live-pill ${sensor.live ? 'is-live' : ''}`}>
              {sensor.live ? <Radio size={14} aria-hidden="true" /> : <PauseCircle size={14} aria-hidden="true" />}
              {sensor.live ? `Live · every ${sensor.pollSeconds}s` : 'Paused'}
            </span>
            <Button variant="secondary" size="sm" icon={paused ? Play : Pause} onClick={() => setPaused((p) => !p)}>{paused ? 'Resume' : 'Pause'}</Button>
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={sensor.refetch} loading={sensor.isFetching && !sensor.isLoading}>Refresh</Button>
          </>
        )}
      />

      <div className="grid-main-side">
        <Card aria-labelledby="live-h">
          <CardHeader id="live-h" title="Latest reading" icon={Cpu} actions={sensor.reading && <Badge tone={status.tone} dot>{status.label}</Badge>} />
          {sensor.isLoading ? <Skeleton height={120} radius={10} /> : sensor.error && !sensor.data ? (
            <ErrorState compact error={sensor.error} onRetry={sensor.refetch} />
          ) : sensor.noDevice ? (
            <EmptyState icon={Cpu} title="Waiting for your first reading" action={<Button icon={KeyRound} onClick={() => setKeyOpen(true)}>Register device key</Button>}>
              Register the device key from your ESP32 firmware. Once the device posts data, it shows up here automatically.
            </EmptyState>
          ) : (
            <div className="ui-stack">
              <MoistureBand value={sensor.reading.soilMoisture} />
              {sensor.stale && <Alert tone="warning">No new data for over 30 minutes. Check the device’s power supply and Wi-Fi.</Alert>}
              <DescriptionList items={[
                { term: 'Recorded', value: `${fmtDateTime(sensor.reading.recordedAt)} (${fmtRelative(sensor.reading.recordedAt, now)})` },
                { term: 'Air temperature', value: `${fmtNumber(sensor.reading.temperature)}°C` },
                { term: 'Humidity', value: `${fmtNumber(sensor.reading.humidity)}%` },
                { term: 'City', value: sensor.reading.city },
                { term: 'Device', value: sensor.reading.deviceId },
                { term: 'Last alert email', value: sensor.reading.emailStatus },
              ]} />
            </div>
          )}
        </Card>

        <div className="ui-stack">
          <Card aria-labelledby="dev-h">
            <CardHeader id="dev-h" title="Device" icon={KeyRound} />
            <div className="ui-stack-sm">
              <Button variant="secondary" full icon={KeyRound} onClick={() => setKeyOpen(true)}>Register or change key</Button>
              <Button variant="ghost" full icon={RotateCcw} onClick={() => setConfirmReset(true)}>Reset moisture baseline</Button>
            </div>
          </Card>
          <Card aria-labelledby="fw-h">
            <CardHeader id="fw-h" title="Firmware settings" icon={BookOpen} />
            <DescriptionList items={[
              { term: 'Endpoint', value: <code className="ui-mono break">POST {env.apiBaseUrl || window.location.origin}/api/sensor/data</code> },
              { term: 'Header', value: <code className="ui-mono">X-Device-Api-Key</code> },
              { term: 'Body', value: <code className="ui-mono break">{'{ "city", "soilMoisture", "deviceId" }'}</code> },
            ]} />
          </Card>
        </div>
      </div>

      <Card aria-labelledby="hist-h">
        <CardHeader
          id="hist-h" title="Readings this session" icon={TrendingUp}
          description="The shaded band marks the optimal 30–60% range."
          actions={sensor.history.length > 0 && <Button variant="ghost" size="sm" onClick={() => dispatch(historyCleared())}>Clear</Button>}
        />
        {sensor.history.length < 2 ? (
          <EmptyState compact icon={TrendingUp} title="Not enough readings yet">New readings are added every time the sensor reports.</EmptyState>
        ) : (
          <Suspense fallback={<Skeleton height={260} radius={10} />}><SensorTrendChart readings={sensor.history} height={260} /></Suspense>
        )}
      </Card>

      <IrrigationCheck key={sensor.reading?.city || 'none'} defaultCity={sensor.reading?.city} defaultMoisture={sensor.reading?.soilMoisture} />

      <RegisterKeyDialog open={keyOpen} onClose={() => setKeyOpen(false)} />
      <ConfirmDialog
        open={confirmReset} onClose={() => setConfirmReset(false)} onConfirm={doReset} loading={resetState.isLoading}
        title="Reset soil moisture baseline?" confirmLabel="Reset baseline"
      >
        <p>Your latest stored moisture value will be cleared. Live readings resume as soon as the sensor next reports.</p>
      </ConfirmDialog>
    </div>
  )
}
