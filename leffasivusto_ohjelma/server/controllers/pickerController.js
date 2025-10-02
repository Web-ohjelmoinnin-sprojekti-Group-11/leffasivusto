// server/controllers/pickerController.js
import tmdb from "../utils/tmdb.js";

/** Hakee TMDB keyword-ID:n sanalle (paras osuma) */
async function getKeywordId(word) {
  if (!word) return null;
  const { data } = await tmdb.get("/search/keyword", { params: { query: word } });
  return data?.results?.[0]?.id || null;
}

/** Rajaa discover-haun avainsanoilla + decade-ikkunalla */
async function discoverWithKeywordsAndDecade(keywordIds, decadeFrom, decadeTo, page = 1) {
  const params = {
    include_adult: false,
    sort_by: "popularity.desc",
    page,
  };
  if (keywordIds?.length) params.with_keywords = keywordIds.join(",");
  if (decadeFrom) params["primary_release_date.gte"] = `${decadeFrom}-01-01`;
  if (decadeTo)   params["primary_release_date.lte"] = `${decadeTo}-12-31`;

  const { data } = await tmdb.get("/discover/movie", { params });
  return data;
}

/** Fallback: vapaa tekstihaku */
async function searchByFreeText(query, decadeFrom, decadeTo, page = 1) {
  const { data } = await tmdb.get("/search/movie", {
    params: { query, include_adult: false, page },
  });

  if (decadeFrom && decadeTo && data?.results?.length) {
    const from = Number(decadeFrom), to = Number(decadeTo);
    data.results = data.results.filter((m) => {
      const d = m.release_date || m.first_air_date || "";
      const y = Number(String(d).slice(0, 4));
      return Number.isFinite(y) && y >= from && y <= to;
    });
  }
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
    tmdbUrl: `https://www.themoviedb.org/movie/${movie.id}`,
    vote: movie.vote_average ?? movie.vote,
  };
}

/** GET /api/picker?kw=word1,word2&decade=2010  (2010..2019) */
export async function randomPick(req, res, next) {
  try {
    const raw = String(req.query.kw || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 2);

    const decade = Number(req.query.decade || "");
    const decadeFrom = Number.isFinite(decade) ? decade : null;
    const decadeTo   = Number.isFinite(decade) ? decade + 9 : null;

    if (!raw.length && !decadeFrom) {
      return res.status(400).json({ error: "Provide at least a keyword or decade." });
    }

    const ids = (await Promise.all(raw.map(getKeywordId))).filter(Boolean);

    const combos = [];
    if (ids.length >= 2) combos.push([ids[0], ids[1]]);
    if (ids.length >= 1) combos.push([ids[0]]);
    combos.push([]); // pelkkä decade

    let chosen = null;
    for (const combo of combos) {
      const first = await discoverWithKeywordsAndDecade(combo, decadeFrom, decadeTo, 1);
      if (!first?.total_results) continue;

      const maxPages = Math.min(first.total_pages || 1, 10);
      const randomPage = Math.max(1, Math.floor(Math.random() * maxPages) + 1);
      const pageData = randomPage === 1
        ? first
        : await discoverWithKeywordsAndDecade(combo, decadeFrom, decadeTo, randomPage);

      chosen = pickRandom(pageData.results);
      if (chosen) break;
    }

    if (!chosen && raw.length) {
      const q = raw.join(" ");
      const first = await searchByFreeText(q, decadeFrom, decadeTo, 1);
      if (first?.results?.length) chosen = pickRandom(first.results);
    }

    if (!chosen) return res.status(404).json({ error: "No movie found matching your criteria." });
    res.status(200).json(normalize(chosen));
  } catch (err) {
    next(err);
  }
}
