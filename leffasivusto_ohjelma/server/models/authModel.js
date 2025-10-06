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

// Päivitä email + updated_at
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

/** Yksinkertainen poisto (vain users) */
export async function deleteUserById(userId) {
  const { rowCount } = await pool.query(
    "DELETE FROM users WHERE user_id = $1",
    [userId]
  );
  return rowCount;
}

/* ---------- Syväpoisto teidän skeemalle ---------- */

async function safeExec(client, sql, params) {
  try {
    await client.query(sql, params);
  } catch (e) {
    // 42P01=undefined_table, 42703=undefined_column (sallitaan devissä)
    if (e?.code === "42P01" || e?.code === "42703") {
      console.warn("safeExec skip:", e.code, "-", e.message);
      return;
    }
    throw e;
  }
}

/**
 * Poistaa KAIKEN käyttäjään liittyvän:
 * - Omistamat ryhmät ja niiden sisällöt (group_content, group_members, showtimes -> groups)
 * - Jäsenyydet muissa ryhmissä
 * - Käyttäjän luomat sisällöt muissa ryhmissä (group_content, showtimes)
 * - Arvostelut (reviews)
 * - Watch later (watch_later)
 * - Suosikkilistat (favorite_list_movies -> favorite_lists)
 * - Lopuksi itse käyttäjä
 */
export async function deleteUserDeep(userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    /* 1) Ryhmät joita käyttäjä OMISTAA */
    // Ryhmien sisältö (group_content)
    await safeExec(
      client,
      `DELETE FROM group_content gc
         USING groups g
        WHERE g.group_id = gc.group_id
          AND g.owner_id = $1`,
      [userId]
    );
    // Ryhmien näytösjaot (showtimes)
    await safeExec(
      client,
      `DELETE FROM showtimes s
         USING groups g
        WHERE g.group_id = s.group_id
          AND g.owner_id = $1`,
      [userId]
    );
    // Ryhmien jäsenyydet (group_members)
    await safeExec(
      client,
      `DELETE FROM group_members gm
         USING groups g
        WHERE g.group_id = gm.group_id
          AND g.owner_id = $1`,
      [userId]
    );
    // Itse ryhmät
    await safeExec(client, `DELETE FROM groups WHERE owner_id = $1`, [userId]);

    /* 2) Jäsenyydet muissa ryhmissä */
    await safeExec(client, `DELETE FROM group_members WHERE user_id = $1`, [userId]);

    /* 3) Käyttäjän sisältö muissa ryhmissä */
    await safeExec(client, `DELETE FROM group_content WHERE user_id = $1`, [userId]);
    await safeExec(client, `DELETE FROM showtimes     WHERE user_id = $1`, [userId]);

    /* 4) Arvostelut */
    await safeExec(client, `DELETE FROM reviews WHERE user_id = $1`, [userId]);

    /* 5) Watch later */
    await safeExec(client, `DELETE FROM watch_later WHERE user_id = $1`, [userId]);

    /* 6) Suosikkilistat (ensin rivit favorite_list_movies, sitten listat) */
    await safeExec(
      client,
      `DELETE FROM favorite_list_movies flm
         USING favorite_lists fl
        WHERE fl.favorite_list_id = flm.favorite_list_id
          AND fl.user_id = $1`,
      [userId]
    );
    await safeExec(client, `DELETE FROM favorite_lists WHERE user_id = $1`, [userId]);

    /* 7) Lopuksi käyttäjä */
    const result = await client.query(`DELETE FROM users WHERE user_id = $1`, [userId]);

    await client.query("COMMIT");
    return result.rowCount; // 1 jos käyttäjä poistui
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
