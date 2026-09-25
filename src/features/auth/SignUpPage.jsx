import { Link, useNavigate } from 'react-router-dom'
import { useSignUpMutation } from './authApi'
import AuthLayout from './AuthLayout'
import { Alert, Button, Field, Input, PasswordInput } from '../../shared/ui'
import { useDocumentTitle, useForm } from '../../shared/hooks'
import { rules } from '../../shared/utils/validation'
import { useToast } from '../../shared/toast/ToastProvider'

// Public sign-up always creates FARMER accounts. The backend currently accepts a
// `role` array from anyone; admin and agronomist accounts should be provisioned
// by an administrator instead (see README "Backend hardening").
export default function SignUpPage() {
  useDocumentTitle('Create account')
  const navigate = useNavigate()
  const toast = useToast()
  const [signUp, { isLoading, error }] = useSignUpMutation()

  const form = useForm({ username: '', email: '', password: '', confirm: '' }, {
    username: [rules.required('Username'), rules.minLength('Username', 3), rules.maxLength('Username', 20),
      rules.pattern(/^[a-zA-Z0-9_.]+$/, 'Use letters, numbers, dots or underscores only.')],
    email: [rules.required('Email'), rules.email(), rules.maxLength('Email', 50)],
    password: [rules.required('Password'), rules.minLength('Password', 8), rules.maxLength('Password', 40),
      rules.pattern(/(?=.*[A-Za-z])(?=.*\d)/, 'Include at least one letter and one number.')],
    confirm: [rules.required('Password confirmation'), rules.matches('password', 'Passwords don’t match.')],
  })

  const onSubmit = form.handleSubmit(async ({ username, email, password }) => {
    try {
      await signUp({ username: username.trim(), email: email.trim(), password, role: ['farmer'] }).unwrap()
      toast.success('Account created. Sign in to set up your farm.')
      navigate('/signin', { replace: true })
    } catch (err) {
      if (/username/i.test(err?.message)) form.setServerErrors({ username: 'That username is taken.' })
      else if (/email/i.test(err?.message)) form.setServerErrors({ email: 'An account already uses this email.' })
    }
  })

  const general = error && !/username|email/i.test(error.message) ? error.message : null

  return (
    <AuthLayout
      title="Create your account"
      description="Free for farmers. Takes about a minute."
      footer={<>Already registered? <Link to="/signin">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} noValidate className="ui-stack">
        {general && <Alert tone="danger">{general}</Alert>}
        <Field label="Username" hint="3–20 characters. You’ll use this to sign in." error={form.field('username').error} required>
          <Input {...form.field('username')} autoComplete="username" autoCapitalize="none" spellCheck={false} />
        </Field>
        <Field label="Email" hint="Irrigation alerts are sent here." error={form.field('email').error} required>
          <Input {...form.field('email')} type="email" autoComplete="email" inputMode="email" />
        </Field>
        <Field label="Password" hint="At least 8 characters with a letter and a number." error={form.field('password').error} required>
          <PasswordInput {...form.field('password')} autoComplete="new-password" />
        </Field>
        <Field label="Confirm password" error={form.field('confirm').error} required>
          <PasswordInput {...form.field('confirm')} autoComplete="new-password" />
        </Field>
        <Button type="submit" full size="lg" loading={isLoading}>Create account</Button>
      </form>
    </AuthLayout>
  )
}
