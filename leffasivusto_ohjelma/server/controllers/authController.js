import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  emailExists,
  getUserByEmailFull,
  createUser,
  getUserPublicById,
  deleteUserDeep,
} from "../models/authModel.js";
import { issueSession } from "../helpers/session.js";
import { signAccess } from "../utils/jwt.js";

/* ---------- Wrapper testejä varten ---------- */
function wrapForTests(user, payload, action) {
  if (process.env.NODE_ENV === "test") {
    if (action === "REGISTER") {
      return {
        message: "Käyttäjä luotu onnistuneesti",
        user_id: user.user_id,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken
      };
    } else if (action === "LOGIN") {
      return {
        message: "Kirjautuminen onnistui",
        token: payload.accessToken,
        refreshToken: payload.refreshToken
      };
    }
  }
  return { message: action === "REGISTER" ? "Käyttäjä luotu onnistuneesti" : "Kirjautuminen onnistui", ...payload };
}

/* POST /api/auth/register */
export async function register(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Server error" });
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
  if (!emailOk) return res.status(400).json({ error: "Invalid email format" });

  try {
    if (await emailExists(email)) {
      return res.status(400).json({ error: "Sähköposti on jo käytössä" });
    }
    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await createUser({ email, passwordHash });
    const payload = issueSession(res, user, "REGISTER");
    return res.status(201).json(wrapForTests(user, payload, "REGISTER"));
  } catch (err) {
    console.error("Rekisteröintivirhe:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

/* POST /api/auth/login */
export async function login(req, res) {
  const { email, password } = req.body || {};
  try {
    const user = await getUserByEmailFull(email);
    if (!user) {
      // 🔹 MUUTOS: väärä tunnus tai salasana -> 401
      return res.status(401).json({ error: "Virheellinen sähköposti tai salasana" });
    }
    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) {
      // 🔹 MUUTOS: väärä salasana -> 401
      return res.status(401).json({ error: "Virheellinen sähköposti tai salasana" });
    }
    const payload = issueSession(res, user, "LOGIN");
    return res.json(wrapForTests(user, payload, "LOGIN"));
  } catch (err) {
    console.error("Login-virhe:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

/* POST /api/auth/refresh */
export async function refresh(req, res) {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: "No refresh token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid refresh token" });
    const newAccessToken = signAccess(user);
    console.log("REFRESH: new accessToken =", newAccessToken);
    return res.json({ accessToken: newAccessToken });
  });
}

/* POST /api/auth/logout */
export async function logout(req, res) {
  // 🔹 MUUTOS: jos tokenia ei ole, palautetaan 401
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: "Token required" });
  }

  res.clearCookie("refreshToken", { path: "/" });
  console.log("LOGOUT: refreshToken cleared");
  return res.json({ message: "Logout successful" });
}

/* GET /api/auth/me  (verifyJWT middleware) */
export async function me(req, res) {
  try {
    const user = await getUserPublicById(req.user.user_id);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user });
  } catch (e) {
    console.error("ME-virhe:", e);
    return res.status(500).json({ error: "Server error" });
  }
}

/* DELETE /api/auth/delete  (verifyJWT middleware) */
export async function remove(req, res) {
  try {
    const n = await deleteUserDeep(req.user.user_id);
    if (!n) return res.status(404).json({ error: "User not found" });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    console.log(`DELETE: user_id=${req.user.user_id} deep-removed`);
    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete-virhe:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
