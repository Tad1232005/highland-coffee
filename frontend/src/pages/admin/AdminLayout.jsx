import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { useLogout } from '../../hooks/useLogout'

export function AdminLayout() {
  const { user } = useAuth()
  const onLogout = useLogout()

  const navClass = ({ isActive }) => `admin__nav-link${isActive ? ' is-active' : ''}`

  return (
    <div className="admin">
      <header className="admin__topbar">
        <div className="container admin__topbar-inner">
          <p className="admin__brand">
            Highlands Coffee
            <span>Khu vực quản trị</span>
          </p>
          <div className="admin__topbar-actions">
            <span className="admin__user">{user?.full_name}</span>
            <Link to="/" className="btn btn--on-dark btn--sm">
              Về cửa hàng
            </Link>
            <button type="button" className="btn btn--on-dark btn--sm" onClick={onLogout}>
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="container admin__body">
        <nav className="admin__nav" aria-label="Khu vực quản trị">
          <NavLink to="/admin/orders" className={navClass}>
            Đơn hàng
          </NavLink>
          <NavLink to="/admin/products" className={navClass}>
            Sản phẩm
          </NavLink>
          <NavLink to="/admin/categories" className={navClass}>
            Danh mục
          </NavLink>
        </nav>
        <div className="admin__content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
