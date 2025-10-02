// server/models/groupContentModel.js
import pool from "../db.js";

/** Onko käyttäjä ryhmän jäsen (admin/member)? */
export async function isMember({ userId, groupId }) {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM group_members WHERE user_id=$1 AND group_id=$2 AND role IN ('admin','member')`,
    [userId, groupId]
  );
  return rowCount > 0;
}

/** Onko leffa jo lisätty ryhmään (idempotentti tarkistus)? */
export async function existsMovieInGroup({ groupId, movieId }) {
  const exists = await pool.query(
    `SELECT content_id FROM group_content 
     WHERE group_id=$1 AND review_id IS NULL AND text=$2`,
    [groupId, String(movieId)]
  );
  return exists.rowCount > 0;
}

/** Lisää arvostelu (valinnainen) ja palauta review_id. */
export async function insertReview({ userId, movieId, reviewText, rating }, client) {
  const r = await client.query(
    `INSERT INTO reviews (user_id, movie_id, text, rating)
     VALUES ($1, $2, $3, $4)
     RETURNING review_id`,
    [userId, movieId, reviewText || null, rating ?? null]
  );
  return r.rows[0].review_id;
}

/** Lisää group_content-rivi ja palauta se. */
export async function insertGroupContent({ groupId, userId, reviewId, movieId }, client) {
  const q = reviewId
    ? `INSERT INTO group_content (group_id, user_id, review_id, text)
       VALUES ($1, $2, $3, $4)
       RETURNING content_id, group_id, user_id, review_id, text`
    : `INSERT INTO group_content (group_id, user_id, text)
       VALUES ($1, $2, $3)
       RETURNING content_id, group_id, user_id, review_id, text`;

  const params = reviewId
    ? [groupId, userId, reviewId, String(movieId)]
    : [groupId, userId, String(movieId)];

  const { rows } = await client.query(q, params);
  return rows[0];
}

/** Hakee lisänneen käyttäjän emailin (näytettäväksi "added_by"). */
export async function getEmailByUserId(userId, clientOrPool = pool) {
  const { rows } = await (clientOrPool.query
    ? clientOrPool.query(`SELECT email FROM users WHERE user_id=$1`, [userId])
    : pool.query(`SELECT email FROM users WHERE user_id=$1`, [userId]));
  return rows[0]?.email ?? null;
}

/** Listaa ryhmän elokuvat (movie_id joko text-kentässä tai review-linkissä). */
export async function listGroupMovies({ groupId }) {
  const { rows } = await pool.query(
    `SELECT gc.content_id,
            gc.text AS movie_id_text,
            gc.review_id,
            u.email AS added_by,
            r.rating,
            r.text  AS review_text,
            r.movie_id AS review_movie_id
     FROM group_content gc
     LEFT JOIN reviews r ON r.review_id = gc.review_id
     JOIN users u ON u.user_id = gc.user_id
     WHERE gc.group_id=$1
     ORDER BY gc.content_id DESC`,
    [groupId]
  );

  return rows.map((r) => ({
    content_id: r.content_id,
    movie_id: Number(r.review_movie_id ?? r.movie_id_text),
    added_by: r.added_by,
    rating: r.rating ?? null,
    review_text: r.review_text ?? null,
  }));
}
