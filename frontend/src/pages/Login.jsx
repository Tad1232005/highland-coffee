import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useToast } from '../context/useToast'
import { validateLogin } from '../utils/validation'

const DEMO_ACCOUNTS = [
  { label: 'Khách hàng', email: 'customer@highland.vn', password: 'Customer@123456' },
  { label: 'Quản trị', email: 'admin@highland.vn', password: 'Admin@123456' },
]

export function Login() {
  const { user, login } = useAuth()
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
      notify(`Chào ${account.full_name?.split(' ').slice(-1)[0] ?? 'bạn'}!`, {
        type: 'success',
        title: 'Đăng nhập thành công',
      })
      navigate(account.role === 'admin' ? '/admin' : '/my-orders', { replace: true })
    } catch (requestError) {
      setFormError(requestError.detail ?? 'Đăng nhập không thành công. Kiểm tra lại thông tin.')
    } finally {
      setPending(false)
    }
  }

  const fillDemo = (account) => {
    setForm({ email: account.email, password: account.password })
    setErrors({})
    setFormError('')
  }

  return (
    <section className="auth">
      <div className="auth__card">
        <p className="brand auth__brand">
          <span className="brand__mark">Highlands</span>
          <span>Coffee</span>
        </p>

        <h1 className="auth__title">Đăng nhập</h1>
        <p className="auth__lead">Chào mừng trở lại! Đăng nhập để tiếp tục đặt ly cà phê của bạn.</p>

        {formError && (
          <p className="notice notice--error" role="alert">
            {formError}
          </p>
        )}

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field__label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              className="field__control"
              type="email"
              autoComplete="email"
              placeholder="ban@highland.vn"
              value={form.email}
              onChange={update('email')}
              aria-invalid={Boolean(errors.email)}
              aria-required="true"
            />
            {errors.email && <p className="field__error">{errors.email}</p>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="login-password">
              Mật khẩu
            </label>
            <input
              id="login-password"
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
            {pending ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>

        <p className="auth__alt">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
        <p className="auth__alt auth__alt--muted">
          <Link to="/admin/login">Đăng nhập khu vực quản trị</Link>
        </p>

        <div className="auth__demo">
          <p className="auth__demo-title">Tài khoản demo</p>
          <div className="auth__demo-row">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                className="demo-chip"
                onClick={() => fillDemo(account)}
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
