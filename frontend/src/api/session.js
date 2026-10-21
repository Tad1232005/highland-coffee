/**
 * Phiên đăng nhập phía client.
 * Backend dùng JWT trả về kèm user; mock adapter đọc cùng khoá localStorage
 * nên chuyển đổi giữa chế độ demo và API thật không đổi logic ở giao diện.
 */
const TOKEN_KEY = 'hc.token'
const USER_KEY = 'hc.user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
