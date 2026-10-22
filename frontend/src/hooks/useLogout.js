import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useConfirm } from '../context/useConfirm'
import { useToast } from '../context/useToast'

/**
 * Đăng xuất có xác nhận + thông báo, dùng chung cho header, menu tài khoản
 * và thanh quản trị.
 */
export function useLogout() {
  const { logout } = useAuth()
  const confirm = useConfirm()
  const { notify } = useToast()
  const navigate = useNavigate()

  return useCallback(async () => {
    const confirmed = await confirm({
      title: 'Đăng xuất khỏi Highlands?',
      message: 'Giỏ hàng và lịch sử đơn của bạn vẫn được giữ nguyên trên thiết bị này.',
      confirmText: 'Đăng xuất',
      cancelText: 'Ở lại',
    })
    if (!confirmed) return
    logout()
    notify('Bạn đã đăng xuất. Hẹn gặp lại!', { type: 'success' })
    navigate('/', { replace: true })
  }, [confirm, logout, navigate, notify])
}
