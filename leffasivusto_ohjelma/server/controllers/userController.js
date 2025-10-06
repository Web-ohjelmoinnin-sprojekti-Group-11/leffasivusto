// server/controllers/userController.js
import crypto from 'crypto';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  ensureFavoriteList,
  setShareTokenForUser,
  getFavoritesByShareToken,
  listMyReviews,
  deleteMyReview,
  listWatchHistory,
  listWatchLater,
  addWatchLater,
  removeWatchLater,
} from "../models/userModel.js";

/** Pieni util: URL-turvallinen token ilman 'base64url' koodekkia (toimii vanhoissakin Node-versioissa). */
function genUrlSafeToken(bytes = 16) {
  // Miksi: 'base64url' ei ole tuettu joissakin Node-versioissa -> aiheutti 500.
  return crypto
    .randomBytes(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

/** GET /api/user/favorites */
export async function getFavoritesCtrl(req, res) {
  try {
    const favorites = await getFavorites(req.user.user_id);
    return res.json({ favorites });
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

/** GET /api/user/favorites/share  -> { token|null } */
export async function getShareTokenCtrl(req, res) {
  try {
    const list = await ensureFavoriteList(req.user.user_id);
    return res.json({ token: list?.share_token || null });
  } catch (e) {
    console.error('GET /api/user/favorites/share', e);
    return res.status(500).json({ error: 'Failed to fetch share token' });
  }
}

/** POST /api/user/favorites/share  Body: { action: 'create'|'remove' } */
export async function manageShareTokenCtrl(req, res) {
  const action = req.body?.action;
  if (!['create', 'remove'].includes(action)) {
    return res.status(400).json({ error: "Invalid action" });
  }

  try {
    await ensureFavoriteList(req.user.user_id);

    if (action === 'remove') {
      await setShareTokenForUser(req.user.user_id, null);
      return res.status(200).json({ ok: true });
    }

    // action === 'create'
    for (let attempt = 0; attempt < 3; attempt++) {
      const token = genUrlSafeToken(16); // 22-merkkiä, URL-turvallinen
      try {
        await setShareTokenForUser(req.user.user_id, token);
        return res.status(201).json({ token });
      } catch (e) {
        const code = e?.code || e?.sqlState || null;
        if (code === '23505' && attempt < 2) continue; // unique_violation → uusi arpa
        throw e;
      }
    }
    return res.status(500).json({ error: 'Failed to create share token' });
  } catch (e) {
    console.error("POST /api/user/favorites/share", e);
    // Provide extra detail in development to help debugging the root cause.
    const detail = (e && (e.message || e.toString())) || 'unknown error'
    const code = e?.code || e?.sqlState || null
    return res.status(500).json({ error: "Failed to manage share token", detail, code });
  }
}

/** Public GET /api/share/:token  -> { movies, ownerUserId } */
export async function getFavoritesByTokenCtrl(req, res) {
  const token = req.params.token;
  try {
    const data = await getFavoritesByShareToken(token);
    if (!data) return res.status(404).json({ error: 'Not found' });
    return res.json({ movies: data.movies, ownerUserId: data.userId });
  } catch (e) {
    console.error('GET /api/share/:token', e);
    return res.status(500).json({ error: 'Failed to load shared favorites' });
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
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    await deleteMyReview(req.user.user_id, id);
    return res.status(204).end();
  } catch (e) {
    console.error("DELETE /api/user/reviews/:id", e);
    return res.status(500).json({ error: "Failed to delete review" });
  }
}

/** GET /api/user/history */
export async function listHistoryCtrl(req, res) {
  try {
    const data = await listWatchHistory(req.user.user_id);
    return res.json(data);
  } catch (e) {
    console.error("GET /api/user/history", e);
    return res.status(500).json({ error: "Failed to load history" });
  }
}

/** GET /api/user/watch-later */
export async function listWatchLaterCtrl(req, res) {
  try {
    const data = await listWatchLater(req.user.user_id);
    return res.json(data);
  } catch (e) {
    console.error("GET /api/user/watch-later", e);
    return res.status(500).json({ error: "Failed to load watch later" });
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
