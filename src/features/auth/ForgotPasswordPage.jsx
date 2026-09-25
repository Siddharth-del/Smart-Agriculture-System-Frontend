import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useRequestPasswordResetMutation } from './authApi'
import AuthLayout from './AuthLayout'
import ResetSteps from './ResetSteps'
import { readResetFlow, startResetFlow, sendCodeErrorMessage, CODE_LENGTH } from './resetFlow'
import { Alert, Button, Field, Input } from '../../shared/ui'
import { useDocumentTitle, useForm } from '../../shared/hooks'
import { rules } from '../../shared/utils/validation'
import { useToast } from '../../shared/toast/ToastProvider'

export default function ForgotPasswordPage() {
  useDocumentTitle('Forgot password')
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [requestCode, { isLoading, error, reset: clearError }] = useRequestPasswordResetMutation()

  // Coming back via "Use a different email" keeps what was typed before.
  const [initialEmail] = useState(() => location.state?.email || readResetFlow()?.email || '')
  const form = useForm({ email: initialEmail }, {
    email: [rules.required('Email'), rules.email(), rules.maxLength('Email', 50)],
  })

  const onSubmit = form.handleSubmit(async ({ email }) => {
    const address = email.trim()
    try {
      await requestCode(address).unwrap()
      startResetFlow(address)
      toast.success(`Code sent to ${address}.`)
      navigate('/verify-code')
    } catch (err) {
      if (err?.code === 'NOT_FOUND') form.setServerErrors({ email: 'No AgriPro account uses this email. Check it for typos.' })
    }
  })

  const general = error && error.code !== 'NOT_FOUND' ? sendCodeErrorMessage(error) : null
  const emailField = form.field('email')

  return (
    <AuthLayout
      title="Reset your password"
      description={`Enter the email on your account and we’ll send you a ${CODE_LENGTH}-digit code.`}
      footer={<>Remembered it? <Link to="/signin">Back to sign in</Link></>}
    >
      <ResetSteps current={0} />
      <form onSubmit={onSubmit} noValidate className="ui-stack">
        {general && <Alert tone="danger">{general}</Alert>}
        <Field label="Email" hint="Use the email you signed up with." error={emailField.error} required>
          <Input
            {...emailField}
            onChange={(e) => { clearError(); emailField.onChange(e) }}
            type="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
          />
        </Field>
        <Button type="submit" full size="lg" loading={isLoading}>Send code</Button>
      </form>
    </AuthLayout>
  )
}
