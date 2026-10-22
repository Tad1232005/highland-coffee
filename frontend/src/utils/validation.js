const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const validateLogin = (form) => {
  const errors = {}
  if (!form.email.trim()) errors.email = 'Vui lòng nhập email.'
  else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Email không hợp lệ.'
  if (!form.password) errors.password = 'Vui lòng nhập mật khẩu.'
  else if (form.password.length < 8) errors.password = 'Mật khẩu phải có ít nhất 8 ký tự.'
  return errors
}

export const validateRegister = (form) => {
  const errors = {}
  if (form.full_name.trim().length < 2) errors.full_name = 'Tên quá ngắn, cần ít nhất 2 ký tự.'
  if (!form.email.trim()) errors.email = 'Vui lòng nhập email.'
  else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Email không hợp lệ.'
  if (form.password.length < 8) errors.password = 'Mật khẩu phải có ít nhất 8 ký tự.'
  else if (!/[a-zA-Z]/.test(form.password) || !/\d/.test(form.password))
    errors.password = 'Mật khẩu phải có cả chữ và số.'
  if (form.phone && !/^0\d{8,10}$/.test(form.phone.replace(/\s/g, '')))
    errors.phone = 'Số điện thoại chưa hợp lệ.'
  return errors
}
