import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useToast } from '../context/useToast'
import { validateRegister } from '../utils/validation'

export function Register() {
  const { user, register } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '' })
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
    const found = validateRegister(form)
    setErrors(found)
    setFormError('')
    if (Object.keys(found).length > 0) return

    setPending(true)
    try {
      const account = await register(form)
      notify('Tạo tài khoản xong. Chúc bạn nhiều ly ngon!', {
        type: 'success',
        title: `Chào mừng ${account.full_name?.split(' ').slice(-1)[0] ?? 'bạn'}`,
      })
      navigate('/menu', { replace: true })
    } catch (requestError) {
      setFormError(requestError.detail ?? 'Không tạo được tài khoản. Thử lại sau.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="auth">
      <div className="auth__card">
        <p className="brand auth__brand">
          <span className="brand__mark">Highlands</span>
          <span>Coffee</span>
        </p>

        <h1 className="auth__title">Đăng ký</h1>
        <p className="auth__lead">Tạo tài khoản Highlands để đặt món nhanh hơn và nhận ưu đãi thành viên.</p>

        {formError && <p className="notice notice--error">{formError}</p>}

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field__label" htmlFor="register-name">
              Họ và tên
            </label>
            <input
              id="register-name"
              className="field__control"
              type="text"
              autoComplete="name"
              placeholder="Nguyễn Văn A"
              value={form.full_name}
              onChange={update('full_name')}
              aria-invalid={Boolean(errors.full_name)}
              aria-required="true"
            />
            {errors.full_name && <p className="field__error">{errors.full_name}</p>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="register-email">
              Email
            </label>
            <input
              id="register-email"
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
            <label className="field__label" htmlFor="register-password">
              Mật khẩu
            </label>
            <input
              id="register-password"
              className="field__control"
              type="password"
              autoComplete="new-password"
              placeholder="Tối thiểu 8 ký tự, có chữ và số"
              value={form.password}
              onChange={update('password')}
              aria-invalid={Boolean(errors.password)}
              aria-required="true"
            />
            {errors.password && <p className="field__error">{errors.password}</p>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="register-phone">
              Số điện thoại <span className="field__hint">(không bắt buộc)</span>
            </label>
            <input
              id="register-phone"
              className="field__control"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0901234567"
              value={form.phone}
              onChange={update('phone')}
              aria-invalid={Boolean(errors.phone)}
            />
            {errors.phone && <p className="field__error">{errors.phone}</p>}
          </div>

          <button type="submit" className="btn btn--primary btn--block" disabled={pending}>
            {pending ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}
          </button>
        </form>

        <p className="auth__alt">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </section>
  )
}
