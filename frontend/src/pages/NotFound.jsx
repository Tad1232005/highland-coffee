import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <section className="section">
      <div className="container">
        <div className="empty">
          <h1 className="empty__title">Không tìm thấy trang này</h1>
          <p className="empty__text">
            Đường dẫn có thể đã đổi, hoặc bạn gõ nhầm. Quay lại thực đơn vẫn nhanh nhất.
          </p>
          <Link to="/menu" className="btn btn--primary">
            Xem thực đơn
          </Link>
        </div>
      </div>
    </section>
  )
}
