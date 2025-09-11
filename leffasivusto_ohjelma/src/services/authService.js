// src/services/authService.js
import api from './api';
import { setToken, clearToken } from './token';

// --- AUTH API ---
export async function loginApi(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  if (data?.accessToken) setToken(data.accessToken);
  return data; // { accessToken, user }
}

export async function registerApi(email, password) {
  const { data } = await api.post('/auth/register', { email, password });
  if (data?.accessToken) setToken(data.accessToken);
  return data; // { accessToken, user }
}

export async function refreshApi() {
  const { data } = await api.post('/auth/refresh'); 
  if (data?.accessToken) setToken(data.accessToken);
  return data; // { accessToken }
}

export async function meApi() {
  const { data } = await api.get('/auth/me'); // suojattu reitti (Bearer)
  return data; // { user }
}

export async function logoutApi() {
  await api.post('/auth/logout'); 
  clearToken();                   
  return { ok: true };
}
