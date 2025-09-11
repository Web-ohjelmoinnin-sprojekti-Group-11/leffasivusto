// src/controllers/authController.js
import { loginApi, registerApi, logoutApi, meApi, refreshApi } from '../services/authService';

export const login    = (e, p) => loginApi(e, p);
export const register = (e, p) => registerApi(e, p);
export const logout   = () => logoutApi();
export const me       = () => meApi();

export const refresh  = () => refreshApi();
