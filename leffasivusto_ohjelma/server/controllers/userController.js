// server/controllers/userController.js
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  listMyReviews,
  deleteMyReview,
  listWatchHistory,
  listWatchLater,
  addWatchLater,
  removeWatchLater,
} from "../models/userModel.js";

/* Kaikki reitit vaativat verifyJWT reitissä */

/** GET /api/user/favorites */
export async function getFavoritesCtrl(req, res) {
  try {
    const rows = await getFavorites(req.user.user_id);
    return res.json(rows);
  } catch (e) {
    console.error("GET /api/user/favorites", e);
    return res.status(500).json({ error: "Failed to load favorites" });
  }
}

/** POST /api/user/favorites  Body: { movieId } */
export async function addFavoriteCtrl(req, res) {
  const movieId = Number(req.body?.movieId);
  if (!Number.isFinite(movieId)) {
    return res.status(400).json({ error: "Invalid movie id" });
  }
  try {
    const result = await addFavorite(req.user.user_id, movieId);
    return res.status(201).json(result);
  } catch (e) {
    console.error("POST /api/user/favorites", e);
    return res.status(500).json({ error: "Failed to add favorite" });
  }
}

/** DELETE /api/user/favorites/:movieId */
export async function removeFavoriteCtrl(req, res) {
  const movieId = String(req.params.movieId);
  try {
    await removeFavorite(req.user.user_id, movieId);
    return res.status(204).end();
  } catch (e) {
    console.error("DELETE /api/user/favorites/:movieId", e);
    return res.status(500).json({ error: "Failed to remove favorite" });
  }
}

/** GET /api/user/reviews */
export async function listMyReviewsCtrl(req, res) {
  try {
    const data = await listMyReviews(req.user.user_id);
    return res.json(data);
  } catch (e) {
    console.error("GET /api/user/reviews", e);
    return res.status(500).json({ error: "Failed to load reviews" });
  }
}

/** DELETE /api/user/reviews/:id */
export async function deleteMyReviewCtrl(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid review id" });
  }
  try {
    const n = await deleteMyReview(req.user.user_id, id);
    if (!n) return res.status(404).json({ error: "Review not found" });
    return res.status(204).end();
  } catch (e) {
    console.error("DELETE /api/user/reviews/:id", e);
    return res.status(500).json({ error: "Failed to delete review" });
  }
}

/** GET /api/user/history */
export async function listHistoryCtrl(req, res) {
  try {
    const rows = await listWatchHistory(req.user.user_id);
    return res.json(rows);
  } catch (e) {
    console.error("GET /api/user/history", e);
    return res.status(500).json({ error: "Failed to load history" });
  }
}

/** GET /api/user/watch-later */
export async function listWatchLaterCtrl(req, res) {
  try {
    const rows = await listWatchLater(req.user.user_id);
    return res.json(rows);
  } catch (e) {
    console.error("GET /api/user/watch-later", e);
    return res.status(500).json({ error: "Failed to load watch later list" });
  }
}

/** POST /api/user/watch-later  Body: { movieId } */
export async function addWatchLaterCtrl(req, res) {
  const movieId = Number(req.body?.movieId);
  if (!Number.isFinite(movieId)) {
    return res.status(400).json({ error: "Invalid movie id" });
  }
  try {
    const result = await addWatchLater(req.user.user_id, movieId);
    return res.status(201).json(result);
  } catch (e) {
    console.error("POST /api/user/watch-later", e);
    return res.status(500).json({ error: "Failed to add movie to watch later" });
  }
}

/** DELETE /api/user/watch-later/:movieId */
export async function removeWatchLaterCtrl(req, res) {
  const movieId = Number(req.params.movieId);
  if (!Number.isFinite(movieId)) {
    return res.status(400).json({ error: "Invalid movie id" });
  }
  try {
    const n = await removeWatchLater(req.user.user_id, movieId);
    if (!n) return res.status(404).json({ error: "Movie not found in watch later" });
    return res.status(204).end();
  } catch (e) {
    console.error("DELETE /api/user/watch-later/:movieId", e);
    return res.status(500).json({ error: "Failed to remove movie from watch later" });
  }
}
