// server/models/userModel.js
import pool from "../db.js";

/* ----------------------------- FAVORITES --------------------------------- */

// Palauta suosikit listamuotoisesta skeemasta (fl/flm) – heittää virheen jos tauluja ei ole
async function _getFavoritesListSchema(userId) {
  const { rows } = await pool.query(
    `SELECT flm.movie_id AS id
       FROM favorite_list_movies flm
       JOIN favorite_lists fl ON flm.favorite_list_id = fl.favorite_list_id
      WHERE fl.user_id = $1
      GROUP BY flm.movie_id
      ORDER BY MAX(flm.movie_id) DESC`,
    [userId]
  );
  return rows;
}

// Palauta suosikit yksinkertaisesta skeemasta (favorites)
async function _getFavoritesSimple(userId) {
  const { rows } = await pool.query(
    `SELECT movie_id AS id
       FROM favorites
      WHERE user_id = $1
      ORDER BY created_at DESC NULLS LAST`,
    [userId]
  );
  return rows;
}

export async function getFavorites(userId) {
  try {
    return await _getFavoritesListSchema(userId);
  } catch {
    return await _getFavoritesSimple(userId);
  }
}

/* ------------------------- SHAREABLE FAVORITE LISTS ---------------------- */

// Hae favorite_list_id ja token nykyiselle käyttäjälle (oletuslista)
export async function ensureFavoriteList(userId) {
  const { rows } = await pool.query(
    `SELECT favorite_list_id, share_token, name
       FROM favorite_lists
      WHERE user_id = $1
      ORDER BY favorite_list_id
      LIMIT 1`,
    [userId]
  );
  if (rows?.[0]) return rows[0];
  const ins = await pool.query(
    `INSERT INTO favorite_lists (user_id, name)
     VALUES ($1, $2)
     RETURNING favorite_list_id, share_token, name`,
    [userId, 'Favorites']
  );
  return ins.rows[0];
}

// Aseta tai poista share token tälle listalle
export async function setShareTokenForUser(userId, token) {
  // token === null -> poista
  if (token === null) {
    await pool.query(
      `UPDATE favorite_lists SET share_token = NULL WHERE user_id = $1`,
      [userId]
    );
    return { ok: true };
  }
  // Try to set a unique token. If a uniqueness conflict occurs, caller can retry
  // Here we attempt once; caller may generate a fresh token on conflict.
  try {
    await pool.query(
      `UPDATE favorite_lists SET share_token = $1 WHERE user_id = $2`,
      [token, userId]
    );
    return { ok: true, token };
  } catch (e) {
    // Rethrow so controller can handle retry logic; include original error
    throw e;
  }
}

// Hae lista julkisella tokenilla
export async function getFavoritesByShareToken(token) {
  // Etsi favorite_list_id käyttäen tokenia
  const { rows } = await pool.query(
    `SELECT fl.favorite_list_id, fl.user_id
       FROM favorite_lists fl
      WHERE fl.share_token = $1
      LIMIT 1`,
    [token]
  );
  if (!rows?.[0]) return null;
  const listId = rows[0].favorite_list_id;
  // Palauta movie_id:t samassa muodossa kuin getFavorites
  const { rows: movies } = await pool.query(
    `SELECT movie_id AS id FROM favorite_list_movies WHERE favorite_list_id = $1 ORDER BY movie_id DESC`,
    [listId]
  );
  return { listId, userId: rows[0].user_id, movies };
}

export async function addFavorite(userId, movieId) {
  // Yritä listapohjaista skeemaa; jos ei onnistu, fallback yksinkertaiseen.
  try {
    // varmista oletuslista
    const { rows: lists } = await pool.query(
      `SELECT favorite_list_id
         FROM favorite_lists
        WHERE user_id = $1
        ORDER BY favorite_list_id
        LIMIT 1`,
      [userId]
    );
    let listId = lists?.[0]?.favorite_list_id;
    if (!listId) {
      const ins = await pool.query(
        `INSERT INTO favorite_lists (user_id, name)
         VALUES ($1, $2)
         RETURNING favorite_list_id`,
        [userId, "Favorites"]
      );
      listId = ins.rows[0].favorite_list_id;
    }
    await pool.query(
      `INSERT INTO favorite_list_movies (favorite_list_id, movie_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [listId, movieId]
    );
    return { ok: true, movieId };
  } catch {
    await pool.query(
      `INSERT INTO favorites (user_id, movie_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, movie_id) DO NOTHING`,
      [userId, movieId]
    );
    return { ok: true, movieId };
  }
}

export async function removeFavorite(userId, movieId) {
  // Poista ensin listapohjaisesta; jos ei poistanut mitään, poista yksinkertaisesta.
  const delList = await pool.query(
    `DELETE FROM favorite_list_movies
      WHERE movie_id = $1
        AND favorite_list_id IN (
          SELECT favorite_list_id FROM favorite_lists WHERE user_id = $2
        )`,
    [String(movieId), userId]
  );
  if (delList.rowCount > 0) return true;

  await pool.query(
    `DELETE FROM favorites WHERE user_id = $1 AND movie_id = $2`,
    [userId, String(movieId)]
  );
  return true;
}

/* ------------------------------ REVIEWS ---------------------------------- */

export async function listMyReviews(userId) {
  const { rows } = await pool.query(
    `SELECT review_id AS id, movie_id, rating, text, created_at
       FROM reviews
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 200`,
    [userId]
  );
  return rows.map((r) => ({
    id: r.id,
    movie: { id: r.movie_id },
    rating: r.rating,
    text: r.text,
    createdAt: r.created_at,
  }));
}

export async function deleteMyReview(userId, reviewId) {
  const { rowCount } = await pool.query(
    `DELETE FROM reviews WHERE review_id = $1 AND user_id = $2`,
    [reviewId, userId]
  );
  return rowCount;
}

/* ------------------------------ HISTORY ---------------------------------- */

export async function listWatchHistory(userId) {
  try {
    const { rows } = await pool.query(
      `SELECT movie_id AS id, viewed_at
         FROM watch_history
        WHERE user_id = $1
        ORDER BY viewed_at DESC
        LIMIT 200`,
      [userId]
    );
    return rows.map((r) => ({ id: r.id, viewedAt: r.viewed_at }));
  } catch (e) {
    // kehitysympäristössä taulu voi puuttua
    const msg = String(e?.message || "");
    if (msg.includes("relation") && msg.includes("does not exist")) {
      return [];
    }
    throw e;
  }
}

/* ---------------------------- WATCH LATER -------------------------------- */

export async function listWatchLater(userId) {
  const { rows } = await pool.query(
    `SELECT movie_id AS id, created_at
       FROM watch_later
      WHERE user_id = $1
      ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

export async function addWatchLater(userId, movieId) {
  await pool.query(
    `INSERT INTO watch_later (user_id, movie_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, movie_id) DO NOTHING`,
    [userId, movieId]
  );
  return { ok: true, movieId };
}

export async function removeWatchLater(userId, movieId) {
  const { rowCount } = await pool.query(
    `DELETE FROM watch_later
      WHERE user_id = $1 AND movie_id = $2`,
    [userId, movieId]
  );
  return rowCount;
}
