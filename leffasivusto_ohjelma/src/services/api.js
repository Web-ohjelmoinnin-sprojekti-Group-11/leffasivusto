// src/services/api.js
import axios from "axios";
import { getToken, setToken, clearToken } from "./token";

// Lue sekä VITE_API_BASE että VITE_API_BASE_URL (Render-kuvassa oli _URL)
const BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3001/api";

// Perusinstanssi API-kutsuille
const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
});

// Lisäinstanssi VAIN refreshiä varten (ei interceptoreita)
const refreshClient = axios.create({
  baseURL: BASE,
  withCredentials: true,
});

// Authorization ennen jokaista pyyntöä
api.interceptors.request.use((cfg) => {
  const at = getToken?.();
  if (at) {
    cfg.headers = cfg.headers || {};
    cfg.headers.Authorization = `Bearer ${at}`;
  }
  return cfg;
});

// 401 → /auth/refresh (single-flight)
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config;
    const status = error?.response?.status;

    if (status !== 401 || orig?._retry || (orig?.url || "").includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    orig._retry = true;

    try {
      if (!refreshing) {
        refreshing = refreshClient.post("/auth/refresh");
      }
      const { data } = await refreshing;
      refreshing = null;

      const newAT = data?.accessToken;
      if (!newAT) throw new Error("No accessToken from refresh");

      setToken(newAT);
      orig.headers = orig.headers || {};
      orig.headers.Authorization = `Bearer ${newAT}`;
      return api(orig);
    } catch (e) {
      refreshing = null;
      clearToken();
      return Promise.reject(error);
    }
  }
);

export default api;
