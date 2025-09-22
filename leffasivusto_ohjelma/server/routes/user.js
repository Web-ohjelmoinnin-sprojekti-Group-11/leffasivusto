// FILE: server/routes/user.js
import express from "express";
import pool from "../db.js";
import { verifyJWT } from "../middleware/auth.js";

const router = express.Router();

// Miksi: kaikki alla olevat reitit vaativat kirjautumisen
router.use(verifyJWT);

/**
 * GET /api/user/favorites
 * Palauttaa käyttäjän suosikki-elokuvien id:t listana.
 * HUOM: Vaihda SELECT vastaamaan teidän skeemaa, tämä toimii sekä
 * - yhdellä favorites-taululla (user_id, movie_id)
 * - että listojen kautta (favorite_lists + favorite_list_movies)
 */
router.get("/favorites", async (req, res) => {
  try {
    // Yritä listapohjaista skeemaa ensin
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
      // Fallback: yksinkertainen favorites-taulu
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
 * DELETE /api/user/favorites/:movieId
 * Poistaa elokuvan käyttäjän suosikeista (riippumatta listasta).
 */
router.delete("/favorites/:movieId", async (req, res) => {
  const movieId = String(req.params.movieId);
  try {
    // Yritä listapohjaista skeemaa
    const delList = await pool.query(
      `DELETE FROM favorite_list_movies
        WHERE movie_id = $1
          AND favorite_list_id IN (
            SELECT favorite_list_id FROM favorite_lists WHERE user_id = $2
          )`,
      [movieId, req.user.user_id]
    );
    if (delList.rowCount > 0) return res.status(204).end();

    // Fallback: yksinkertainen favorites-taulu
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
 * Palauttaa käyttäjän arvostelut; kentät yhteenmukaiset frontin kanssa.
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
 * Palauttaa katseluhistorian. Jos taulu puuttuu, palautetaan tyhjä lista.
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
    // Miksi: kehitysympäristössä taulu voi puuttua → älä kaada UI:ta
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
