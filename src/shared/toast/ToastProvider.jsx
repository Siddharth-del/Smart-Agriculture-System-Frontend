import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)
const ICONS = { success: CheckCircle2, warning: AlertTriangle, danger: XCircle, info: Info }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const seq = useRef(0)

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const push = useCallback((tone, message, { duration = tone === 'danger' ? 7000 : 4000 } = {}) => {
    const id = ++seq.current
    setToasts((t) => [...t.filter((x) => x.message !== message), { id, tone, message }].slice(-4))
    if (duration) setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  const api = useMemo(() => ({
    success: (m, o) => push('success', m, o),
    error: (m, o) => push('danger', m, o),
    warning: (m, o) => push('warning', m, o),
    info: (m, o) => push('info', m, o),
    dismiss,
  }), [push, dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="ui-toasts" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => {
          const Icon = ICONS[t.tone]
          return (
            <div key={t.id} className={`ui-toast ui-tone--${t.tone}`} role={t.tone === 'danger' ? 'alert' : 'status'}>
              <Icon size={18} aria-hidden="true" />
              <p>{t.message}</p>
              <button type="button" className="ui-iconbtn ui-iconbtn--sm" onClick={() => dismiss(t.id)} aria-label="Dismiss notification"><X size={15} /></button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
