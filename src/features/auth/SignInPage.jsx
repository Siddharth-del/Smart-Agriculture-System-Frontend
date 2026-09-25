import { useDispatch } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSignInMutation } from './authApi'
import { signedIn, extractJwt, normaliseRoles, homePathFor } from './authSlice'
import AuthLayout from './AuthLayout'
import { Alert, Button, Field, Input, PasswordInput } from '../../shared/ui'
import { useDocumentTitle, useForm } from '../../shared/hooks'
import { rules } from '../../shared/utils/validation'
import { useToast } from '../../shared/toast/ToastProvider'

export default function SignInPage() {
  useDocumentTitle('Sign in')
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [signIn, { isLoading, error, reset: clearError }] = useSignInMutation()

  const form = useForm({ username: '', password: '' }, {
    username: [rules.required('Username')],
    password: [rules.required('Password')],
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const data = await signIn({ username: values.username.trim(), password: values.password }).unwrap()
      const token = extractJwt(data.jwtToken) || extractJwt(data.token)
      if (!token) throw { message: 'Signed in, but the server did not return a session token.' }
      dispatch(signedIn({ id: data.id, username: data.username, roles: data.roles, token }))
      toast.success(`Welcome back, ${data.username}`)
      const roles = normaliseRoles(data.roles)
      const from = location.state?.from
      navigate(from && from.startsWith('/app') ? from : homePathFor(roles), { replace: true })
    } catch { /* rendered from `error` below */ }
  })

  // The backend answers bad credentials with 404 + "Bad credentials".
  const message = error && (error.status === 404 || error.status === 401 ? 'That username and password don’t match. Check them and try again.' : error.message)

  return (
    <AuthLayout
      title="Sign in"
      description="Pick up where you left off on your farm."
      footer={<>New to AgriPro? <Link to="/signup">Create an account</Link></>}
    >
      <form onSubmit={onSubmit} noValidate className="ui-stack">
        {message && <Alert tone="danger">{message}</Alert>}
        <Field label="Username" error={form.field('username').error} required>
          <Input {...form.field('username')} onChange={(e) => { clearError(); form.field('username').onChange(e) }} autoComplete="username" autoCapitalize="none" spellCheck={false} />
        </Field>
        <Field label="Password" error={form.field('password').error} required>
          <PasswordInput {...form.field('password')} onChange={(e) => { clearError(); form.field('password').onChange(e) }} autoComplete="current-password" />
        </Field>
        <Link to="/forgot-password" className="auth__forgot">Forgot password?</Link>
        <Button type="submit" full size="lg" loading={isLoading}>Sign in</Button>
      </form>
    </AuthLayout>
  )
}
