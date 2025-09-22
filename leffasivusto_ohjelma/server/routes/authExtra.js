// FILE: server/routes/authExtra.js
import express from "express";
import bcrypt from "bcrypt";
import pool from "../db.js";
import { verifyJWT } from "../middleware/auth.js";

const router = express.Router();

/**
 * WHY: Profiilin päivittäminen ilman uuden tokenin uudelleenluontia.
 * HUOM: Oletus, että users-taulussa on sarakkeet: user_id, email, password_hash.
 *       Jos sinulla on myös name-sarake, voit laajentaa päivitystä helposti.
 */
router.put("/update", verifyJWT, async (req, res) => {
  const userId = req.user?.user_id;
  const { email /* , name */ } = req.body ?? {};

  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!email) return res.status(400).json({ error: "Nothing to update" });

  // Yksinkertainen email-validointi – rajaa virheelliset arvot aikaisin
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
  if (!emailOk) return res.status(400).json({ error: "Invalid email" });

  try {
    // Uniqueness-check (poislukien oma käyttäjä)
    const exists = await pool.query(
      "SELECT 1 FROM users WHERE email = $1 AND user_id <> $2",
      [email, userId]
    );
    if (exists.rows.length) {
      return res.status(409).json({ error: "Email already in use" });
    }

    // Päivitä sähköposti
    const updated = await pool.query(
      `UPDATE users
          SET email = $1
        WHERE user_id = $2
      RETURNING user_id, email, created_at`,
      [email, userId]
    );

    if (!updated.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    // Palauta yhdenmukaisessa muodossa
    return res.json({ user: updated.rows[0] });
  } catch (e) {
    console.error("auth/update error:", e);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

/**
 * WHY: Salasanan vaihto turvallisesti – tarkista nykyinen salasana ennen vaihtoa.
 */
router.post("/change-password", verifyJWT, async (req, res) => {
  const userId = req.user?.user_id;
  const { currentPassword, newPassword } = req.body ?? {};

  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Missing fields" });
  }
  if (String(newPassword).length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  try {
    const { rows } = await pool.query(
      "SELECT password_hash FROM users WHERE user_id = $1",
      [userId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const ok = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!ok) {
      // WHY: Ei paljasteta onko user/email oikein → geneerinen virhe
      return res.status(400).json({ error: "Current password incorrect" });
    }

    const hash = await bcrypt.hash(String(newPassword), 10);
    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE user_id = $2",
      [hash, userId]
    );

    return res.json({ success: true });
  } catch (e) {
    console.error("auth/change-password error:", e);
    return res.status(500).json({ error: "Failed to change password" });
  }
});

export default router;
