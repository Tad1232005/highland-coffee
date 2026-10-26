import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  IconChart,
  IconCup,
  IconGrid,
  IconHome,
  IconLogout,
  IconMenu,
  IconPanelLeft,
  IconReceipt,
  IconStore,
  IconX,
} from '../../components/icons'
import { useAuth } from '../../context/useAuth'
import { useLogout } from '../../hooks/useLogout'

const NAV_SECTIONS = [
  {
    label: 'Bán hàng',
    items: [
      { to: '/admin/dashboard', label: 'Tổng quan', Icon: IconHome },
      { to: '/admin/orders', label: 'Đơn hàng', Icon: IconReceipt },
    ],
  },
  {
    label: 'Thực đơn',
    items: [
      { to: '/admin/products', label: 'Sản phẩm', Icon: IconCup },
      { to: '/admin/categories', label: 'Danh mục', Icon: IconGrid },
    ],
  },
  {
    label: 'Báo cáo',
    items: [{ to: '/admin/analytics', label: 'Doanh thu', Icon: IconChart }],
  },
]

const RAIL_STORAGE_KEY = 'hc.admin-rail'
const DESKTOP_QUERY = '(min-width: 900px)'

const readRailCollapsed = () => {
  try {
    return window.localStorage.getItem(RAIL_STORAGE_KEY) === 'collapsed'
  } catch {
    return false
  }
}

export function AdminLayout() {
  const { user } = useAuth()
  const onLogout = useLogout()
  const [menuOpen, setMenuOpen] = useState(false)
  const [railCollapsed, setRailCollapsed] = useState(readRailCollapsed)
  const toggleRef = useRef(null)
  const drawerCloseRef = useRef(null)
  const hasOpenedRef = useRef(false)

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const toggleRail = () => {
    setRailCollapsed((current) => {
      const next = !current
      try {
        window.localStorage.setItem(RAIL_STORAGE_KEY, next ? 'collapsed' : 'expanded')
      } catch {
        // Trình duyệt chặn localStorage: chỉ mất khả năng ghi nhớ lựa chọn.
      }
      return next
    })
  }

  // Drawer điện thoại: đóng bằng Escape và khoá cuộn nền khi đang mở.
  useEffect(() => {
    if (!menuOpen) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    const { body } = document
    const previousOverflow = body.style.overflow
    body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      body.style.overflow = previousOverflow
    }
  }, [menuOpen])

  // Bàn phím: vào drawer thì tiêu điểm nằm trong drawer, đóng thì quay lại nút Menu.
  useEffect(() => {
    if (menuOpen) {
      hasOpenedRef.current = true
      // Chờ khung hình kế tiếp: lúc này CSS đã bỏ `visibility: hidden` nên focus mới có hiệu lực.
      const frame = requestAnimationFrame(() => drawerCloseRef.current?.focus())
      return () => cancelAnimationFrame(frame)
    }
    if (hasOpenedRef.current) toggleRef.current?.focus()
    return undefined
  }, [menuOpen])

  // Thu hẹp về bố cục máy tính thì drawer không còn ý nghĩa.
  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY)
    const onChange = (event) => {
      if (event.matches) setMenuOpen(false)
    }

    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const handleLogout = () => {
    closeMenu()
    onLogout()
  }

  const displayName = user?.full_name ?? 'Quản trị viên'
  const initial = displayName.trim().charAt(0).toUpperCase()
  const railToggleLabel = railCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'

  const rootClass = [
    'admin',
    menuOpen ? 'admin--menu-open' : '',
    railCollapsed ? 'admin--rail-collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass}>
      <header className="admin__topbar">
        <button
          type="button"
          ref={toggleRef}
          className="admin__menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="admin-menu"
          onClick={() => setMenuOpen(true)}
        >
          <IconMenu className="admin__menu-icon" />
          <span>Menu</span>
        </button>

        <Link to="/admin/dashboard" className="admin__brand" onClick={closeMenu}>
          <span className="admin__brand-name">Highlands Coffee</span>
          <span className="admin__brand-sub">Bảng điều hành cửa hàng</span>
        </Link>
      </header>

      <aside className="admin__rail" id="admin-menu">
        <div className="admin__rail-inner">
          <div className="admin__rail-head">
            {/* Máy tính: thu gọn/mở rộng thanh menu. */}
            <button
              type="button"
              className="admin__rail-toggle"
              aria-label={railToggleLabel}
              aria-expanded={!railCollapsed}
              aria-controls="admin-menu"
              title={railToggleLabel}
              onClick={toggleRail}
            >
              <IconPanelLeft className="admin__menu-icon" />
            </button>

            <Link to="/admin/dashboard" className="admin__brand" onClick={closeMenu}>
              <span className="admin__brand-name">Highlands Coffee</span>
              <span className="admin__brand-sub">Bảng điều hành cửa hàng</span>
            </Link>

            {/* Điện thoại: đóng drawer. */}
            <button
              type="button"
              ref={drawerCloseRef}
              className="admin__drawer-close"
              aria-label="Đóng menu"
              onClick={closeMenu}
            >
              <IconX className="admin__menu-icon" />
            </button>
          </div>

          <div className="admin__rail-body">
            <nav className="admin__nav" aria-label="Khu vực quản trị">
              {NAV_SECTIONS.map((section) => (
                <div className="admin__nav-section" key={section.label}>
                  <p className="admin__nav-caption">{section.label}</p>
                  {section.items.map(({ to, label, Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      title={label}
                      className={({ isActive }) =>
                        `admin__nav-link${isActive ? ' is-active' : ''}`
                      }
                      onClick={closeMenu}
                    >
                      <Icon className="admin__nav-icon" />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>

            <div className="admin__account">
              <div className="admin__account-id">
                <span className="admin__account-avatar" aria-hidden="true">
                  {initial}
                </span>
                <span className="admin__account-id-text">
                  <span className="admin__account-name">{displayName}</span>
                  <span className="admin__account-role">Quyền quản trị</span>
                </span>
              </div>

              <div className="admin__account-actions">
                <Link
                  to="/"
                  className="admin__account-link"
                  title="Về cửa hàng"
                  onClick={closeMenu}
                >
                  <IconStore className="admin__account-icon" />
                  <span>Về cửa hàng</span>
                </Link>
                <button
                  type="button"
                  className="admin__account-link admin__account-link--danger"
                  title="Đăng xuất"
                  onClick={handleLogout}
                >
                  <IconLogout className="admin__account-icon" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {menuOpen && (
        <button
          type="button"
          className="admin__scrim"
          aria-label="Đóng menu"
          tabIndex={-1}
          onClick={closeMenu}
        />
      )}

      <main className="admin__main">
        <div className="admin__content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
