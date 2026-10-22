import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { useToast } from '../../context/useToast'

const DEMO_ADMIN = { email: 'admin@highland.vn', password: 'Admin@123456' }

export function AdminLogin() {
  const { user, login } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/my-orders'} replace />
  }

  const update = (field) => (event) => {
    const value = event.target.value
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      const account = await login(form)
      if (account.role !== 'admin') {
        setError('Tài khoản này không có quyền quản trị.')
        return
      }
      notify('Đã vào khu vực quản trị.', { type: 'success', title: 'Xin chào' })
      navigate('/admin', { replace: true })
    } catch (requestError) {
      setError(requestError.detail ?? 'Không đăng nhập được khu vực quản trị.')
    } finally {
      setPending(false)
    }
  }

  const quickLogin = async () => {
    setError('')
    setPending(true)
    try {
      await login(DEMO_ADMIN)
      notify('Đã vào khu vực quản trị.', { type: 'success', title: 'Xin chào' })
      navigate('/admin', { replace: true })
    } catch (requestError) {
      setError(requestError.detail ?? 'Không mở được khu vực quản trị.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="admin-login">
      <div className="admin-login__panel">
        <p className="admin-login__brand">Highlands Coffee</p>
        <h1 className="admin-login__title">Khu vực quản trị</h1>
        <p className="admin-login__lead">
          Đăng nhập bằng tài khoản quản trị để xử lý đơn hàng và cập nhật thực đơn.
        </p>

        {error && <p className="notice notice--error">{error}</p>}

        <form className="admin-login__form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field__label" htmlFor="admin-email">
              Email quản trị
            </label>
            <input
              id="admin-email"
              className="field__control"
              type="email"
              autoComplete="username"
              placeholder="admin@highland.vn"
              value={form.email}
              onChange={update('email')}
              aria-required="true"
            />
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
              aria-required="true"
            />
          </div>

          <button type="submit" className="btn btn--primary btn--block" disabled={pending}>
            {pending ? 'Đang kiểm tra…' : 'Đăng nhập quản trị'}
          </button>
        </form>

        <div className="admin-login__demo">
          <button
            type="button"
            className="btn btn--outline btn--block"
            onClick={quickLogin}
            disabled={pending}
          >
            Vào thẳng bằng tài khoản mẫu
          </button>
        </div>

        <p className="admin-login__back">
          <Link to="/login">Quay lại đăng nhập khách hàng</Link>
        </p>
      </div>
    </section>
  )
}
