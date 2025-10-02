// server/controllers/groupContentController.js
import pool from "../db.js";
import {
  isMember,
  existsMovieInGroup,
  insertReview,
  insertGroupContent,
  getEmailByUserId,
  listGroupMovies,
} from "../models/groupContentModel.js";

/** POST /api/group_content/:groupId/movies
 * Body: { movie_id: number, review_text?: string, rating?: number }
 * Vain jäsenille. Idempotentti samalle leffalle. Transaktio. */
export async function addMovieToGroup(req, res) {
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
    const member = await isMember({ userId, groupId });
    if (!member) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    // 2) duplicate
    const already = await existsMovieInGroup({ groupId, movieId: movie_id });
    if (already) {
      await client.query("COMMIT");
      return res.status(200).json({ message: "Movie already in group" });
    }

    // 3) optional review
    let reviewId = null;
    const hasReview = Boolean(review_text) || typeof rating !== "undefined";
    if (hasReview) {
      reviewId = await insertReview({
        userId,
        movieId: movie_id,
        reviewText: review_text,
        rating,
      }, client);
    }

    // 4) content row
    const contentRow = await insertGroupContent({
      groupId,
      userId,
      reviewId,
      movieId: movie_id,
    }, client);

    const addedBy = (await getEmailByUserId(userId, client)) || userId;

    await client.query("COMMIT");
    return res.status(201).json({
      message: "Movie added to group",
      content: { ...contentRow, added_by: addedBy },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Add movie error:", err);
    return res.status(500).json({ error: "Failed to add movie to group" });
  } finally {
    client.release();
  }
}

/** GET /api/group_content/:groupId/movies */
export async function getGroupMovies(req, res) {
  const { groupId } = req.params;
  const userId = req.user.user_id;

  try {
    // näkyy vain jäsenille (myös pending oli aiemmin sallittu? alkuperäinen vaati vain membershipin ilman roolisuodatusta)
    const memberOk = await isMember({ userId, groupId });
    if (!memberOk) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const items = await listGroupMovies({ groupId });
    return res.json({ movies: items });
  } catch (err) {
    console.error("Fetch group movies error:", err);
    return res.status(500).json({ error: "Failed to fetch group movies" });
  }
}
