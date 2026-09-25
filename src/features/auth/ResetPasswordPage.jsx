import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useResetPasswordMutation } from './authApi'
import AuthLayout from './AuthLayout'
import ResetSteps from './ResetSteps'
import { readResetFlow, clearResetFlow, isVerificationFresh, passwordRules } from './resetFlow'
import { Alert, Button, Field, PasswordInput } from '../../shared/ui'
import { useDocumentTitle, useForm } from '../../shared/hooks'
import { rules } from '../../shared/utils/validation'
import { useToast } from '../../shared/toast/ToastProvider'

export default function ResetPasswordPage() {
  useDocumentTitle('New password')
  const [flow] = useState(readResetFlow)
  if (!flow) return <Navigate to="/forgot-password" replace />
  if (!isVerificationFresh(flow)) {
    const notice = flow.verifiedAt
      ? 'Your verification expired. Send a new code to continue.'
      : 'Enter the code from your email first.'
    return <Navigate to="/verify-code" replace state={{ notice }} />
  }
  return <ResetPasswordForm email={flow.email} />
}

const MISMATCH = /match/i

function ResetPasswordForm({ email }) {
  const navigate = useNavigate()
  const toast = useToast()
  const [resetPassword, { isLoading, error, reset: clearError }] = useResetPasswordMutation()

  const form = useForm({ password: '', confirm: '' }, {
    password: passwordRules,
    confirm: [rules.required('Password confirmation'), rules.matches('password', 'Passwords don’t match.')],
  })

  const onSubmit = form.handleSubmit(async ({ password, confirm }) => {
    try {
      await resetPassword({ email, password, confirmPassword: confirm }).unwrap()
      clearResetFlow()
      toast.success('Password updated. Sign in with your username and new password.')
      navigate('/signin', { replace: true })
    } catch (err) {
      if (MISMATCH.test(err?.message || '')) form.setServerErrors({ confirm: 'Passwords don’t match.' })
    }
  })

  const general = !error || MISMATCH.test(error.message || '') ? null
    : error.code === 'NOT_FOUND' ? 'We couldn’t find this account any more. Start the reset again.'
      : error.message
  const withClear = (f) => ({ ...f, onChange: (e) => { clearError(); f.onChange(e) } })

  return (
    <AuthLayout
      title="Choose a new password"
      description={<>This will be the new password for <strong>{email}</strong>.</>}
      footer={<>Changed your mind? <Link to="/signin">Back to sign in</Link></>}
    >
      <ResetSteps current={2} />
      <form onSubmit={onSubmit} noValidate className="ui-stack">
        {general && (
          <Alert tone="danger" action={error?.code === 'NOT_FOUND' ? <Button to="/forgot-password" variant="secondary" size="sm">Start again</Button> : null}>
            {general}
          </Alert>
        )}
        <Field label="New password" hint="At least 8 characters with a letter and a number." error={form.field('password').error} required>
          <PasswordInput {...withClear(form.field('password'))} autoComplete="new-password" autoFocus />
        </Field>
        <Field label="Confirm new password" error={form.field('confirm').error} required>
          <PasswordInput {...withClear(form.field('confirm'))} autoComplete="new-password" />
        </Field>
        <Button type="submit" full size="lg" loading={isLoading}>Update password</Button>
      </form>
    </AuthLayout>
  )
}
