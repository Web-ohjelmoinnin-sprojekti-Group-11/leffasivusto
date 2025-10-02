// server/routes/tmdb.js
import { Router } from "express";
import tmdb from "../utils/tmdb.js";

const router = Router();

// ---------------------------------------------------------------------------
// Yleisreitit (trending, search, discover, title, person)
// ---------------------------------------------------------------------------

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
        // language asetetaan utils/tmdb.js:ssä
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

// ---------------------------------------------------------------------------
// RANDOM PICKER  /api/tmdb/picker?kw=word1,word2&decade=1990
// decade = vuosikymmenen aloitusvuosi (esim. 1990 → 1990..1999)
// ---------------------------------------------------------------------------

// --- UPDATED RANDOM PICKER --------------------------------------------------
// GET /api/tmdb/picker?kw=word&genre=878&decade=1990
// - kw      : vapaaehtoinen vapaatekstinen keyword (mapataan TMDB keyword-ID:ksi)
// - genre   : vapaaehtoinen TMDB genre id (with_genres)
// - decade  : pakollinen aloitusvuosi (1990 -> 1990..1999)

async function getKeywordId(word) {
  if (!word) return null;
  const { data } = await tmdb.get("/search/keyword", { params: { query: word } });
  return data?.results?.[0]?.id || null;
}

async function discoverWithFilters({ keywordId, genreId, decadeFrom, decadeTo, page = 1 }) {
  const params = {
    include_adult: false,
    sort_by: "popularity.desc",
    page,
    // lisärajauksia, jotta roska vähenee:
    "vote_count.gte": 50,              // vaadi hieman ääniä
    with_original_language: "en",      // pitää sisällön länsimaisena (voit poistaa jos haluat laajemman)
  };
  if (keywordId) params.with_keywords = String(keywordId);
  if (genreId)   params.with_genres   = String(genreId);
  if (decadeFrom) params["primary_release_date.gte"] = `${decadeFrom}-01-01`;
  if (decadeTo)   params["primary_release_date.lte"] = `${decadeTo}-12-31`;

  const { data } = await tmdb.get("/discover/movie", { params });
  return data;
}

function pickRandom(arr) {
  if (!arr?.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function normalize(movie) {
  const posterUrl = movie?.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;
  return {
    id: movie.id,
    title: movie.title || movie.name,
    overview: movie.overview,
    releaseDate: movie.release_date || movie.first_air_date,
    posterUrl,
    vote: movie.vote_average ?? movie.vote,
  };
}

router.get("/picker", async (req, res) => {
  try {
    const kw      = (req.query.kw || "").toString().trim();
    const genreId = req.query.genre ? Number(req.query.genre) : null;
    const decade  = Number(req.query.decade || "");
    const decadeFrom = Number.isFinite(decade) ? decade : null;
    const decadeTo   = Number.isFinite(decade) ? decade + 9 : null;

    if (!kw && !genreId && !decadeFrom) {
      return res.status(400).json({ error: "Provide at least a keyword, genre or decade." });
    }

    // 1) mapataan keyword ID:ksi (jos annettu)
    const keywordId = kw ? await getKeywordId(kw) : null;

    // 2) Yritetään parhaasta suppeimpaan:
    //    [kw+genre+decade] -> [kw+decade] -> [genre+decade] -> [decade] -> [kw]
    const attempts = [
      { keywordId, genreId, decadeFrom, decadeTo },
      { keywordId, genreId: null, decadeFrom, decadeTo },
      { keywordId: null, genreId, decadeFrom, decadeTo },
      { keywordId: null, genreId: null, decadeFrom, decadeTo },
      { keywordId, genreId: null, decadeFrom: null, decadeTo: null },
    ].filter(Boolean);

    let chosen = null;
    for (const a of attempts) {
      const first = await discoverWithFilters({ ...a, page: 1 });
      if (!first?.total_results) continue;

      const maxPages = Math.min(first.total_pages || 1, 10);
      const randomPage = Math.max(1, Math.floor(Math.random() * maxPages) + 1);
      const pageData = randomPage === 1 ? first : await discoverWithFilters({ ...a, page: randomPage });
      chosen = pickRandom(pageData.results);
      if (chosen) break;
    }

    if (!chosen) return res.status(404).json({ error: "No movie found matching your criteria." });
    return res.json(normalize(chosen));
  } catch (err) {
    console.error("TMDB picker error:", err?.response?.data || err.message);
    return res.status(502).json({ error: "Picker failed" });
  }
});


export default router;
