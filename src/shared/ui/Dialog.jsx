import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

/**
 * Native <dialog> gives focus trapping, Esc handling and inert background for free.
 * Focus returns to the element that opened it.
 */
export function Dialog({ open, onClose, title, description, children, footer, size = 'md', dismissible = true }) {
  const ref = useRef(null)
  const opener = useRef(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      opener.current = document.activeElement
      d.showModal()
    } else if (!open && d.open) {
      d.close()
      opener.current?.focus?.()
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`ui-dialog ui-dialog--${size}`}
      aria-labelledby="ui-dialog-title"
      onCancel={(e) => { e.preventDefault(); if (dismissible) onClose() }}
      onClick={(e) => { if (dismissible && e.target === ref.current) onClose() }}
    >
      {open && (
        <div className="ui-dialog__panel">
          <header className="ui-dialog__header">
            <div>
              <h2 id="ui-dialog-title" className="ui-dialog__title">{title}</h2>
              {description && <p className="ui-dialog__desc">{description}</p>}
            </div>
            {dismissible && (
              <button type="button" className="ui-iconbtn" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
            )}
          </header>
          <div className="ui-dialog__body">{children}</div>
          {footer && <footer className="ui-dialog__footer">{footer}</footer>}
        </div>
      )}
    </dialog>
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title, children, confirmLabel = 'Confirm', tone = 'danger', loading }) {
  return (
    <Dialog
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      size="sm"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      )}
    >
      <div className="ui-prose">{children}</div>
    </Dialog>
  )
}
