import { loginApi, registerApi } from '../services/authService'

export async function login(email, password) {
  return await loginApi(email, password)
}

export async function register(email, password) {
  return await registerApi(email, password)
}
