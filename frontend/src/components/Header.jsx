import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useCart } from '../context/useCart'
import { useLogout } from '../hooks/useLogout'
import { AccountMenu } from './AccountMenu'
import { IconCart, IconLogout } from './icons'

export function Header() {
  const { user, isAdmin } = useAuth()
  const { totalQuantity } = useCart()
  const onLogout = useLogout()

  const navLinkClass = ({ isActive }) => `site-nav__link${isActive ? ' is-active' : ''}`

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="brand">
          <span className="brand__mark">Highlands</span>
          <span>Coffee</span>
          <span className="brand__since">Từ 2013</span>
        </Link>

        <nav className="site-nav" aria-label="Điều hướng chính">
          <NavLink to="/menu" className={navLinkClass}>
            Thực đơn
          </NavLink>
          <NavLink to="/my-orders" className={navLinkClass}>
            Đơn của tôi
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass}>
              Quản trị
            </NavLink>
          )}
        </nav>

        <div className="site-header__actions">
          <Link to="/cart" className="header-action" aria-label="Giỏ hàng">
            <IconCart />
            <span className="header-action__label">Giỏ</span>
            {totalQuantity > 0 && <span className="cart-badge">{totalQuantity}</span>}
          </Link>

          <AccountMenu />

          {user && (
            <button
              type="button"
              className="header-action header-action--exit"
              onClick={onLogout}
            >
              <IconLogout width={18} height={18} />
              <span>Đăng xuất</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
