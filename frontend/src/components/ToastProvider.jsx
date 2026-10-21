import { useCallback, useMemo, useRef, useState } from 'react'
import { IconAlert, IconCheckCircle, IconInfo, IconX } from './icons'
import { ToastContext } from '../context/toastContext'

const ICONS = {
  success: IconCheckCircle,
  error: IconAlert,
  info: IconInfo,
}

let toastSeq = 0

/**
 * Hệ thống thông báo gọn nhẹ: góc trên phải, tự ẩn, có hiệu ứng trượt vào.
 * Dùng qua `const { notify } = useToast()`.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const notify = useCallback(
    (message, { type = 'info', title = '', duration = 4200 } = {}) => {
      toastSeq += 1
      const id = toastSeq
      setToasts((current) => [...current, { id, message, type, title }])
      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration)
        timers.current.set(id, timer)
      }
      return id
    },
    [dismiss],
  )

  const value = useMemo(() => ({ notify, dismiss, toasts }), [notify, dismiss, toasts])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="region" aria-live="polite" aria-label="Thông báo">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type] ?? IconInfo
          return (
            <div key={toast.id} className={`toast toast--${toast.type}`}>
              <span className="toast__icon">
                <Icon width={18} height={18} />
              </span>
              <div className="toast__body">
                {toast.title && <p className="toast__title">{toast.title}</p>}
                <p className="toast__text">{toast.message}</p>
              </div>
              <button
                type="button"
                className="toast__close"
                onClick={() => dismiss(toast.id)}
                aria-label="Đóng thông báo"
              >
                <IconX width={16} height={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
