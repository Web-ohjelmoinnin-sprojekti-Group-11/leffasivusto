// server/routes/group_content.js
import express from "express";
import pool from "../db.js";
import { verifyJWT } from "../middleware/auth.js";

const router = express.Router();

/**
 * POST /api/group_content/:groupId/movies
 * Body: { movie_id: number, review_text?: string, rating?: number }
 * Only members (admin/member). Idempotent for same movie in the same group.
 * Runs as a DB transaction.
 */
router.post("/:groupId/movies", verifyJWT, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.user_id;
  const { movie_id, review_text, rating } = req.body || {};

  if (!movie_id) {
    return res.status(400).json({ error: "movie_id is required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1) membership
    const me = await client.query(
      `SELECT 1 FROM group_members WHERE user_id=$1 AND group_id=$2 AND role IN ('admin','member')`,
      [userId, groupId]
    );
    if (!me.rowCount) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    // 2) duplicate
    const exists = await client.query(
      `SELECT content_id FROM group_content 
       WHERE group_id=$1 AND review_id IS NULL AND text=$2`,
      [groupId, String(movie_id)]
    );
    if (exists.rowCount) {
      await client.query("COMMIT");
      return res.status(200).json({ message: "Movie already in group" });
    }

    // 3) optional review
    let reviewId = null;
    if (review_text || typeof rating !== "undefined") {
      const r = await client.query(
        `INSERT INTO reviews (user_id, movie_id, text, rating)
         VALUES ($1, $2, $3, $4)
         RETURNING review_id`,
        [userId, movie_id, review_text || null, rating ?? null]
      );
      reviewId = r.rows[0].review_id;
    }

    // 4) content row
    const { rows: contentRows } = await client.query(
      reviewId
        ? `INSERT INTO group_content (group_id, user_id, review_id, text)
           VALUES ($1, $2, $3, $4)
           RETURNING content_id, group_id, user_id, review_id, text`
        : `INSERT INTO group_content (group_id, user_id, text)
           VALUES ($1, $2, $3)
           RETURNING content_id, group_id, user_id, review_id, text`,
      reviewId
        ? [groupId, userId, reviewId, String(movie_id)]
        : [groupId, userId, String(movie_id)]
    );

    const addedBy = await client.query(
      `SELECT email FROM users WHERE user_id=$1`,
      [userId]
    );

    await client.query("COMMIT");
    return res.status(201).json({
      message: "Movie added to group",
      content: { ...contentRows[0], added_by: addedBy.rows[0]?.email || userId },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Add movie error:", err);
    return res.status(500).json({ error: "Failed to add movie to group" });
  } finally {
    client.release();
  }
});

/**
 * GET /api/group_content/:groupId/movies
 * Returns group's “content” where movie_id is stored in text, or in linked review row.
 */
router.get("/:groupId/movies", verifyJWT, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.user_id;

  try {
    // must be a member
    const me = await pool.query(
      `SELECT 1 FROM group_members WHERE user_id=$1 AND group_id=$2`,
      [userId, groupId]
    );
    if (!me.rowCount) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

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

    const items = rows.map(r => ({
      content_id: r.content_id,
      movie_id: Number(r.review_movie_id ?? r.movie_id_text),
      added_by: r.added_by,
      rating: r.rating ?? null,
      review_text: r.review_text ?? null,
    }));

    return res.json({ movies: items });
  } catch (err) {
    console.error("Fetch group movies error:", err);
    return res.status(500).json({ error: "Failed to fetch group movies" });
  }
});

export default router;
