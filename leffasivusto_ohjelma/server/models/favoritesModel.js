import pool from "../db.js";
import crypto from "crypto";

/** Hae tai luo käyttäjän oletuslista (name='Favorites') */
export async function getOrCreateDefaultFavoriteList(userId) {
  let { rows } = await pool.query(
    `SELECT favorite_list_id, user_id, name, share_token
       FROM favorite_lists
      WHERE user_id = $1 AND name = 'Favorites'
      LIMIT 1`,
    [userId]
  );
  if (rows[0]) return rows[0];

  await pool.query(
    `INSERT INTO favorite_lists (user_id, name)
     VALUES ($1, 'Favorites')
     ON CONFLICT DO NOTHING`,
    [userId]
  );

  ({ rows } = await pool.query(
    `SELECT favorite_list_id, user_id, name, share_token
       FROM favorite_lists
      WHERE user_id = $1 AND name = 'Favorites'
      LIMIT 1`,
    [userId]
  ));
  return rows[0] || null;
}

export async function getShareToken(userId) {
  const row = await getOrCreateDefaultFavoriteList(userId);
  return row?.share_token || null;
}

export async function removeShareToken(userId) {
  await pool.query(
    `UPDATE favorite_lists
        SET share_token = NULL
      WHERE user_id = $1 AND name = 'Favorites'`,
    [userId]
  );
}

/**
 * Luo uniikin share_tokenin (URL-safe).
 * 1) Jos token on jo olemassa -> palauta (idempotentti).
 * 2) Yritä generoida PG:ssä (pgcrypto) URL-safe -muotoon atomisesti.
 * 3) Jos pgcrypto puuttuu -> fallback Node-cryptoon (randomBytes->base64url).
 */
export async function createUniqueShareToken(userId, maxAttempts = 8) {
  await getOrCreateDefaultFavoriteList(userId);

  // Idempotentti: jos jo on, palauta
  const existing = await pool.query(
    `SELECT share_token FROM favorite_lists
      WHERE user_id = $1 AND name = 'Favorites'
      LIMIT 1`,
    [userId]
  );
  if (existing.rows[0]?.share_token) return existing.rows[0].share_token;

  // --- 1) PG sisäinen generointi (pgcrypto) URL-safe ----
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      let token = null;

      for (let i = 0; i < maxAttempts; i++) {
        try {
          const { rows } = await client.query(
            `
            WITH newtok AS (
              SELECT
                /* base64 -> korvaa +/ -> -_ ja poista = lopusta */
                regexp_replace(
                  translate(encode(gen_random_bytes(24), 'base64'), '+/', '-_'),
                  '=+$',
                  ''
                ) AS token
            )
            UPDATE favorite_lists fl
               SET share_token = (SELECT token FROM newtok)
             WHERE fl.user_id = $1
               AND fl.name = 'Favorites'
               AND fl.share_token IS NULL
         RETURNING fl.share_token;
            `,
            [userId]
          );
          if (rows[0]?.share_token) { token = rows[0].share_token; break; }

          const got = await client.query(
            `SELECT share_token FROM favorite_lists
              WHERE user_id = $1 AND name = 'Favorites'
              LIMIT 1`,
            [userId]
          );
          if (got.rows[0]?.share_token) { token = got.rows[0].share_token; break; }
        } catch (e) {
          if (e?.code === "23505") continue; // UNIQUE -> uusi yritys
          throw e;
        }
      }

      await client.query("COMMIT");
      if (token) return token;

      const final = await pool.query(
        `SELECT share_token FROM favorite_lists
          WHERE user_id = $1 AND name = 'Favorites'
          LIMIT 1`,
        [userId]
      );
      if (final.rows[0]?.share_token) return final.rows[0].share_token;

      throw new Error("Failed to create a unique share token");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (pgErr) {
    // 42883 = gen_random_bytes puuttuu -> pudotaan Node-cryptoon
    if (pgErr?.code !== "42883") throw pgErr;
  }

  // --- 2) Fallback: Node-crypto (URL-safe base64url) ---
  let lastErr = null;
  for (let i = 0; i < maxAttempts; i++) {
    const token = crypto.randomBytes(24).toString("base64url");
    try {
      const { rows } = await pool.query(
        `UPDATE favorite_lists
            SET share_token = $1
          WHERE user_id = $2 AND name = 'Favorites'
            AND share_token IS NULL
      RETURNING share_token`,
        [token, userId]
      );
      if (rows[0]?.share_token) return rows[0].share_token;

      const got = await pool.query(
        `SELECT share_token FROM favorite_lists
          WHERE user_id = $1 AND name = 'Favorites'
          LIMIT 1`,
        [userId]
      );
      if (got.rows[0]?.share_token) return got.rows[0].share_token;
    } catch (e) {
      if (e?.code === "23505") { lastErr = e; continue; }
      throw e;
    }
  }
  throw lastErr || new Error("Failed to create a unique share token");
}

/** Julkinen haku tokenilla */
export async function findListByToken(token) {
  const { rows } = await pool.query(
    `SELECT favorite_list_id, user_id
       FROM favorite_lists
      WHERE share_token = $1
      LIMIT 1`,
    [token]
  );
  return rows[0] || null;
}

export async function getFavoriteMoviesByListId(listId) {
  const { rows } = await pool.query(
    `SELECT movie_id
       FROM favorite_list_movies
      WHERE favorite_list_id = $1
      ORDER BY movie_id`,
    [listId]
  );
  return rows.map((r) => r.movie_id);
}
