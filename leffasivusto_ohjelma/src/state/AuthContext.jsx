// AuthContext.jsx — TOKENLESS DEFAULT
// ------------------------------------------------------------
// Tämä versio toimii ilman tokenia (stub).
// Kun JWT on valmis, poista STUB-KOHDAT ja Ota käyttöön
// -merkityt rivit (sekä lisää api+authService -muutokset alla).

import { createContext, useContext, useMemo, useState, useEffect } from 'react'
// Ota käyttöön JWT-valmis versioissa:
// import api from '../services/api'
// import { getToken, setToken, clearToken } from '../services/token'
import * as authController from '../controllers/authController'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // ===== App start (TOKENLESS): ei tehdä mitään =====
  // Kun JWT valmis, Ota käyttöön:
  /*
  useEffect(() => {
    const at = getToken()
    if (!at) return
    let dead = false
    ;(async () => {
      try {
        const { data } = await api.get('/auth/me')
        if (!dead) setUser(data?.user || null)
      } catch {
        if (!dead) { clearToken(); setUser(null) }
      }
    })()
    return () => { dead = true }
  }, [])
  */

  // ===== 401 → avaa login (TOKENLESS: ei tarvita) =====
  // Kun JWT valmis, Ota käyttöön:
  /*
  useEffect(() => {
    const id = api.interceptors.response.use(r => r, (err) => {
      if (err?.response?.status === 401) setAuthOpen(true)
      return Promise.reject(err)
    })
    return () => api.interceptors.response.eject(id)
  }, [])
  */

  // ===== Toiminnot =====
  const login = async (email, password) => {
    // TOKENLESS (STUB): heitetään selkeä virhe
    setLoading(true); setError(null)
    try {
      throw new Error('Kirjautuminen ei ole vielä käytössä (backend/JWT kesken).')
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }

    // Kun JWT valmis, korvaa yllä oleva koko funktio tällä:
    /*
    setLoading(true); setError(null)
    try {
      const { accessToken, user } = await authController.login(email, password)
      if (!accessToken) throw new Error('Token puuttuu')
      setToken(accessToken)
      setUser(user || null)
      setAuthOpen(false)
    } catch (e) {
      setError(e?.message || 'Kirjautuminen epäonnistui')
      throw e
    } finally {
      setLoading(false)
    }
    */
  }

  const register = async (email, password) => {
    // TOKENLESS (STUB)
    setLoading(true); setError(null)
    try {
      throw new Error('Rekisteröityminen ei ole vielä käytössä (backend/JWT kesken).')
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }

    // Kun JWT valmis, korvaa yllä oleva koko funktio tällä:
    /*
    setLoading(true); setError(null)
    try {
      const { accessToken, user } = await authController.register(email, password)
      if (!accessToken) throw new Error('Token puuttuu')
      setToken(accessToken)
      setUser(user || null)
      setAuthOpen(false)
    } catch (e) {
      setError(e?.message || 'Rekisteröityminen epäonnistui')
      throw e
    } finally {
      setLoading(false)
    }
    */
  }

  const logout = async () => {
    // TOKENLESS (STUB)
    setUser(null)

    // Kun JWT valmis, Ota käyttöön:
    /*
    await authController.logout()
    clearToken()
    setUser(null)
    */
  }

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,                  // JWT-valmiissa voi tarkistaa myös getToken()
    login, register, logout,
    authOpen, setAuthOpen,
    loading, error
  }), [user, authOpen, loading, error])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
