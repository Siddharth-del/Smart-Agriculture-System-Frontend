import { useEffect, useId, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Camera, ImageUp, ScanLine, Leaf, FlaskConical, ShieldPlus, RefreshCw, Languages, X, CheckCircle2, AlertTriangle, MessagesSquare } from 'lucide-react'
import { useDetectDiseaseMutation } from './diseaseApi'
import { useDiseaseAdvisoryMutation } from '../assistant/advisoryApi'
import { prepareLeafImage, fmtBytes, ACCEPTED_TYPES } from './imageUtils'
import { env } from '../../config/env'
import { Alert, Badge, Button, Card, CardHeader, EmptyState, Meter, PageHeader, RichText, Skeleton, SkeletonText } from '../../shared/ui'
import { useDocumentTitle } from '../../shared/hooks'
import { fmtPercent, parseDiseaseLabel, toPercent } from '../../shared/utils/format'
import { useToast } from '../../shared/toast/ToastProvider'

const LOW_CONFIDENCE = 50

function Dropzone({ onFile, disabled }) {
  const inputId = useId()
  const cameraRef = useRef(null)
  const [drag, setDrag] = useState(false)
  const pick = (files) => { if (files?.[0]) onFile(files[0]) }
  return (
    <div
      className={`dropzone ${drag ? 'is-drag' : ''}`}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); if (!disabled) pick(e.dataTransfer.files) }}
    >
      <ImageUp size={32} aria-hidden="true" className="dropzone__icon" />
      <p className="dropzone__title">Add a photo of the affected leaf</p>
      <p className="dropzone__hint">JPG, PNG or WEBP, up to {env.maxUploadMb} MB. Drag it here or choose below.</p>
      <div className="dropzone__actions">
        <label htmlFor={inputId} className="ui-btn ui-btn--primary ui-btn--md">
          <ImageUp size={17} aria-hidden="true" /><span>Choose photo</span>
        </label>
        <input id={inputId} type="file" accept={ACCEPTED_TYPES.join(',')} className="sr-only" disabled={disabled} onChange={(e) => { pick(e.target.files); e.target.value = '' }} />
        <Button variant="secondary" icon={Camera} onClick={() => cameraRef.current?.click()} disabled={disabled} className="only-touch">Take photo</Button>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { pick(e.target.files); e.target.value = '' }} />
      </div>
    </div>
  )
}

