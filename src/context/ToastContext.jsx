import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

let uid = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) { clearTimeout(timer); timers.current.delete(id) }
  }, [])

  const addToast = useCallback((msg, type = 'info', duration = 3800) => {
    const id = ++uid
    setToasts(prev => [...prev, { id, msg, type }])
    const timer = setTimeout(() => dismiss(id), duration)
    timers.current.set(id, timer)
    return id
  }, [dismiss])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-stack" role="region" aria-live="polite" aria-label="Notifications">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`} role="status">
            <span className="toast-dot" aria-hidden="true" />
            <span className="toast-msg">{t.msg}</span>
            <button
              className="toast-close"
              aria-label="Dismiss notification"
              onClick={() => dismiss(t.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/** Returns an `addToast(message, type?, duration?)` function. */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
