// server/models/authModel.js
import pool from "../db.js";

/* ---------- Yhteisiä apuja ---------- */

// Onko email toisen käyttäjän käytössä?
export async function isEmailTaken(email, exceptUserId) {
  const { rows } = await pool.query(
    "SELECT 1 FROM users WHERE email = $1 AND user_id <> $2",
    [email, exceptUserId]
  );
  return rows.length > 0;
}

// Päivitä email + updated_at (namea ei vaadita skeemaan)
export async function updateProfileFields(userId, { email }) {
  if (typeof email === "undefined") return null;

  const { rows } = await pool.query(
    `UPDATE users
        SET email = $1,
            updated_at = NOW()
      WHERE user_id = $2
  RETURNING user_id, email, created_at, updated_at`,
    [email, userId]
  );
  return rows[0] || null;
}

// Hae nykyinen salasanatiiviste
export async function getPasswordHash(userId) {
  const { rows } = await pool.query(
    "SELECT password_hash FROM users WHERE user_id = $1",
    [userId]
  );
  return rows[0]?.password_hash ?? null;
}

// Aseta uusi salasanatiiviste + päivitä updated_at
export async function setPasswordHash(userId, hash) {
  await pool.query(
    `UPDATE users
        SET password_hash = $1,
            updated_at = NOW()
      WHERE user_id = $2`,
    [hash, userId]
  );
}

/* ---------- Auth: register/login/me/delete ---------- */

export async function emailExists(email) {
  const { rows } = await pool.query(
    "SELECT 1 FROM users WHERE email = $1",
    [email]
  );
  return rows.length > 0;
}

export async function getUserByEmailFull(email) {
  const { rows } = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  return rows[0] || null;
}

export async function createUser({ email, passwordHash }) {
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
  RETURNING user_id, email, created_at, updated_at`,
    [email, passwordHash]
  );
  return rows[0];
}

export async function getUserPublicById(userId) {
  const { rows } = await pool.query(
    "SELECT user_id, email, created_at, updated_at FROM users WHERE user_id = $1",
    [userId]
  );
  return rows[0] || null;
}

export async function deleteUserById(userId) {
  const { rowCount } = await pool.query(
    "DELETE FROM users WHERE user_id = $1",
    [userId]
  );
  return rowCount;
}
