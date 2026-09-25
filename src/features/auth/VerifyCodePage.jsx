import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useRequestPasswordResetMutation, useVerifyResetCodeMutation } from './authApi'
import AuthLayout from './AuthLayout'
import ResetSteps from './ResetSteps'
import { OtpInput } from './OtpInput'
import {
  readResetFlow, updateResetFlow, sendCodeErrorMessage, formatCountdown, CODE_LENGTH, RESEND_COOLDOWN_S,
} from './resetFlow'
import { Alert, Button, Field } from '../../shared/ui'
import { useDocumentTitle } from '../../shared/hooks'
import { useToast } from '../../shared/toast/ToastProvider'

export default function VerifyCodePage() {
  useDocumentTitle('Enter code')
  const [flow] = useState(readResetFlow)
  if (!flow) return <Navigate to="/forgot-password" replace />
  return <VerifyCodeForm email={flow.email} initialSentAt={flow.sentAt || 0} />
}

function VerifyCodeForm({ email, initialSentAt }) {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const otpRef = useRef(null)
  const [verify, { isLoading: verifying }] = useVerifyResetCodeMutation()
  const [sendCode, { isLoading: sending }] = useRequestPasswordResetMutation()

  const [code, setCode] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [failure, setFailure] = useState('')
  const [notice, setNotice] = useState(location.state?.notice || '')

  // Resend cooldown, measured from when the last code was sent (survives refresh).
  const [sentAt, setSentAt] = useState(initialSentAt)
  const [now, setNow] = useState(() => Date.now())
  const wait = Math.max(0, RESEND_COOLDOWN_S - Math.floor((now - sentAt) / 1000))
  const cooling = wait > 0
  useEffect(() => {
    if (!cooling) return undefined
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [cooling])

  const submit = async (value) => {
    if (verifying) return
    if (value.length !== CODE_LENGTH) {
      setFieldError(`Enter all ${CODE_LENGTH} digits of the code.`)
      otpRef.current?.focus(value.length)
      return
    }
    setFieldError(''); setFailure(''); setNotice('')
    try {
      await verify({ email, otp: value }).unwrap()
      updateResetFlow({ verifiedAt: Date.now() })
      // Replace, so Back from the next step returns to the email page rather than a spent code.
      navigate('/reset-password', { replace: true })
    } catch (err) {
      if (err?.code === 'VALIDATION') setFieldError('That code doesn’t match. Check the latest email from AgriPro, or send a new code.')
      else setFailure(err?.message || 'We couldn’t check the code. Try again.')
      setCode('')
      otpRef.current?.focus(0)
    }
  }

  const resend = async () => {
    setFailure('')
    try {
      await sendCode(email).unwrap()
      const t = Date.now()
      updateResetFlow({ sentAt: t, verifiedAt: null })
      setSentAt(t); setNow(t)
      setCode(''); setFieldError(''); setNotice('')
      toast.success('New code sent. Earlier codes no longer work.')
      otpRef.current?.focus(0)
    } catch (err) {
      setFailure(sendCodeErrorMessage(err))
    }
  }

  return (
    <AuthLayout
      title="Check your email"
      description={<>Enter the {CODE_LENGTH}-digit code we sent to <strong>{email}</strong>.</>}
      footer={<>Wrong email? <Link to="/forgot-password" state={{ email }}>Use a different one</Link></>}
    >
      <ResetSteps current={1} />
      <form onSubmit={(e) => { e.preventDefault(); submit(code) }} noValidate className="ui-stack">
        {notice && <Alert tone="info">{notice}</Alert>}
        {failure && <Alert tone="danger">{failure}</Alert>}
        <Field label="Verification code" error={fieldError} required>
          <OtpInput
            ref={otpRef}
            length={CODE_LENGTH}
            value={code}
            onChange={(v) => { setCode(v); if (fieldError) setFieldError('') }}
            onComplete={submit}
            autoFocus
          />
        </Field>
        <Button type="submit" full size="lg" loading={verifying}>Verify code</Button>
        <p className="reset-help">
          Didn’t get it? Check your spam folder, or{' '}
          {cooling
            ? <>send a new code in <span className="ui-num">{formatCountdown(wait)}</span>.</>
            : <><button type="button" className="auth__textbtn" onClick={resend} disabled={sending}>{sending ? 'sending…' : 'send a new code'}</button>.</>}
        </p>
      </form>
    </AuthLayout>
  )
}
