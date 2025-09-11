// src/services/api.js
import axios from 'axios';
import { getToken, setToken, clearToken } from './token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:3001/api',
  withCredentials: true, // tärkeä: refresh-cookie kulkee
});

// Authorization ennen pyyntöä
api.interceptors.request.use((cfg) => {
  const at = getToken();
  if (at) cfg.headers.Authorization = `Bearer ${at}`;
  return cfg;
});

// 401 -> koeta päivittää access /auth/refresh:lla ja toista pyyntö
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config;
    const status = error?.response?.status;

    if (status !== 401 || orig?._retry) {
      return Promise.reject(error);
    }
    orig._retry = true;

    try {
      // huolehditaan, että vain yksi refresh-pyyntö kerrallaan
      if (!refreshing) {
        // käytetään suoraan axiosia, mutta sama baseURL toimii myös `api.post(...)`
        refreshing = api.post('/auth/refresh');
      }
      const { data } = await refreshing;
      refreshing = null;

      if (data?.accessToken) {
        setToken(data.accessToken);
        orig.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(orig); // toista alkuperäinen pyyntö
      }
      throw new Error('No accessToken from refresh');
    } catch (e) {
      refreshing = null;
      clearToken();
      return Promise.reject(error);
    }
  }
);

export default api;
