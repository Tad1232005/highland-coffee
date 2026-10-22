import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useCart } from '../context/useCart'
import { useState } from 'react'
import { AccountLinks } from './AccountLinks'
import { Modal } from './Modal'
import { IconCart, IconCup, IconGrid, IconUser } from './icons'

export function MobileTabBar() {
  const { user } = useAuth()
  const { totalQuantity } = useCart()
  const [sheetOpen, setSheetOpen] = useState(false)

  const tabClass = ({ isActive }) => `tabbar__item${isActive ? ' is-active' : ''}`

  return (
    <>
      <nav className="tabbar" aria-label="Điều hướng nhanh">
        <NavLink to="/menu" className={tabClass}>
          <IconGrid width={22} height={22} />
          <span>Thực đơn</span>
        </NavLink>

        <NavLink to="/cart" className={tabClass}>
          <span className="tabbar__icon-wrap">
            <IconCart width={22} height={22} />
            {totalQuantity > 0 && <span className="cart-badge">{totalQuantity}</span>}
          </span>
          <span>Giỏ</span>
        </NavLink>

        <NavLink to="/my-orders" className={tabClass}>
          <IconCup width={22} height={22} />
          <span>Đơn</span>
        </NavLink>

        {user ? (
          <button
            type="button"
            className="tabbar__item tabbar__item--button"
            onClick={() => setSheetOpen(true)}
          >
            <IconUser width={22} height={22} />
            <span>Tài khoản</span>
          </button>
        ) : (
          <NavLink to="/login" className={tabClass}>
            <IconUser width={22} height={22} />
            <span>Tài khoản</span>
          </NavLink>
        )}
      </nav>

      <Modal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Tài khoản"
        size="sheet"
        labelledBy="account-sheet-title"
      >
        <div className="account__sheet">
          <AccountLinks onNavigate={() => setSheetOpen(false)} />
        </div>
      </Modal>
    </>
  )
}
