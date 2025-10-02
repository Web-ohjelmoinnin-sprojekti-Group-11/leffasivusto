// server/models/tmdbModel.js
import tmdb from "../utils/tmdb.js";

/** Trending (movies, day) */
export async function fetchTrendingMoviesDay() {
  const { data } = await tmdb.get("/trending/movie/day");
  return data;
}

/** Search multi */
export async function searchMulti({ q, page = 1 }) {
  const { data } = await tmdb.get("/search/multi", {
    params: { query: q, page, include_adult: false },
  });
  return data;
}

/** Title detail + credits by type */
export async function fetchTitleDetail(type, id) {
  const { data } = await tmdb.get(`/${type}/${id}`);
  return data;
}
export async function fetchTitleCredits(type, id) {
  const { data } = await tmdb.get(`/${type}/${id}/credits`);
  return data;
}

/** Person + combined credits */
export async function fetchPerson(id) {
  const { data } = await tmdb.get(`/person/${id}`);
  return data;
}
export async function fetchPersonCombinedCredits(id) {
  const { data } = await tmdb.get(`/person/${id}/combined_credits`);
  return data;
}

/** Discover movies (raw passthrough to TMDB) */
export async function discoverMovies(params) {
  const { data } = await tmdb.get("/discover/movie", { params });
  return data;
}

/** Picker helpers */
export async function searchKeywordId(word) {
  if (!word) return null;
  const { data } = await tmdb.get("/search/keyword", { params: { query: word } });
  return data?.results?.[0]?.id || null;
}

export async function discoverWithFilters({ keywordId, genreId, decadeFrom, decadeTo, page = 1 }) {
  const params = {
    include_adult: false,
    sort_by: "popularity.desc",
    page,
    "vote_count.gte": 50,
    with_original_language: "en",
  };
  if (keywordId) params.with_keywords = String(keywordId);
  if (genreId) params.with_genres = String(genreId);
  if (decadeFrom) params["primary_release_date.gte"] = `${decadeFrom}-01-01`;
  if (decadeTo) params["primary_release_date.lte"] = `${decadeTo}-12-31`;

  const { data } = await tmdb.get("/discover/movie", { params });
  return data;
}
