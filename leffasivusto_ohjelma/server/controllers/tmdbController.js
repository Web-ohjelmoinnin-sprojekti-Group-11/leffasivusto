// server/controllers/tmdbController.js
import {
  fetchTrendingMoviesDay,
  searchMulti,
  fetchTitleDetail,
  fetchTitleCredits,
  fetchPerson,
  fetchPersonCombinedCredits,
  discoverMovies,
  searchKeywordId,
  discoverWithFilters,
} from "../models/tmdbModel.js";

/** GET /api/tmdb/trending */
export async function trending(_req, res) {
  try {
    const data = await fetchTrendingMoviesDay();
    res.json(data);
  } catch (err) {
    console.error("TMDB trending error:", err?.response?.data || err.message);
    res.status(502).json({ error: "Failed to fetch trending from TMDB" });
  }
}

/** GET /api/tmdb/search?q=...&page=1 (multi) */
export async function search(req, res) {
  try {
    const q = (req.query.q || "").trim();
    const page = Number(req.query.page || 1);
    if (!q) return res.status(400).json({ error: "Query 'q' required" });
    const data = await searchMulti({ q, page });
    res.json(data);
  } catch (err) {
    console.error("TMDB search error:", err?.response?.data || err.message);
    res.status(502).json({ error: "Search failed" });
  }
}

/** GET /api/tmdb/title/:type/:id (movie|tv) */
export async function titleByType(req, res) {
  const { type, id } = req.params;
  if (!["movie", "tv"].includes(type)) return res.status(400).json({ error: "Bad type" });
  try {
    const [detail, credits] = await Promise.all([
      fetchTitleDetail(type, id),
      fetchTitleCredits(type, id),
    ]);
    res.json({ detail, credits });
  } catch (err) {
    console.error("TMDB title details error:", err?.response?.data || err.message);
    res.status(502).json({ error: "Failed to fetch title details" });
  }
}

/** GET /api/tmdb/person/:id */
export async function person(req, res) {
  const { id } = req.params;
  try {
    const [p, cr] = await Promise.all([fetchPerson(id), fetchPersonCombinedCredits(id)]);
    res.json({ person: p, credits: cr });
  } catch (err) {
    console.error("TMDB person details error:", err?.response?.data || err.message);
    res.status(502).json({ error: "Failed to fetch person details" });
  }
}

/** GET /api/tmdb/person/:id/credits */
export async function personCredits(req, res) {
  try {
    const { id } = req.params;
    const data = await fetchPersonCombinedCredits(id);
    res.json(data);
  } catch (err) {
    console.error("TMDB person credits error:", err?.response?.data || err.message);
    res.status(502).json({ error: "Failed to fetch person credits" });
  }
}

/** GET /api/tmdb/discover?year=&minRating=&genres=&page= */
export async function discover(req, res) {
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

    const data = await discoverMovies(params);
    res.json(data);
  } catch (err) {
    console.error("TMDB discover error:", err?.response?.data || err.message);
    res.status(502).json({ error: "Failed to fetch discover" });
  }
}

/** GET /api/tmdb/title/:id (movie -> tv fallback) */
export async function titleAuto(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });

  try {
    const [detail, credits] = await Promise.all([
      fetchTitleDetail("movie", id),
      fetchTitleCredits("movie", id),
    ]);
    return res.json({ detail, credits });
  } catch (errMovie) {
    const status = errMovie?.response?.status;
    if (status && status !== 404) {
      console.error("TMDB movie error:", errMovie?.response?.data || errMovie.message);
      return res.status(502).json({ error: "Failed to fetch TMDB" });
    }
    try {
      const [detail, credits] = await Promise.all([
        fetchTitleDetail("tv", id),
        fetchTitleCredits("tv", id),
      ]);
      return res.json({ detail, credits });
    } catch (errTv) {
      console.error("TMDB tv error:", errTv?.response?.data || errTv.message);
      return res.status(404).json({ error: "Not found" });
    }
  }
}

/** RANDOM PICKER  GET /api/tmdb/picker?kw=&genre=&decade= */
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
function pickRandom(arr) {
  if (!arr?.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function picker(req, res) {
  try {
    const kw = (req.query.kw || "").toString().trim();
    const genreId = req.query.genre ? Number(req.query.genre) : null;
    const decade = Number(req.query.decade || "");
    const decadeFrom = Number.isFinite(decade) ? decade : null;
    const decadeTo = Number.isFinite(decade) ? decade + 9 : null;

    if (!kw && !genreId && !decadeFrom) {
      return res.status(400).json({ error: "Provide at least a keyword, genre or decade." });
    }

    const keywordId = kw ? await searchKeywordId(kw) : null;

    const attempts = [
      { keywordId, genreId, decadeFrom, decadeTo },
      { keywordId, genreId: null, decadeFrom, decadeTo },
      { keywordId: null, genreId, decadeFrom, decadeTo },
      { keywordId: null, genreId: null, decadeFrom, decadeTo },
      { keywordId, genreId: null, decadeFrom: null, decadeTo: null },
    ];

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
}
