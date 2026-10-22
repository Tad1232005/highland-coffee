import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useLogout } from '../hooks/useLogout'
import { IconLogout, IconReceipt, IconSpark } from './icons'

/**
 * Nội dung menu tài khoản, dùng chung cho menu header (desktop) và
 * bottom sheet trên mobile.
 */
export function AccountLinks({ onNavigate }) {
  const { user, isAdmin } = useAuth()
  const onLogout = useLogout()

  return (
    <>
      {user && (
        <div className="account__head">
          <p className="account__head-name">{user.full_name}</p>
          <p className="account__head-mail">{user.email}</p>
        </div>
      )}

      <Link to="/my-orders" className="account__item" onClick={onNavigate}>
        <IconReceipt width={18} height={18} />
        <span>Đơn của tôi</span>
      </Link>

      {isAdmin && (
        <Link to="/admin" className="account__item" onClick={onNavigate}>
          <IconSpark width={18} height={18} />
          <span>Khu vực quản trị</span>
        </Link>
      )}

      <button
        type="button"
        className="account__item account__item--danger"
        onClick={() => {
          onNavigate?.()
          onLogout()
        }}
      >
        <IconLogout width={18} height={18} />
        <span>Đăng xuất</span>
      </button>
    </>
  )
}
