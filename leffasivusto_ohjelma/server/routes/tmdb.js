// server/routes/tmdb.js
import { Router } from "express";
import tmdb from "../utils/tmdb.js";

const router = Router();

// GET /api/tmdb/trending
router.get("/trending", async (_req, res) => {
  try {
    const { data } = await tmdb.get("/trending/movie/day");
    res.json(data);
  } catch (err) {
    console.error("TMDB trending error:", err?.response?.data || err.message);
    res.status(502).json({ error: "Failed to fetch trending from TMDB" });
  }
});

// GET /api/tmdb/search?q=...&page=1 (multi)
router.get("/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const page = Number(req.query.page || 1);
    if (!q) return res.status(400).json({ error: "Query 'q' required" });

    const { data } = await tmdb.get("/search/multi", {
      params: {
        query: q,
        page,
        include_adult: false,
        language: "en-US",
      },
    });
    res.json(data);
  } catch (err) {
    console.error("TMDB search error:", err?.response?.data || err.message);
    res.status(502).json({ error: "Search failed" });
  }
});

// GET /api/tmdb/title/:type/:id (movie|tv)
router.get("/title/:type/:id", async (req, res) => {
  const { type, id } = req.params;
  if (!["movie", "tv"].includes(type)) return res.status(400).json({ error: "Bad type" });
  try {
    const [detail, credits] = await Promise.all([
      tmdb.get(`/${type}/${id}`),
      tmdb.get(`/${type}/${id}/credits`),
    ]);
    res.json({ detail: detail.data, credits: credits.data });
  } catch (err) {
    console.error("TMDB title details error:", err?.response?.data || err.message);
    res.status(502).json({ error: "Failed to fetch title details" });
  }
});

// GET /api/tmdb/person/:id
router.get("/person/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [person, credits] = await Promise.all([
      tmdb.get(`/person/${id}`),
      tmdb.get(`/person/${id}/combined_credits`),
    ]);
    res.json({ person: person.data, credits: credits.data });
  } catch (err) {
    console.error("TMDB person details error:", err?.response?.data || err.message);
    res.status(502).json({ error: "Failed to fetch person details" });
  }
});

// GET /api/tmdb/person/:id/credits
router.get("/person/:id/credits", async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = await tmdb.get(`/person/${id}/combined_credits`);
    res.json(data);
  } catch (err) {
    console.error("TMDB person credits error:", err?.response?.data || err.message);
    res.status(502).json({ error: "Failed to fetch person credits" });
  }
});

// GET /api/tmdb/discover?year=&minRating=&genres=&page=
router.get("/discover", async (req, res) => {
  try {
    const { year, minRating, genres, page = 1 } = req.query;

    const params = {
      sort_by: "popularity.desc",
      include_adult: false,
      include_video: false,
      page: Number(page),
      with_original_language: "en",
    };
    if (year) params.primary_release_year = Number(year);
    if (minRating) params["vote_average.gte"] = Number(minRating);
    if (genres) params.with_genres = String(genres);

    const { data } = await tmdb.get("/discover/movie", { params });
    res.json(data);
  } catch (err) {
    console.error("TMDB discover error:", err?.response?.data || err.message);
    res.status(502).json({ error: "Failed to fetch discover" });
  }
});

// GET /api/tmdb/title/:id  (alias: automaattinen movie -> tv fallback)
router.get("/title/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });

  // Apufunktio
  const fetchPack = (type) =>
    Promise.all([
      tmdb.get(`/${type}/${id}`),
      tmdb.get(`/${type}/${id}/credits`),
    ]);

  try {
    // 1) yritä movie
    const [detail, credits] = await fetchPack("movie");
    return res.json({ detail: detail.data, credits: credits.data });
  } catch (errMovie) {
    const status = errMovie?.response?.status;
    if (status && status !== 404) {
      console.error("TMDB movie error:", errMovie?.response?.data || errMovie.message);
      return res.status(502).json({ error: "Failed to fetch TMDB" });
    }
    // 2) fallback tv
    try {
      const [detail, credits] = await fetchPack("tv");
      return res.json({ detail: detail.data, credits: credits.data });
    } catch (errTv) {
      console.error("TMDB tv error:", errTv?.response?.data || errTv.message);
      return res.status(404).json({ error: "Not found" });
    }
  }
});






export default router;
