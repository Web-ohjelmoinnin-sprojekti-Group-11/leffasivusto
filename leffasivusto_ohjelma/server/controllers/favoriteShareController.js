// server/controllers/favoriteShareController.js
import {
  getShareToken,
  createUniqueShareToken,
  removeShareToken,
  findListByToken,
  getFavoriteMoviesByListId,
} from "../models/favoritesModel.js";

/** GET /api/user/favorites/share (auth) */
export async function getShare(req, res) {
  try {
    const token = await getShareToken(req.user.user_id);
    res.json({ token: token || null });
  } catch (e) {
    console.error("getShare error:", e);
    res.status(500).json({ error: "Server error" });
  }
}

/** POST /api/user/favorites/share  body: { action: 'create' | 'remove' } (auth) */
export async function manageShare(req, res) {
  const action = String(req.body?.action || "create").toLowerCase();
  try {
    if (action === "remove") {
      await removeShareToken(req.user.user_id);
      return res.json({ ok: true, token: null });
    }

    // create -> idempotentti
    const existing = await getShareToken(req.user.user_id);
    if (existing) return res.json({ ok: true, token: existing });

    const token = await createUniqueShareToken(req.user.user_id);
    return res.json({ ok: true, token });
  } catch (e) {
    if (e?.code === "23505") {
      // varmuuden vuoksi lähetetään hiukan tarkempi virhe
      return res.status(500).json({
        error: "Failed to manage share token",
        detail: e.detail,
        code: e.code,
      });
    }
    console.error("manageShare error:", e);
    res.status(500).json({ error: "Failed to manage share token" });
  }
}

/** GET /api/share/:token  (public) */
export async function viewSharedFavorites(req, res) {
  const token = req.params?.token;
  if (!token) return res.status(400).json({ error: "Missing token" });

  try {
    const list = await findListByToken(token);
    if (!list) return res.status(404).json({ error: "Not found" });

    // palautetaan pelkät TMDB-id:t (stringeina) – näin myös favoritesModel tekee
    const movies = await getFavoriteMoviesByListId(list.favorite_list_id);
    return res.json({
      favorite_list_id: list.favorite_list_id,
      owner_user_id: list.user_id,
      movies, // esim. ["1054867","911430",...]
    });
  } catch (e) {
    console.error("viewSharedFavorites error:", e);
    res.status(500).json({ error: "Server error" });
  }
}
