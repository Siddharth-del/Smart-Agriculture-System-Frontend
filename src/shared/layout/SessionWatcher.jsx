import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { expiryAcknowledged } from '../../features/auth/authSlice'
import { useToast } from '../toast/ToastProvider'

/** When the base query reports an expired session, explain it once and send the user to sign in. */
export default function SessionWatcher() {
  const expired = useSelector((s) => s.auth.expired)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  useEffect(() => {
    if (!expired) return
    toast.warning('Your session ended. Sign in again to continue.')
    dispatch(expiryAcknowledged())
    navigate('/signin', { replace: true, state: { from: location.pathname } })
  }, [expired, dispatch, navigate, location.pathname, toast])

  return null
}
