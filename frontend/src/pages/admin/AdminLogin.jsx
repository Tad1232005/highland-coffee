import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { useToast } from '../../context/useToast'
import { USE_MOCK } from '../../api/client'
import { validateLogin } from '../../utils/validation'

const DEMO_ADMIN = { email: 'admin@highland.vn', password: 'Admin@123456' }

export function AdminLogin() {
  const { user, login, logout } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [pending, setPending] = useState(false)

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/my-orders'} replace />
  }

  const update = (field) => (event) => {
    const value = event.target.value
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = validateLogin(form)
    setErrors(found)
    setFormError('')
    if (Object.keys(found).length > 0) return

    setPending(true)
    try {
      const account = await login(form)
      if (account.role !== 'admin') {
        // Không giữ phiên của tài khoản khách: trang này chỉ dành cho quản trị.
        logout()
        setFormError('Tài khoản này không có quyền quản trị. Dùng trang đăng nhập khách hàng.')
        return
      }
      notify('Đã vào khu vực quản trị.', { type: 'success', title: 'Xin chào' })
      navigate('/admin', { replace: true })
    } catch (requestError) {
      setFormError(requestError.detail ?? 'Đăng nhập không thành công. Kiểm tra lại thông tin.')
    } finally {
      setPending(false)
    }
  }

  const fillDemo = () => {
    setForm({ ...DEMO_ADMIN })
    setErrors({})
    setFormError('')
  }

  return (
    <section className="auth auth--standalone">
      <div className="auth__card">
        <p className="brand auth__brand">
          <span className="brand__mark">Highlands</span>
          <span>Coffee</span>
        </p>

        <h1 className="auth__title">Khu vực quản trị</h1>
        <p className="auth__lead">
          Đăng nhập bằng tài khoản quản trị để xử lý đơn hàng và cập nhật thực đơn.
        </p>

        {formError && (
          <p className="notice notice--error" role="alert">
            {formError}
          </p>
        )}

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field__label" htmlFor="admin-email">
              Email
            </label>
            <input
              id="admin-email"
              className="field__control"
              type="email"
              autoComplete="username"
              placeholder="admin@highland.vn"
              value={form.email}
              onChange={update('email')}
              aria-invalid={Boolean(errors.email)}
              aria-required="true"
            />
            {errors.email && <p className="field__error">{errors.email}</p>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="admin-password">
              Mật khẩu
            </label>
            <input
              id="admin-password"
              className="field__control"
              type="password"
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              value={form.password}
              onChange={update('password')}
              aria-invalid={Boolean(errors.password)}
              aria-required="true"
            />
            {errors.password && <p className="field__error">{errors.password}</p>}
          </div>

          <button type="submit" className="btn btn--primary btn--block" disabled={pending}>
            {pending ? 'Đang kiểm tra…' : 'Đăng nhập'}
          </button>
        </form>

        <p className="auth__alt auth__alt--muted">
          <Link to="/login">Quay lại đăng nhập khách hàng</Link>
        </p>

        {USE_MOCK && (
          <div className="auth__demo">
            <p className="auth__demo-title">Tài khoản demo</p>
            <div className="auth__demo-row">
              <button type="button" className="demo-chip" onClick={fillDemo}>
                Quản trị
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
