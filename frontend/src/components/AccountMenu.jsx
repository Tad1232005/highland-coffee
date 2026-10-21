import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { AccountLinks } from './AccountLinks'
import { IconUser } from './icons'

const initials = (name) =>
  (name ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

/**
 * Nút tài khoản + menu thả xuống.
 * Luôn có mục "Đăng xuất" để khách không phải tìm.
 */
export function AccountMenu() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!user) {
    return (
      <Link to="/login" className="header-action header-action--accent">
        <IconUser />
        <span>Đăng nhập</span>
      </Link>
    )
  }

  return (
    <div className="account" ref={wrapRef}>
      <button
        type="button"
        className="header-action account__trigger"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="account__avatar" aria-hidden="true">
          {initials(user.full_name) || <IconUser width={16} height={16} />}
        </span>
        <span className="account__name">{user.full_name?.split(' ').slice(-1)[0]}</span>
      </button>

      <div className={`account__menu${open ? ' is-open' : ''}`} role="menu">
        <AccountLinks onNavigate={() => setOpen(false)} />
      </div>
    </div>
  )
}
