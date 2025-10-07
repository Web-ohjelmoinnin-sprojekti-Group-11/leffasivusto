import api from "./api";

/** ---------- TRENDING ---------- */
export const getTrendingPage = ({ page = 1, media = "movie", window = "week" } = {}) =>
  api
    .get("/tmdb/trending", {
      params: { page, media, window, _ts: Date.now() }, // cache-buster
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    })
    .then((r) => r.data);

export const getTrendingPool = async ({ size = 100, media = "movie", window = "week" } = {}) => {
  const pages = Math.max(1, Math.ceil(size / 20));
  const reqs = Array.from({ length: pages }, (_, i) =>
    getTrendingPage({ page: i + 1, media, window })
  );
  const res = await Promise.all(reqs);
  const items = res.flatMap((r) => (Array.isArray(r) ? r : r?.results ?? []));
  const byId = new Map();
  for (const m of items) if (m?.id && !byId.has(m.id)) byId.set(m.id, m);
  return Array.from(byId.values()).slice(0, size);
};

// Vanha yhden sivun alias (taaksepäin yhteensopivuus)
export const getTrendingMovies = () => getTrendingPage({ page: 1 });

/** ---------- SEARCH (multi) ---------- */
export const searchAll = (q, page = 1) =>
  api.get("/tmdb/search", { params: { q, page } }).then((r) => r.data);

// Alias jos käytetään muualla
export const searchMovies = searchAll;

/** ---------- Title & person ---------- */
export const getTitleDetails = (type, id) =>
  api.get(`/tmdb/title/${type}/${id}`).then((r) => r.data);

export const getPersonDetails = (id) =>
  api.get(`/tmdb/person/${id}`).then((r) => r.data);

export const getPersonCredits = (id) =>
  api.get(`/tmdb/person/${id}/credits`).then((r) => r.data);

/** ---------- DISCOVER ---------- */
/** Hakee yhden Discover-sivun (20 kpl). */
export const discoverPage = ({ year, minRating, genres, page = 1 } = {}) =>
  api
    .get("/tmdb/discover", {
      params: { year, minRating, genres, page, _ts: Date.now() }, // cache-buster
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    })
    .then((r) => r.data);

/** Hakee useita Discover-sivuja ja yhdistää ne pooliksi (oletus 100 kpl). */
export const discoverPool = async ({ year, minRating, genres, size = 100 } = {}) => {
  const pages = Math.max(1, Math.ceil(size / 20));
  const reqs = Array.from({ length: pages }, (_, i) =>
    discoverPage({ year, minRating, genres, page: i + 1 })
  );
  const res = await Promise.all(reqs);
  const items = res.flatMap((r) => r?.results ?? []);
  const byId = new Map();
  for (const m of items) if (m?.id && !byId.has(m.id)) byId.set(m.id, m);
  return Array.from(byId.values()).slice(0, size);
};

/** (Yhden sivun raw passthrough – jos joku muu paikka tarvitsee) */
export const discoverMovies = ({ year, minRating, genres, page = 1 } = {}) =>
  api.get("/tmdb/discover", { params: { year, minRating, genres, page } }).then((r) => r.data);

/** ---------- CURATED (Top/New/Popular 100) ---------- */
/**
 * kind: "top" | "new" | "popular"
 * optional: { genre, lang, region, minVotes, from, to, origLang, size=100 }
 * Palauttaa taulukon (normalisoidut itemit) serverin /tmdb/curated -endpointista.
 */
export const getCurated = ({
  kind = "top",
  size = 100,
  genre,
  lang,
  region,
  minVotes,
  from,
  to,
  origLang,
} = {}) =>
  api
    .get("/tmdb/curated", {
      params: {
        kind,
        size,
        genre,
        lang,
        region,
        minVotes,
        from,
        to,
        origLang,
        _ts: Date.now(), // varmuuden vuoksi
      },
    })
    .then((r) => r.data?.results ?? []);

export const getTitleById = (id) =>
  api.get(`/tmdb/title/${id}`).then((r) => r.data?.detail ?? r.data);

export default { getTitleById };
