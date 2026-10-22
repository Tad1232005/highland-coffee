import { Link } from 'react-router-dom'
import { site } from '../content/site'
import { useAuth } from '../context/useAuth'
import { useLogout } from '../hooks/useLogout'
import { IconLogout } from './icons'

export function Footer() {
  const { user, isAdmin } = useAuth()
  const onLogout = useLogout()

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__inner">
          <div className="site-footer__brand">
            <p className="brand">
              <span className="brand__mark">Highlands</span>
              <span>Coffee</span>
            </p>
            <p className="site-footer__tagline">
              Cà phê phin Việt, pha theo kiểu riêng từ năm 2013.
            </p>
            <div className="site-footer__cta">
              <Link to="/menu" className="btn btn--primary">
                Xem thực đơn
              </Link>
              <a className="btn btn--on-dark" href={`tel:${site.phone.replaceAll(' ', '')}`}>
                Gọi {site.phone}
              </a>
            </div>
          </div>

          <div className="site-footer__col">
            <p className="site-footer__title">Ghé quán</p>
            <ul className="site-footer__list">
              <li>{site.address}</li>
              <li>{site.hours}</li>
            </ul>
          </div>

          <div className="site-footer__col">
            <p className="site-footer__title">Liên hệ</p>
            <ul className="site-footer__list">
              <li>
                <a href={`tel:${site.phone.replaceAll(' ', '')}`}>{site.phone}</a>
              </li>
              <li>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </li>
            </ul>
          </div>

          <div className="site-footer__col">
            <p className="site-footer__title">Tài khoản</p>
            <ul className="site-footer__list">
              <li>
                <Link to="/my-orders">Đơn của tôi</Link>
              </li>
              {isAdmin && (
                <li>
                  <Link to="/admin">Khu vực quản trị</Link>
                </li>
              )}
              {user ? (
                <li>
                  <button type="button" className="site-footer__logout" onClick={onLogout}>
                    <IconLogout width={16} height={16} />
                    Đăng xuất
                  </button>
                </li>
              ) : (
                <li>
                  <Link to="/login">Đăng nhập</Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="site-footer__bottom">
          <span>© {new Date().getFullYear()} Highlands Coffee. Bảo lưu mọi quyền.</span>
          <span>Đơn hàng phát triển trên nền tảng dữ liệu phổng.</span>
        </div>
      </div>
    </footer>
  )
}
