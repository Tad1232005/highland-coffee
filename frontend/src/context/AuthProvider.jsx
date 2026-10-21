import { useCallback, useEffect, useMemo, useState } from 'react'
import { auth } from '../api'
import { clearSession, getStoredUser, getToken, saveSession } from '../api/session'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [verified, setVerified] = useState(() => !getToken())

  useEffect(() => {
    if (!getToken()) return undefined
    let active = true
    auth
      .me()
      .then((data) => {
        if (!active) return
        setUser(data)
        saveSession(getToken(), data)
      })
      .catch(() => {
        if (!active) return
        clearSession()
        setUser(null)
      })
      .finally(() => {
        if (active) setVerified(true)
      })
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (payload) => {
    const data = await auth.login(payload)
    saveSession(data.access_token, data.user)
    setUser(data.user)
    setVerified(true)
    return data.user
  }, [])

  const register = useCallback(async (payload) => {
    const data = await auth.register(payload)
    saveSession(data.access_token, data.user)
    setUser(data.user)
    setVerified(true)
    return data.user
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
    setVerified(true)
  }, [])

  const value = useMemo(
    () => ({ user, loading: !verified, login, register, logout, isAdmin: user?.role === 'admin' }),
    [user, verified, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
