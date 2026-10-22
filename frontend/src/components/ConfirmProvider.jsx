import { useCallback, useMemo, useRef, useState } from 'react'
import { Modal } from './Modal'
import { ConfirmContext } from '../context/confirmContext'

const DEFAULTS = {
  title: 'Xác nhận',
  message: '',
  confirmText: 'Đồng ý',
  cancelText: 'Huỷ',
  danger: false,
}

/**
 * Hộp thoại xác nhận đẹp hơn `window.confirm`.
 * Dùng qua: `const confirm = useConfirm()` → `if (await confirm({ ... })) { ... }`
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, options: DEFAULTS })
  const resolver = useRef(null)

  const settle = useCallback((result) => {
    setState((current) => ({ ...current, open: false }))
    resolver.current?.(result)
    resolver.current = null
  }, [])

  const confirm = useCallback((options = {}) => {
    setState({ open: true, options: { ...DEFAULTS, ...options } })
    return new Promise((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const value = useMemo(() => ({ confirm }), [confirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal
        open={state.open}
        onClose={() => settle(false)}
        title={state.options.title}
        description={state.options.message}
        size="sm"
        labelledBy="confirm-title"
        footer={
          <>
            <button
              type="button"
              className="btn btn--outline"
              onClick={() => settle(false)}
            >
              {state.options.cancelText}
            </button>
            <button
              type="button"
              className={`btn ${state.options.danger ? 'btn--danger-solid' : 'btn--primary'}`}
              onClick={() => settle(true)}
              data-autofocus
            >
              {state.options.confirmText}
            </button>
          </>
        }
      />
    </ConfirmContext.Provider>
  )
}
