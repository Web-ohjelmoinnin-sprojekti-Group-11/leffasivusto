// FILE: server/routes/user.js
import express from "express";
import pool from "../db.js";
import { verifyJWT } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

/**
 * GET /api/user/favorites
 * Returns user's favorite movie ids as a list.
 * NOTE: Adjust SELECT to your schema if needed.
 */
router.get("/favorites", async (req, res) => {
  try {
    // Try list-based schema first
    try {
      const { rows } = await pool.query(
        `SELECT flm.movie_id AS id
           FROM favorite_list_movies flm
           JOIN favorite_lists fl ON flm.favorite_list_id = fl.favorite_list_id
          WHERE fl.user_id = $1
          GROUP BY flm.movie_id
          ORDER BY MAX(flm.movie_id) DESC`,
        [req.user.user_id]
      );
      return res.json(rows);
    } catch {
      // Fallback: simple favorites table
      const { rows } = await pool.query(
        `SELECT movie_id AS id
           FROM favorites
          WHERE user_id = $1
          ORDER BY created_at DESC NULLS LAST`,
        [req.user.user_id]
      );
      return res.json(rows);
    }
  } catch (e) {
    console.error("GET /api/user/favorites", e);
    return res.status(500).json({ error: "Failed to load favorites" });
  }
});

/**
 * POST /api/user/favorites
 * Adds a movie to user's favorites (idempotent).
 * Body: { movieId }
 */
router.post("/favorites", async (req, res) => {
  const movieId = Number(req.body?.movieId);
  if (!Number.isFinite(movieId)) {
    return res.status(400).json({ error: "Invalid movie id" });
  }
  try {
    // Prefer list-based schema (if present)
    try {
      // Ensure a default favorites list exists for this user
      const { rows: lists } = await pool.query(
        `SELECT favorite_list_id
           FROM favorite_lists
          WHERE user_id = $1
          ORDER BY favorite_list_id
          LIMIT 1`,
        [req.user.user_id]
      );

      let listId = lists?.[0]?.favorite_list_id;
      if (!listId) {
        const ins = await pool.query(
          `INSERT INTO favorite_lists (user_id, name)
           VALUES ($1, $2)
           RETURNING favorite_list_id`,
          [req.user.user_id, "Favorites"]
        );
        listId = ins.rows[0].favorite_list_id;
      }

      await pool.query(
        `INSERT INTO favorite_list_movies (favorite_list_id, movie_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [listId, movieId]
      );

      return res.status(201).json({ ok: true, movieId });
    } catch {
      // Fallback: simple favorites table
      await pool.query(
        `INSERT INTO favorites (user_id, movie_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, movie_id) DO NOTHING`,
        [req.user.user_id, movieId]
      );
      return res.status(201).json({ ok: true, movieId });
    }
  } catch (e) {
    console.error("POST /api/user/favorites", e);
    return res.status(500).json({ error: "Failed to add favorite" });
  }
});

/**
 * DELETE /api/user/favorites/:movieId
 * Removes a movie from user's favorites (list-agnostic).
 */
router.delete("/favorites/:movieId", async (req, res) => {
  const movieId = String(req.params.movieId);
  try {
    // Try list-based schema
    const delList = await pool.query(
      `DELETE FROM favorite_list_movies
        WHERE movie_id = $1
          AND favorite_list_id IN (
            SELECT favorite_list_id FROM favorite_lists WHERE user_id = $2
          )`,
      [movieId, req.user.user_id]
    );
    if (delList.rowCount > 0) return res.status(204).end();

    // Fallback: simple favorites table
    await pool.query(
      `DELETE FROM favorites WHERE user_id = $1 AND movie_id = $2`,
      [req.user.user_id, movieId]
    );
    return res.status(204).end();
  } catch (e) {
    console.error("DELETE /api/user/favorites/:movieId", e);
    return res.status(500).json({ error: "Failed to remove favorite" });
  }
});

/**
 * GET /api/user/reviews
 */
router.get("/reviews", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT review_id AS id, movie_id, rating, text, created_at
         FROM reviews
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 200`,
      [req.user.user_id]
    );
    const data = rows.map((r) => ({
      id: r.id,
      movie: { id: r.movie_id },
      rating: r.rating,
      text: r.text,
      createdAt: r.created_at,
    }));
    return res.json(data);
  } catch (e) {
    console.error("GET /api/user/reviews", e);
    return res.status(500).json({ error: "Failed to load reviews" });
  }
});

/**
 * DELETE /api/user/reviews/:id
 */
router.delete("/reviews/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid review id" });
  }
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM reviews WHERE review_id = $1 AND user_id = $2`,
      [id, req.user.user_id]
    );
    if (!rowCount) return res.status(404).json({ error: "Review not found" });
    return res.status(204).end();
  } catch (e) {
    console.error("DELETE /api/user/reviews/:id", e);
    return res.status(500).json({ error: "Failed to delete review" });
  }
});

/**
 * GET /api/user/history
 * Returns watch history. If table is missing, returns empty list.
 */
router.get("/history", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT movie_id AS id, viewed_at
         FROM watch_history
        WHERE user_id = $1
        ORDER BY viewed_at DESC
        LIMIT 200`,
      [req.user.user_id]
    );
    return res.json(rows.map((r) => ({ id: r.id, viewedAt: r.viewed_at })));
  } catch (e) {
    // In dev env the table may not exist — don't crash UI
    if (
      String(e?.message || "").includes("relation") &&
      String(e?.message || "").includes("does not exist")
    ) {
      return res.json([]);
    }
    console.error("GET /api/user/history", e);
    return res.status(500).json({ error: "Failed to load history" });
  }
});

export default router;
