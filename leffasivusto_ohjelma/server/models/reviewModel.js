// server/models/reviewModel.js
import pool from '../db.js';  // <-- tämä on korjaus

export async function upsert({ userId, movieId, rating, text }) {
  const q = `
    INSERT INTO reviews (user_id, movie_id, rating, text)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id, movie_id)
    DO UPDATE SET rating = EXCLUDED.rating, text = EXCLUDED.text, created_at = NOW()
    RETURNING review_id, user_id, movie_id, rating, text, created_at;
  `;
  const { rows } = await pool.query(q, [userId, movieId, rating, text]);
  return rows[0];
}

export async function getByMovie(movieId, { limit = 20, offset = 0 } = {}) {
  const q = `
    SELECT r.review_id, r.user_id, u.email AS user_email,
           r.movie_id, r.rating, r.text, r.created_at
    FROM reviews r
    JOIN users u ON u.user_id = r.user_id
    WHERE r.movie_id = $1
    ORDER BY r.created_at DESC
    LIMIT $2 OFFSET $3;
  `;
  const { rows } = await pool.query(q, [movieId, limit, offset]);
  return rows;
}

export async function getMine(userId) {
  const q = `
    SELECT review_id, movie_id, rating, text, created_at
    FROM reviews
    WHERE user_id = $1
    ORDER BY created_at DESC;
  `;
  const { rows } = await pool.query(q, [userId]);
  return rows;
}

export async function patch(reviewId, userId, { rating, text }) {
  const q = `
    UPDATE reviews
    SET rating = COALESCE($3, rating),
        text   = COALESCE($4, text),
        created_at = NOW()
    WHERE review_id = $1 AND user_id = $2
    RETURNING review_id, user_id, movie_id, rating, text, created_at;
  `;
  const { rows } = await pool.query(q, [reviewId, userId, rating ?? null, text ?? null]);
  return rows[0];
}

export async function remove(reviewId, userId) {
  const q = `DELETE FROM reviews WHERE review_id = $1 AND user_id = $2`;
  const { rowCount } = await pool.query(q, [reviewId, userId]);
  return rowCount > 0;
}

export async function summary(movieId) {
  const q = `
    SELECT COUNT(*)::int AS count, COALESCE(AVG(rating),0)::float AS avg
    FROM reviews WHERE movie_id = $1;
  `;
  const { rows } = await pool.query(q, [movieId]);
  return rows[0];
}
