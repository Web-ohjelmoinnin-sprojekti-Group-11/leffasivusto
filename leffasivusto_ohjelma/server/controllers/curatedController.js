// server/controllers/curatedController.js
import { discoverPaged, weightedRating } from "../models/curatedModel.js";

function toNum(x, def) {
  const n = Number(x);
  return Number.isFinite(n) ? n : def;
}

function norm(movie) {
  const poster = movie?.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;
  return {
    id: movie.id,
    title: movie.title || movie.name,
    overview: movie.overview,
    releaseDate: movie.release_date || movie.first_air_date,
    poster,
    vote: movie.vote_average ?? movie.vote,
    voteCount: movie.vote_count ?? 0,
    popularity: movie.popularity ?? 0,
  };
}

/**
 * GET /api/tmdb/curated?kind=top|new|popular&size=100&genre=878&lang=fi-FI&region=FI&minVotes=1000&from=2020-01-01&to=2025-12-31&origLang=en
 */
export async function curated(req, res) {
  try {
    const kind = (req.query.kind || "top").toString();
    const size = toNum(req.query.size, 100);
    const minVotes = toNum(req.query.minVotes, 1000);
    const genre = req.query.genre ? String(req.query.genre) : undefined;
    const lang = req.query.lang ? String(req.query.lang) : undefined;       // ui language
    const region = req.query.region ? String(req.query.region) : undefined; // release region
    const from = req.query.from ? String(req.query.from) : undefined;       // YYYY-MM-DD
    const to = req.query.to ? String(req.query.to) : undefined;
    const origLang = req.query.origLang ? String(req.query.origLang) : undefined;

    // perusparametrit Discoveriin
    const base = {
      include_adult: false,
      include_video: false,
      with_release_type: 3|2|1, // theatrical & digital & premiere, TMDB bitmaskin kanssa ei tarvitse – tämä on lähinnä informatiivinen
      with_original_language: origLang,
      with_genres: genre,
      region,
      language: lang,
      "vote_count.gte": kind === "top" ? minVotes : undefined,
    };

    // Ajallinen rajaus / lajittelu
    let sort_by = "popularity.desc";
    const now = new Date();
    const eighteenMonthsAgo = new Date(now);
    eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18);

    const range = {};
    if (kind === "new") {
      sort_by = "primary_release_date.desc";
      range["primary_release_date.gte"] = from || eighteenMonthsAgo.toISOString().slice(0,10);
      range["primary_release_date.lte"] = to || now.toISOString().slice(0,10);
    } else if (kind === "top") {
      sort_by = "vote_average.desc"; // alkulajittelu – myöhemmin tehdään Bayes-lajittelu
      // halutessa voi myös rajata aikasarjaa kevyesti, mutta ei pakollinen
    } else if (kind === "popular") {
      sort_by = "popularity.desc";
      if (from) range["primary_release_date.gte"] = from;
      if (to) range["primary_release_date.lte"] = to;
    }

    const params = { ...base, ...range, sort_by, page: 1 };

    // Hae Discoverista useita sivuja (max 50) – otetaan iso massa ja karsitaan siihen päälle
    const { items } = await discoverPaged(params, { maxPages: 50 });

    // Dedupe + valinnainen Bayes-lajittelu
    const byId = new Map();
    for (const m of items) if (m?.id && !byId.has(m.id)) byId.set(m.id, m);
    let list = Array.from(byId.values());

    if (kind === "top") {
      const C = list.reduce((acc, m) => acc + (m.vote_average || 0), 0) / Math.max(1, list.length);
      list.sort((a, b) => {
        const wb = weightedRating({ R: b.vote_average || 0, v: b.vote_count || 0, C, m: minVotes });
        const wa = weightedRating({ R: a.vote_average || 0, v: a.vote_count || 0, C, m: minVotes });
        // tasatilanteessa käytetään populariteettia tiebreakerina
        return wb !== wa ? wb - wa : (b.popularity || 0) - (a.popularity || 0);
      });
    } else if (kind === "new") {
      list.sort((a, b) => String(b.release_date || b.first_air_date || "").localeCompare(String(a.release_date || a.first_air_date || "")));
    } else {
      // popular
      list.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }

    // Rajaa haluttuun kokoon ja normalisoi
    const results = list.slice(0, Math.max(1, size)).map(norm);

    // Cache headerit (voi säätää): esim. 6h top & popular, 2h new
    const maxAge = kind === "new" ? 2 * 60 * 60 : 6 * 60 * 60;
    res.set("Cache-Control", `public, max-age=${maxAge}`);
    res.json({ kind, size: results.length, results });
  } catch (err) {
    console.error("Curated error:", err?.response?.data || err.message);
    res.status(502).json({ error: "Curated fetch failed" });
  }
}
