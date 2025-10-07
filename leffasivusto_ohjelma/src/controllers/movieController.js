import Movie from "../models/Movie";
import {
  getTrendingPool,
  searchAll,
  discoverPage,    // <— chunk Discover
  getCurated,      // <— curated-listat
} from "../services/movieService";

// --- Trending (100 kpl pool) ---
export const fetchTrending = async ({ size = 100 } = {}) => {
  const list = await getTrendingPool({ size, media: "movie", window: "week" });
  return (list || []).map((m) => ({ ...new Movie(m), type: "title" }));
};

// --- Search (multi: movie+tv+person) ---
export const fetchSearch = async (q, page = 1) => {
  const data = await searchAll(q, page);

  const results = (data.results || []).map((m) => {
    if (m.media_type === "person") {
      const knownFor = (m.known_for || [])
        .map((k) => k.title || k.name)
        .filter(Boolean)
        .slice(0, 3)
        .join(", ");

      const dept = m.known_for_department || "Person";

      return {
        id: m.id,
        type: "person",
        title: m.name,
        subtitle: dept,
        overview: knownFor ? `Known for: ${knownFor}` : dept,
        poster: m.profile_path
          ? `https://image.tmdb.org/t/p/w500${m.profile_path}`
          : null,
        vote: null,
        releaseDate: null,
        mediaType: "person",
      };
    }
    return { ...new Movie(m), type: "title" };
  });

  return { page: data.page, totalPages: data.total_pages, results };
};

// --- Discover (chunkattu sivutus: ~100 kpl/“sivu”) ---
export const fetchDiscover = async (opts = {}) => {
  const { year, minRating, genres } = opts;
  const startPage = Math.max(1, Number(opts.page || 1));

  const CHUNK = 5; // 5 × 20 = ~100

  const first = await discoverPage({ year, minRating, genres, page: startPage });
  const totalPages = first?.total_pages || 1;

  const endPage = Math.min(totalPages, startPage + CHUNK - 1);
  const reqs = [];
  for (let p = startPage + 1; p <= endPage; p++) {
    reqs.push(discoverPage({ year, minRating, genres, page: p }));
  }
  const rest = await Promise.all(reqs);

  const all = [first, ...rest].flatMap((r) => r?.results ?? []);
  const byId = new Map();
  for (const m of all) if (m?.id && !byId.has(m.id)) byId.set(m.id, m);

  const results = Array.from(byId.values()).map((m) => ({ ...new Movie(m), type: "title" }));

  return { page: startPage, totalPages, results };
};

// --- Curated (Top / Newest / Popular / Sci-Fi 100) ---
// TÄRKEIN MUUTOS: normalisoidaan kentät siihen, mitä UI jo ymmärtää.
export const fetchCurated = async ({
  kind = "top",
  size = 100,
  genre,
  lang,
  region,
  minVotes,
  from,
  to,
  origLang,
} = {}) => {
  const items = await getCurated({ kind, size, genre, lang, region, minVotes, from, to, origLang });

  const results = (items || []).map((m) => {
    // m voi olla joko TMDB-raakadataa (poster_path, release_date, vote_average)
    // TAI jo valmiiksi normalisoitu (poster/posterUrl, releaseDate, vote).
    const poster =
      m.poster
        || m.posterUrl
        || (m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null);

    const releaseDate = m.releaseDate || m.release_date || m.first_air_date || null;

    const vote = typeof m.vote === "number" ? m.vote : (m.vote_average ?? 0);

    return {
      id: m.id,
      type: "title",
      title: m.title || m.name,
      overview: m.overview,
      releaseDate,
      poster,
      vote,
      mediaType: "movie", // käytetään "title"-korteille
    };
  });

  // Curated-listat ovat aina yksisivuisia (100 kpl)
  return { page: 1, totalPages: 1, results };
};
