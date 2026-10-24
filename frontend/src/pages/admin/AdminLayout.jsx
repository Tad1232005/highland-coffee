import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { IconChart, IconChevronDown, IconCup, IconHome, IconReceipt } from '../../components/icons'
import { useAuth } from '../../context/useAuth'
import { useLogout } from '../../hooks/useLogout'

export function AdminLayout() {
  const { user } = useAuth()
  const onLogout = useLogout()
  const location = useLocation()
  const inMenu = location.pathname === '/admin/products' || location.pathname === '/admin/categories'
  const [menuOpen, setMenuOpen] = useState(inMenu)
  const analyticsActive = location.pathname === '/admin/analytics'
  const [analyticsOpen, setAnalyticsOpen] = useState(analyticsActive)

  const navClass = ({ isActive }) => `admin__nav-link${isActive ? ' is-active' : ''}`
  const dashboardNavClass = ({ isActive }) =>
    `admin__nav-link${isActive && !analyticsActive ? ' is-active' : ''}`

  return (
    <div className="admin">
      <header className="admin__topbar">
        <div className="container admin__topbar-inner">
          <Link to="/admin/dashboard" className="admin__brand" aria-label="Tổng quan quản trị">
            Highlands Coffee
            <span>Khu vực quản trị</span>
          </Link>
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
          <p className="admin__nav-caption">QUẢN LÝ CỬA HÀNG</p>
          <NavLink to="/admin/dashboard" className={dashboardNavClass}>
            <IconHome className="admin__nav-icon" />
            <span>Tổng quan</span>
          </NavLink>
          <NavLink to="/admin/orders" className={navClass}>
            <IconReceipt className="admin__nav-icon" />
            <span>Đơn hàng</span>
          </NavLink>
          <div className={`admin__nav-group${inMenu ? ' is-active' : ''}`}>
            <button
              type="button"
              className={`admin__nav-link admin__nav-trigger${inMenu ? ' is-active' : ''}`}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <IconCup className="admin__nav-icon" />
              <span>Quản lý thực đơn</span>
              <IconChevronDown className={`admin__nav-chevron${menuOpen ? ' is-open' : ''}`} width={16} height={16} />
            </button>
            {menuOpen && (
              <div className="admin__nav-submenu">
                <NavLink to="/admin/products" className={navClass}>
                  <span>Sản phẩm</span>
                </NavLink>
                <NavLink to="/admin/categories" className={navClass}>
                  <span>Danh mục</span>
                </NavLink>
              </div>
            )}
          </div>
          <div className={`admin__nav-group${analyticsActive ? ' is-active' : ''}`}>
            <button
              type="button"
              className={`admin__nav-link admin__nav-trigger${analyticsActive ? ' is-active' : ''}`}
              aria-expanded={analyticsOpen}
              onClick={() => setAnalyticsOpen((open) => !open)}
            >
              <IconChart className="admin__nav-icon" />
              <span>Phân tích</span>
              <IconChevronDown className={`admin__nav-chevron${analyticsOpen ? ' is-open' : ''}`} width={16} height={16} />
            </button>
            {analyticsOpen && (
              <div className="admin__nav-submenu">
                <NavLink
                  to="/admin/analytics"
                  className={`admin__nav-link${analyticsActive ? ' is-active' : ''}`}
                >
                  <span>Doanh thu</span>
                </NavLink>
              </div>
            )}
          </div>
        </nav>
        <div className="admin__content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
