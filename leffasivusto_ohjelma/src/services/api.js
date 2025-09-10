// api.js — TOKENLESS DEFAULT
// ------------------------------------------------------------
// Toimii ilman tokenia. Kun JWT valmis, ota kommenteissa
// merkityt osat käyttöön (Authorization-header + refresh).

import axios from 'axios'
// Kun JWT valmis, Ota käyttöön:
// import { getToken, setToken, clearToken } from './token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:3001/api',
  // Kun käytätte refresh-cookiea, tämä kannattaa pitää päällä jo nyt:
  withCredentials: true,
})

// ===== REQUEST: Authorization (TOKENLESS: ei lisätä mitään) =====
// Kun JWT valmis, Ota käyttöön:
/*
api.interceptors.request.use((cfg) => {
  const at = getToken()
  if (at) cfg.headers.Authorization = `Bearer ${at}`
  return cfg
})
*/

// ===== RESPONSE: 401 → refresh → retry (TOKENLESS: ei tarvita) =====
// Kun JWT valmis, Ota käyttöön:
/*
let refreshing = null
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config
    const status = error?.response?.status
    if (status !== 401 || orig?._retry) {
      return Promise.reject(error)
    }
    orig._retry = true
    try {
      if (!refreshing) {
        refreshing = api.post('/auth/refresh') // { accessToken }
      }
      const { data } = await refreshing
      refreshing = null
      if (data?.accessToken) {
        setToken(data.accessToken)
        orig.headers.Authorization = `Bearer ${data.accessToken}`
        return api(orig)
      }
      throw new Error('No accessToken from refresh')
    } catch (e) {
      refreshing = null
      clearToken?.()
      return Promise.reject(error)
    }
  }
)
*/

export default api
