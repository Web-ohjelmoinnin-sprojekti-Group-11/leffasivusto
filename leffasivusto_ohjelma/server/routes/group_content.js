import express from "express";
import pool from "../db.js";
import { verifyJWT } from "../middleware/auth.js";

const router = express.Router();

/* -------------------- Lisää elokuva ryhmälle -------------------- */
router.post("/:groupId/movies", verifyJWT, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.user_id;
  const { movie_id, review_text, rating } = req.body; 

  try {
    // Lisää mahdollinen arvostelu ensin reviews-tauluun
    let reviewId = null;
    if (review_text || rating) {
      const { rows } = await pool.query(
        `INSERT INTO reviews (user_id, movie_id, text, rating)
         VALUES ($1, $2, $3, $4)
         RETURNING review_id`,
        [userId, movie_id, review_text || null, rating || null]
      );
      reviewId = rows[0].review_id;
    }

    // Lisää elokuva ryhmän sisältöön
    const { rows: contentRows } = await pool.query(
      `INSERT INTO group_content (group_id, user_id, review_id, text)
       VALUES ($1, $2, $3, $4)
       RETURNING content_id, group_id, user_id, review_id, text`,
      [groupId, userId, reviewId, `Elokuva lisätty: ${movie_id}`]
    );

    res.status(201).json({ message: "Elokuva lisätty ryhmälle", content: contentRows[0] });
  } catch (err) {
    console.error("Add movie error:", err);
    res.status(500).json({ error: "Elokuvan lisäys epäonnistui" });
  }
});

/* -------------------- Hae ryhmän elokuvat ja arvostelut -------------------- */
router.get("/:groupId/movies", verifyJWT, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.user_id;

  try {
    // Tarkista, että käyttäjä on ryhmän jäsen
    const { rows: membership } = await pool.query(
      `SELECT 1 FROM group_members WHERE user_id=$1 AND group_id=$2`,
      [userId, groupId]
    );
    if (!membership.length) return res.status(403).json({ error: "Et ole ryhmän jäsen" });

    // Ryhmän sisältö
    const { rows: content } = await pool.query(
      `SELECT gc.content_id, gc.text AS added_text,
              r.review_id, r.text AS review_text, r.rating, r.movie_id, u.email AS added_by
       FROM group_content gc
       LEFT JOIN reviews r ON gc.review_id = r.review_id
       LEFT JOIN users u ON gc.user_id = u.user_id
       WHERE gc.group_id=$1
       ORDER BY gc.content_id DESC`,
      [groupId]
    );

    res.json({ movies: content });
  } catch (err) {
    console.error("Fetch group movies error:", err);
    res.status(500).json({ error: "Ryhmän elokuvien haku epäonnistui" });
  }
});

export default router;
