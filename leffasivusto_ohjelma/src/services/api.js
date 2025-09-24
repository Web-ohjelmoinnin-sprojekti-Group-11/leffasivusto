// src/services/api.js
import axios from "axios";
import { getToken, setToken, clearToken } from "./token";

// Perusinstanssi API-kutsuille
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:3001/api",
  withCredentials: true,
});

// Lisäinstanssi VAIN refreshiä varten (ei interceptoreita)
const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:3001/api",
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

// 401 → yritä kertaalleen /auth/refresh (single-flight), toista alkuperäinen
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config;
    const status = error?.response?.status;

    // Älä yritä refreshiä itse refresh-kutsuun tai muihin kuin 401-virheisiin
    if (status !== 401 || orig?._retry || (orig?.url || "").includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    orig._retry = true;

    try {
      if (!refreshing) {
        // käytetään refreshClientiä → ei mene tämän interceptorin läpi
        refreshing = refreshClient.post("/auth/refresh");
      }
      const { data } = await refreshing;
      refreshing = null;

      const newAT = data?.accessToken;
      if (!newAT) throw new Error("No accessToken from refresh");

      setToken(newAT);

      // toista alkuperäinen pyyntö uudella Authorizationilla
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
