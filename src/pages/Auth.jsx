import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { getT } from '../features/i18n'
import { setCredentials } from '../app/store'
import { apiFetch, ApiError } from '../lib/api'
import { useToast } from '../context/ToastContext'
import { useForm, validators } from '../hooks/useForm'
import FormField from '../components/ui/FormField'
import Button from '../components/ui/Button'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const { required, email: emailRule, minLength } = validators

/** Single Auth page that renders either the sign-in or sign-up form. */
export default function AuthPage({ mode }) {
  useDocumentTitle(mode === 'signup' ? 'Sign up' : 'Sign in')
  return mode === 'signup' ? <Signup /> : <Login />
}

function AuthShell({ title, subtitle, children, switchLabel, switchTo, switchCta }) {
  const { lang } = useSelector(s => s.settings)
  const t = getT(lang)
  return (
    <div className="auth-wrap">
      <div className="auth-box fade-up">
        <div className="auth-logo">
          <div className="auth-wordmark">
            <div className="auth-wordmark-bar" />
            <h1>{t.appName}</h1>
          </div>
          <p>{subtitle}</p>
        </div>
        {children}
        <p className="auth-switch">
          {switchLabel} <Link to={switchTo}>{switchCta}</Link>
        </p>
        <Link to="/" className="auth-back">← Back to home</Link>
      </div>
    </div>
  )
}

function PasswordField({ label, error, value, onChange, onBlur, placeholder, autoComplete }) {
  const [visible, setVisible] = useState(false)
  return (
    <FormField
      label={label}
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
      placeholder={placeholder}
      autoComplete={autoComplete}
      endAdornment={
        <button
          type="button"
          className="input-adornment-btn"
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      }
    />
  )
}

function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const addToast = useToast()
  const { lang } = useSelector(s => s.settings)
  const t = getT(lang)

  const { values, errors, touched, setValue, setFieldTouched, validateAll } = useForm(
    { username: '', password: '' },
    { username: [required('Username')], password: [required('Password')] }
  )
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!validateAll()) return
    setBusy(true)
    try {
      const data = await apiFetch('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify(values),
      })
      let jwt = data.jwtToken || data.token || ''
      if (jwt.includes('=')) jwt = jwt.split('=')[1]?.split(';')[0] || jwt

      dispatch(setCredentials({
        user: { id: data.id, username: data.username, email: data.email, roles: data.roles },
        token: jwt,
      }))
      addToast(`Welcome back, ${data.username}`, 'success')
      navigate('/app/dashboard')
    } catch (err) {
      const msg = err instanceof ApiError && err.status === 401 ? t.badCreds : err.message
      addToast(msg, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell subtitle={t.appSub} switchLabel={t.noAccount} switchTo="/signup" switchCta={t.register}>
      <form className="auth-form" onSubmit={submit} noValidate>
        <FormField
          label={t.username}
          value={values.username}
          onChange={e => setValue('username', e.target.value)}
          onBlur={() => setFieldTouched('username')}
          error={touched.username ? errors.username : ''}
          placeholder="your_username"
          autoComplete="username"
        />
        <PasswordField
          label={t.password}
          value={values.password}
          onChange={e => setValue('password', e.target.value)}
          onBlur={() => setFieldTouched('password')}
          error={touched.password ? errors.password : ''}
          placeholder="••••••••"
          autoComplete="current-password"
        />
        <Button type="submit" full loading={busy} style={{ marginTop: 6, padding: '12px' }}>
          {busy ? t.signingIn : t.signin}
        </Button>
      </form>
    </AuthShell>
  )
}

function Signup() {
  const navigate = useNavigate()
  const addToast = useToast()
  const { lang } = useSelector(s => s.settings)
  const t = getT(lang)

  const { values, errors, touched, setValue, setFieldTouched, validateAll } = useForm(
    { username: '', email: '', password: '' },
    {
      username: [required('Username'), minLength(3, 'Username')],
      email: [required('Email'), emailRule()],
      password: [required('Password'), minLength(6, 'Password')],
    }
  )
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!validateAll()) return
    setBusy(true)
    try {
      await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ ...values, role: ['ROLE_FARMER'] }),
      })
      addToast(t.regOk, 'success')
      navigate('/signin')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell subtitle={t.signup} switchLabel={t.haveAccount} switchTo="/signin" switchCta={t.signin}>
      <form className="auth-form" onSubmit={submit} noValidate>
        <FormField
          label={t.username}
          value={values.username}
          onChange={e => setValue('username', e.target.value)}
          onBlur={() => setFieldTouched('username')}
          error={touched.username ? errors.username : ''}
          placeholder="farmer_name"
          autoComplete="username"
        />
        <FormField
          label={t.email}
          type="email"
          value={values.email}
          onChange={e => setValue('email', e.target.value)}
          onBlur={() => setFieldTouched('email')}
          error={touched.email ? errors.email : ''}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <PasswordField
          label={t.password}
          value={values.password}
          onChange={e => setValue('password', e.target.value)}
          onBlur={() => setFieldTouched('password')}
          error={touched.password ? errors.password : ''}
          placeholder="Min. 6 characters"
          autoComplete="new-password"
        />
        <Button type="submit" full loading={busy} style={{ marginTop: 6, padding: '12px' }}>
          {busy ? t.creating : t.signup}
        </Button>
      </form>
    </AuthShell>
  )
}
