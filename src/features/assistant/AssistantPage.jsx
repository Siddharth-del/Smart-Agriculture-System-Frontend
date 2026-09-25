import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { Send, Square, Sprout, Bug, Trash2, RotateCcw, Leaf, FlaskConical, ShieldPlus, Cpu } from 'lucide-react'
import { useCropAdvisoryMutation, useDiseaseAdvisoryMutation } from './advisoryApi'
import { useLatestReadingQuery } from '../sensors/sensorApi'
import { selectRoles } from '../auth/authSlice'
import { Alert, Button, IconButton, PageHeader, RichText, Segmented, Spinner } from '../../shared/ui'
import { useDocumentTitle } from '../../shared/hooks'
import { titleCase } from '../../shared/utils/format'

const KEY = 'ap_assistant_thread'
const TOPICS = {
  crop: { label: 'Crop care', icon: Sprout, placeholder: 'Which crop? e.g. Wheat', verb: 'care plan for', examples: ['Wheat', 'Rice', 'Tomato', 'Cotton'] },
  disease: { label: 'Disease treatment', icon: Bug, placeholder: 'Which disease? e.g. Early blight', verb: 'treatment for', examples: ['Early blight', 'Leaf rust', 'Powdery mildew', 'Bacterial spot'] },
}

const loadThread = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || '[]') } catch { return [] } }

function AssistantMessage({ m, onRetry }) {
  if (m.status === 'pending') {
    return <div className="msg msg--bot"><div className="msg__bubble msg__bubble--pending"><Spinner size={16} label="" />Preparing advice…</div></div>
  }
  if (m.status === 'error') {
    return (
      <div className="msg msg--bot">
        <div className="msg__bubble msg__bubble--error">
          <p>{m.error}</p>
          {m.error !== 'Stopped.' && <Button size="sm" variant="secondary" icon={RotateCcw} onClick={onRetry}>Try again</Button>}
        </div>
      </div>
    )
  }
  const { fertilizerRecommendation: fert, pesticideRecommendation: pest, explanation } = m.data || {}
  return (
    <div className="msg msg--bot" lang={m.lang}>
      <div className="msg__bubble">
        {m.usedSensor && <p className="msg__context"><Cpu size={13} aria-hidden="true" />Used your latest sensor reading</p>}
        {explanation && <RichText text={explanation} />}
        {(fert || pest) && (
          <div className="treatment treatment--compact">
            {fert && <div className="treatment__item"><h4 className="subhead"><FlaskConical size={15} aria-hidden="true" />{m.lang === 'hi' ? 'उर्वरक' : 'Fertilizer'}</h4><RichText text={fert} /></div>}
            {pest && <div className="treatment__item"><h4 className="subhead"><ShieldPlus size={15} aria-hidden="true" />{m.lang === 'hi' ? 'कीटनाशक' : 'Pesticide'}</h4><RichText text={pest} /></div>}
          </div>
        )}
        {!explanation && !fert && !pest && <p>The advisor returned an empty answer. Try rephrasing the name.</p>}
      </div>
    </div>
  )
}

