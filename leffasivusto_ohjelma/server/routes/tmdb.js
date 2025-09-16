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

// GET /api/tmdb/search?q=...&page=1  (multi: movie+tv+person)
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
        language: "en-US", // halutessa "en-US"
      },
    });

    res.json(data);
  } catch (err) {
    console.error("TMDB search error:", err?.response?.data || err.message);
    res.status(502).json({ error: "Search failed" });
  }
});

export default router;
