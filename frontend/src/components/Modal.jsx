import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconX } from './icons'

const CLOSE_MS = 220

/**
 * Modal nền: overlay mờ + panel nội, đóng bằng Esc / bấm ra ngoài, khoá scroll body.
 * Yêu cầu đóng được ghi nhận trước, panel chạy animation thoát rồi mới gọi `onClose`.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissible = true,
  labelledBy = 'modal-title',
}) {
  const panelRef = useRef(null)
  const restoreRef = useRef(null)
  const closeTimer = useRef(null)
  const closingRef = useRef(false)
  const onCloseRef = useRef(onClose)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  const requestClose = useCallback(() => {
    if (!dismissible || closingRef.current) return
    closingRef.current = true
    setClosing(true)
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => {
      closingRef.current = false
      setClosing(false)
      onCloseRef.current?.()
    }, CLOSE_MS)
  }, [dismissible])

  useEffect(() => {
    if (!open) return undefined

    restoreRef.current = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && dismissible) {
        event.stopPropagation()
        requestClose()
      }
      if (event.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const focusTimer = setTimeout(() => {
      const target = panelRef.current?.querySelector('[data-autofocus]') ?? panelRef.current
      target?.focus?.()
    }, 40)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      clearTimeout(focusTimer)
      document.body.style.overflow = overflow
      if (restoreRef.current instanceof HTMLElement) restoreRef.current.focus()
    }
  }, [open, requestClose, dismissible])

  if (!open) return null

  return createPortal(
    <div className={`modal${closing ? ' is-closing' : ''}`} role="presentation">
      <div
        className="modal__backdrop"
        onClick={requestClose}
        aria-hidden="true"
      />
      <div
        className={`modal__panel modal__panel--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        ref={panelRef}
      >
        {(title || dismissible) && (
          <header className="modal__head">
            <div>
              {title && (
                <h2 className="modal__title" id={labelledBy}>
                  {title}
                </h2>
              )}
              {description && <p className="modal__desc">{description}</p>}
            </div>
            {dismissible && (
              <button
                type="button"
                className="modal__close"
                onClick={requestClose}
                aria-label="Đóng"
              >
                <IconX width={18} height={18} />
              </button>
            )}
          </header>
        )}
        {children && <div className="modal__body">{children}</div>}
        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}