export default function AssistantPage() {
  useDocumentTitle('Farm assistant')
  const [params, setParams] = useSearchParams()
  const appLang = useSelector((s) => s.settings.lang)
  const roles = useSelector(selectRoles)
  const [topic, setTopic] = useState(params.get('topic') === 'disease' ? 'disease' : 'crop')
  const [lang, setLang] = useState(appLang)
  const [text, setText] = useState(params.get('q') ? titleCase(params.get('q').replace(/_+/g, ' ')) : '')
  const [inputError, setInputError] = useState('')
  const [thread, setThread] = useState(loadThread)
  const inflight = useRef(null)
  const logRef = useRef(null)
  const inputRef = useRef(null)

  const [cropAdvice] = useCropAdvisoryMutation()
  const [diseaseAdvice] = useDiseaseAdvisoryMutation()
  const sensor = useLatestReadingQuery(undefined, { skip: !roles.includes('FARMER') })
  const busy = thread.some((m) => m.status === 'pending')

  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(thread.filter((m) => m.status !== 'pending').slice(-40))) } catch { /* noop */ }
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [thread])

  useEffect(() => { if (params.get('q')) { setParams({}, { replace: true }); inputRef.current?.focus() } }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const ask = async ({ topic: tp, subject, lang: lg }) => {
    const id = crypto.randomUUID?.() || String(Date.now())
    const s = sensor.data
    const sensorData = tp === 'crop' && s?.soilMoisture != null
      ? { temperature: s.temperature, humidity: s.humidity, soilMoisture: s.soilMoisture }
      : undefined
    setThread((t) => [...t,
      { id: `${id}-q`, role: 'user', topic: tp, subject, lang: lg },
      { id, role: 'bot', status: 'pending', topic: tp, subject, lang: lg },
    ])
    const req = tp === 'crop' ? cropAdvice({ crop: subject, lang: lg, sensorData }) : diseaseAdvice({ disease: subject, lang: lg })
    inflight.current = req
    try {
      const data = await req.unwrap()
      setThread((t) => t.map((m) => (m.id === id ? { ...m, status: 'done', data, usedSensor: Boolean(sensorData) } : m)))
    } catch (e) {
      const msg = e?.code === 'ABORTED' || e?.name === 'AbortError' ? 'Stopped.' : e?.message || 'The advisor did not respond.'
      setThread((t) => t.map((m) => (m.id === id ? { ...m, status: 'error', error: msg } : m)))
    } finally {
      inflight.current = null
    }
  }

  const submit = (e) => {
    e.preventDefault()
    const subject = text.trim().replace(/\s+/g, ' ')
    if (subject.length < 2) return setInputError(`Enter a ${topic === 'crop' ? 'crop' : 'disease'} name.`)
    if (subject.length > 60 || !/^[\p{L}\p{M} ()'-]+$/u.test(subject)) return setInputError('Use just the name, for example “Early blight”.')
    setInputError('')
    setText('')
    ask({ topic, subject, lang })
  }

  const T = TOPICS[topic]

  return (
    <div className="page page--chat">
      <PageHeader
        title="Farm assistant"
        description="Crop care plans and disease treatment advice from AgriPro’s AI advisor."
        actions={thread.length > 0 && <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setThread([])} disabled={busy}>Clear chat</Button>}
      />

      <div className="chat">
        <div className="chat__log" ref={logRef} role="log" aria-live="polite" aria-label="Conversation">
          {thread.length === 0 ? (
            <div className="chat__welcome">
              <Leaf size={28} aria-hidden="true" />
              <h2>What do you need help with?</h2>
              <p>Name a crop to get fertilizer, pesticide and growing advice — using your latest sensor reading when one is available. Or name a disease to get a treatment plan.</p>
              <div className="chat__examples">
                {Object.entries(TOPICS).map(([k, tp]) => tp.examples.slice(0, 2).map((ex) => (
                  <button key={k + ex} type="button" className="chip-btn" onClick={() => { setTopic(k); ask({ topic: k, subject: ex, lang }) }}>
                    <tp.icon size={14} aria-hidden="true" />{tp.verb[0].toUpperCase() + tp.verb.slice(1)} {ex.toLowerCase()}
                  </button>
                )))}
              </div>
            </div>
          ) : thread.map((m) => (m.role === 'user' ? (
            <div key={m.id} className="msg msg--user">
              <div className="msg__bubble">{m.lang === 'hi' ? `${m.subject} — हिन्दी में ${m.topic === 'crop' ? 'फसल सलाह' : 'रोग उपचार'}` : `${TOPICS[m.topic].verb[0].toUpperCase() + TOPICS[m.topic].verb.slice(1)} ${m.subject}`}</div>
            </div>
          ) : (
            <AssistantMessage key={m.id} m={m} onRetry={() => { setThread((t) => t.filter((x) => x.id !== m.id && x.id !== `${m.id}-q`)); ask(m) }} />
          )))}
        </div>

        <form className="chat__composer" onSubmit={submit} noValidate>
          <div className="chat__controls">
            <Segmented label="Topic" size="sm" value={topic} onChange={setTopic} options={Object.entries(TOPICS).map(([value, tp]) => ({ value, label: tp.label, icon: tp.icon }))} />
            <Segmented label="Answer language" size="sm" value={lang} onChange={setLang} options={[{ value: 'en', label: 'English' }, { value: 'hi', label: 'हिन्दी' }]} />
          </div>
          <div className="chat__input-row">
            <label htmlFor="chat-input" className="sr-only">{T.placeholder}</label>
            <input
              id="chat-input" ref={inputRef} className="ui-input" value={text} placeholder={T.placeholder} maxLength={60}
              onChange={(e) => { setText(e.target.value); setInputError('') }} aria-invalid={inputError ? 'true' : undefined} aria-describedby={inputError ? 'chat-err' : undefined}
              autoComplete="off" enterKeyHint="send"
            />
            {busy
              ? <IconButton icon={Square} label="Stop" className="chat__send" onClick={() => inflight.current?.abort()} />
              : <button type="submit" className="ui-btn ui-btn--primary ui-btn--md chat__send" aria-label="Send"><Send size={17} aria-hidden="true" /></button>}
          </div>
          {inputError && <p id="chat-err" className="ui-error">{inputError}</p>}
          {sensor.error?.code === 'OFFLINE' && <Alert tone="warning">You’re offline. Messages will fail until you reconnect.</Alert>}
        </form>
      </div>
      <p className="fine-print">AI advice can be wrong. Check product labels and local extension guidance before applying chemicals.</p>
    </div>
  )
}
