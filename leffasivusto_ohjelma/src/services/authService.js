// authService.js — TOKENLESS DEFAULT
// ------------------------------------------------------------
// Nyt palauttaa selkeän virheen. Kun JWT on valmis, ota käyttöön
// oikeat API-kutsut (alla kommentoituna).

import api from './api'
// Kun JWT valmis, Ota käyttöön:
// import { setToken, clearToken } from './token'

export async function loginApi(email, password) {
  // TOKENLESS (STUB):
  throw new Error('Login ei ole vielä käytössä (backend/JWT kesken).')

  // Kun JWT valmis, Ota käyttöön:
  /*
  const { data } = await api.post('/auth/login', { email, password })
  if (data?.accessToken) setToken(data.accessToken)
  return data // { accessToken, user }
  */
}

export async function registerApi(email, password) {
  // TOKENLESS (STUB):
  throw new Error('Register ei ole vielä käytössä (backend/JWT kesken).')

  // Kun JWT valmis, Ota käyttöön:
  /*
  const { data } = await api.post('/auth/register', { email, password })
  if (data?.accessToken) setToken(data.accessToken)
  return data // { accessToken, user }
  */
}

export async function logoutApi() {
  // TOKENLESS (STUB):
  return

  // Kun JWT valmis, Ota käyttöön:
  /*
  await api.post('/auth/logout')
  clearToken()
  */
}
