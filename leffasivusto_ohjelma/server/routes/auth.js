// server/routes/auth.js
// tänne kaikki käyttäjän hallintaan liittyvä.
// Huomattavasti mukavampaa kun jaoteltu jos tarvii debyug tms.
// Eikä kaikki index.js sisällä :)

import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { verifyJWT } from "../middleware/auth.js";
import { issueSession } from "../helpers/session.js";
import { signAccess } from "../utils/jwt.js";

const router = express.Router();

/* -------------------- register -------------------- */
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    const { rows: exists } = await pool.query(
      "SELECT 1 FROM users WHERE email = $1",
      [email]
    );
    if (exists.length) {
      return res.status(400).json({ error: "Sähköposti on jo käytössä" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING user_id, email, created_at`,
      [email, passwordHash]
    );

    const user = rows[0];
    const payload = issueSession(res, user, "REGISTER");
    return res.status(201).json({ message: "Käyttäjä luotu onnistuneesti", ...payload });
  } catch (err) {
    console.error("Rekisteröintivirhe:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* -------------------- login -------------------- */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (!rows.length) {
      return res.status(400).json({ error: "Virheellinen sähköposti tai salasana" });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(400).json({ error: "Virheellinen sähköposti tai salasana" });
    }

    const payload = issueSession(res, user, "LOGIN");
    return res.json({ message: "Kirjautuminen onnistui", ...payload });
  } catch (err) {
    console.error("Login-virhe:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* -------------------- refresh -------------------- */
router.post("/refresh", (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: "No refresh token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid refresh token" });

    const newAccessToken = signAccess(user);
    console.log("REFRESH: new accessToken =", newAccessToken);
    return res.json({ accessToken: newAccessToken });
  });
});

/* -------------------- logout -------------------- */
router.post("/logout", (_req, res) => {
  res.clearCookie("refreshToken", { path: "/" });
  console.log("LOGOUT: refreshToken cleared");
  return res.json({ message: "Logout successful" });
});

/* -------------------- me (suojattu) -------------------- */
router.get("/me", verifyJWT, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT user_id, email, created_at FROM users WHERE user_id = $1",
      [req.user.user_id]
    );
    if (!rows.length) return res.status(404).json({ error: "User not found" });
    return res.json({ user: rows[0] });
  } catch (e) {
    console.error("ME-virhe:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

/* -------------------- delete account -------------------- */
router.delete("/delete", verifyJWT, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const { rowCount } = await pool.query(
      "DELETE FROM users WHERE user_id = $1",
      [userId]
    );

    if (!rowCount) {
      return res.status(404).json({ error: "User not found" });
    }

    // Tyhjennetään refreshToken-cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/"
    });

    console.log(`DELETE: user_id=${userId} removed`);
    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete-virhe:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
