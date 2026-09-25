import { forwardRef, useImperativeHandle, useRef } from 'react'

/**
 * One box per digit. Typing moves forward, Backspace moves back, arrow keys and
 * Home/End move between boxes, and pasting or autofilling a whole code fills
 * every box at once. Digits always fill from the left, so focusing an empty box
 * past the first gap jumps back to that gap.
 *
 * <Field> passes id and aria-* props here: the id goes on the first box so the
 * label focuses it, and the aria state goes on every box.
 */
export const OtpInput = forwardRef(function OtpInput(
  {
    length = 6, value = '', onChange, onComplete, disabled, autoFocus, id,
    'aria-invalid': invalid, 'aria-describedby': describedBy, 'aria-required': required,
  },
  ref,
) {
  const boxes = useRef([])
  // Moving focus fires the next box's onFocus before React re-renders, so the
  // handlers read the latest value from here rather than from this render.
  const current = useRef(value)
  current.current = value
  const digits = Array.from({ length }, (_, i) => value[i] || '')

  useImperativeHandle(ref, () => ({
    focus: (i = 0) => boxes.current[Math.max(0, Math.min(i, length - 1))]?.focus(),
  }), [length])

  const focusBox = (i) => boxes.current[Math.max(0, Math.min(i, length - 1))]?.focus()

  const commit = (next, focusAt) => {
    const clean = next.replace(/\D/g, '').slice(0, length)
    current.current = clean
    onChange?.(clean)
    if (focusAt != null) focusBox(focusAt)
    if (clean.length === length) onComplete?.(clean)
  }

  // Put several digits in starting at box i (paste, SMS autofill, fast typing).
  const insertAt = (i, incoming) => {
    const v = current.current
    const whole = incoming.length >= length
    const start = whole ? 0 : Math.min(i, v.length)
    const next = (v.slice(0, start) + incoming).slice(0, length)
    commit(next, next.length)
  }

  const handleChange = (i) => (e) => {
    const typed = e.target.value.replace(/\D/g, '')
    if (!typed) return
    if (typed.length > 1 && typed.length !== 2) return insertAt(i, typed)
    // A single keystroke into a box that already held a digit arrives as two
    // characters; the new digit is the one that isn't the old value.
    const v = current.current
    const digit = typed.length === 2 ? (typed[0] === v[i] ? typed[1] : typed[0]) : typed
    const pos = Math.min(i, v.length)
    commit(v.slice(0, pos) + digit + v.slice(pos + 1), pos + 1)
  }

  const handleKeyDown = (i) => (e) => {
    const v = current.current
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (v[i]) commit(v.slice(0, i) + v.slice(i + 1), i)
      else if (i > 0) commit(v.slice(0, i - 1) + v.slice(i), i - 1)
    } else if (e.key === 'Delete') {
      e.preventDefault()
      if (v[i]) commit(v.slice(0, i) + v.slice(i + 1), i)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault(); focusBox(i - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault(); focusBox(Math.min(i + 1, v.length))
    } else if (e.key === 'Home') {
      e.preventDefault(); focusBox(0)
    } else if (e.key === 'End') {
      e.preventDefault(); focusBox(v.length)
    }
  }

  const handlePaste = (i) => (e) => {
    const pasted = (e.clipboardData?.getData('text') || '').replace(/\D/g, '')
    e.preventDefault()
    if (pasted) insertAt(i, pasted)
  }

  const handleFocus = (i) => (e) => {
    const filled = current.current.length
    if (i > filled) { focusBox(filled); return }
    e.target.select()
  }

  return (
    <div className="otp" style={{ '--otp-length': length }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { boxes.current[i] = el }}
          id={i === 0 ? id : undefined}
          className="ui-input otp__digit"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          autoFocus={autoFocus && i === 0}
          value={d}
          disabled={disabled}
          aria-label={`Verification code, digit ${i + 1} of ${length}`}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          aria-required={required}
          data-filled={d ? 'true' : undefined}
          onChange={handleChange(i)}
          onKeyDown={handleKeyDown(i)}
          onPaste={handlePaste(i)}
          onFocus={handleFocus(i)}
        />
      ))}
    </div>
  )
})