export default function PlantDoctorPage() {
  useDocumentTitle('Plant Doctor')
  const toast = useToast()
  const lang = useSelector((s) => s.settings.lang)
  const [image, setImage] = useState(null) // { file, url, width, height, resized }
  const [fileError, setFileError] = useState('')
  const [preparing, setPreparing] = useState(false)
  const [detect, { data: result, isLoading, error, reset }] = useDetectDiseaseMutation()
  const [advisory, adv] = useDiseaseAdvisoryMutation()

  useEffect(() => () => { if (image?.url) URL.revokeObjectURL(image.url) }, [image?.url])

  const onFile = async (raw) => {
    setFileError(''); reset(); adv.reset()
    setPreparing(true)
    try {
      const prepared = await prepareLeafImage(raw, env.maxUploadMb)
      setImage({ ...prepared, url: URL.createObjectURL(prepared.file) })
    } catch (e) {
      setFileError(e.message)
    } finally {
      setPreparing(false)
    }
  }

  const clear = () => { setImage(null); setFileError(''); reset(); adv.reset() }

  const run = async () => {
    try {
      await detect(image.file).unwrap()
      requestAnimationFrame(() => document.getElementById('diagnosis')?.focus())
    } catch { /* inline */ }
  }

  const top = result?.predicted?.[0]
  const label = top ? parseDiseaseLabel(top.diseaseName) : null
  const conf = toPercent(top?.confidence)
  const low = conf != null && conf < LOW_CONFIDENCE

  const hindi = async () => {
    try { await advisory({ disease: top.diseaseName, lang: 'hi' }).unwrap() } catch (e) { toast.error(e.message) }
  }

  // The backend returns a generic 500 for images it rejects (e.g. not a leaf).
  const errorText = error && (error.status >= 500 && !error.fieldErrors
    ? 'We couldn’t analyse this photo. Make sure a single leaf fills most of the frame, in daylight and in focus, then try again.'
    : error.message)

  return (
    <div className="page">
      <PageHeader title="Plant Doctor" description="Photograph a diseased leaf to identify the problem and get treatment advice." />

      <div className="grid-main-side grid-main-side--even">
        <Card aria-labelledby="photo-h">
          <CardHeader id="photo-h" title="Leaf photo" icon={Camera} actions={image && <Button variant="ghost" size="sm" icon={X} onClick={clear} disabled={isLoading}>Remove</Button>} />
          {preparing ? <Skeleton height={260} radius={12} /> : !image ? (
            <Dropzone onFile={onFile} disabled={isLoading} />
          ) : (
            <div className="ui-stack">
              <figure className="leaf-preview">
                <img src={image.url} alt="Selected leaf" />
                {isLoading && <div className="leaf-preview__scan" aria-hidden="true" />}
              </figure>
              <p className="fine-print">{image.file.name} · {fmtBytes(image.file.size)} · {image.width}×{image.height}{image.resized ? ' · resized for faster upload' : ''}</p>
              <div className="form-actions">
                <label className="ui-btn ui-btn--ghost ui-btn--md">
                  <RefreshCw size={17} aria-hidden="true" /><span>Change photo</span>
                  <input type="file" accept={ACCEPTED_TYPES.join(',')} className="sr-only" disabled={isLoading} onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
                </label>
                <Button icon={ScanLine} onClick={run} loading={isLoading}>{result ? 'Analyse again' : 'Diagnose leaf'}</Button>
              </div>
            </div>
          )}
          {fileError && <Alert tone="danger">{fileError}</Alert>}
          <details className="tips">
            <summary>Tips for an accurate diagnosis</summary>
            <ul>
              <li>Photograph one leaf showing spots, lesions or discolouration clearly.</li>
              <li>Use daylight and avoid harsh shadows or flash glare.</li>
              <li>Fill most of the frame with the leaf and keep it in focus.</li>
            </ul>
          </details>
        </Card>

        <Card aria-labelledby="dx-h" aria-busy={isLoading}>
          <CardHeader id="dx-h" title="Diagnosis" icon={Leaf} />
          {isLoading ? (
            <div className="ui-stack" role="status" aria-label="Analysing leaf">
              <Skeleton height={36} width="70%" /><Skeleton height={10} /><SkeletonText lines={6} />
              <p className="fine-print">Identifying the disease and preparing treatment advice. This can take up to a minute.</p>
            </div>
          ) : errorText ? (
            <Alert tone="danger" title="Diagnosis failed" action={image && <Button size="sm" variant="secondary" onClick={run}>Try again</Button>}>{errorText}</Alert>
          ) : !result ? (
            <EmptyState icon={ScanLine} title="No diagnosis yet">Add a leaf photo and select Diagnose leaf. Results include the likely disease, confidence, and what to apply.</EmptyState>
          ) : !top ? (
            <Alert tone="warning">The model returned no prediction for this photo. Try a clearer image.</Alert>
          ) : (
            <div className="ui-stack" id="diagnosis" tabIndex={-1}>
              <div className={`dx-hero ${label.healthy ? 'is-healthy' : ''}`}>
                {label.healthy ? <CheckCircle2 size={26} aria-hidden="true" /> : <AlertTriangle size={26} aria-hidden="true" />}
                <div>
                  {label.crop && <p className="dx-hero__crop">{label.crop}</p>}
                  <p className="dx-hero__name">{label.healthy ? 'Looks healthy' : label.condition}</p>
                </div>
                <Badge tone={low ? 'warning' : label.healthy ? 'success' : 'danger'}>{low ? 'Uncertain' : label.healthy ? 'Healthy' : 'Disease detected'}</Badge>
              </div>
              {conf != null && <Meter label="Confidence" value={conf} tone={low ? 'warning' : 'brand'} />}
              {low && <Alert tone="warning">The model isn’t sure about this one ({fmtPercent(conf)}). Retake the photo closer and in daylight, or confirm with an agronomist before spraying.</Alert>}

              {result.predicted.length > 1 && (
                <div>
                  <h3 className="subhead">Other possibilities</h3>
                  <ul className="ui-stack-sm">{result.predicted.slice(1, 4).map((p) => (
                    <li key={p.diseaseName}><Meter label={parseDiseaseLabel(p.diseaseName).condition} value={toPercent(p.confidence)} tone="neutral" /></li>
                  ))}</ul>
                </div>
              )}

              {!label.healthy && (
                <div className="treatment">
                  <div className="treatment__item">
                    <h3 className="subhead"><FlaskConical size={16} aria-hidden="true" />Fertilizer</h3>
                    <RichText text={result.fertilizerSuggestion || 'No fertilizer change suggested.'} />
                  </div>
                  <div className="treatment__item">
                    <h3 className="subhead"><ShieldPlus size={16} aria-hidden="true" />Pesticide</h3>
                    <RichText text={result.pesticideSuggestion || 'No pesticide suggested.'} />
                  </div>
                </div>
              )}
              {result.explanation && <><h3 className="subhead">About this condition</h3><RichText text={result.explanation} /></>}

              <Alert tone="info">Always read the product label for dosage and waiting period before harvest, and wear protective gear when spraying.</Alert>

              <div className="form-actions">
                {lang !== 'hi' || !adv.data ? (
                  <Button variant="secondary" icon={Languages} onClick={hindi} loading={adv.isLoading}>हिन्दी में सलाह</Button>
                ) : null}
                <Button variant="ghost" icon={MessagesSquare} to={`/app/assistant?topic=disease&q=${encodeURIComponent(top.diseaseName)}`}>Ask a follow-up</Button>
              </div>
              {adv.data && (
                <Card tone="subtle" lang="hi">
                  <CardHeader title="हिन्दी सलाह" as="h3" />
                  {adv.data.fertilizerRecommendation && <><h4 className="subhead">उर्वरक</h4><RichText text={adv.data.fertilizerRecommendation} /></>}
                  {adv.data.pesticideRecommendation && <><h4 className="subhead">कीटनाशक</h4><RichText text={adv.data.pesticideRecommendation} /></>}
                  {adv.data.explanation && <RichText text={adv.data.explanation} />}
                </Card>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
