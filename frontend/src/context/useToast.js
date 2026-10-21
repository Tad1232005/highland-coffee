import { useContext } from 'react'
import { ToastContext } from './toastContext'

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast phải nằm trong <ToastProvider>.')
  return context
}
