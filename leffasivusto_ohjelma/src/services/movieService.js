import api from "./api";

// Trending pysyy samana
export const getTrendingMovies = () =>
  api.get("/tmdb/trending").then((r) => r.data);

// Hakua varten käytetään nyt backendin /tmdb/search, joka tekee TMDB /search/multi
export const searchAll = (q, page = 1) =>
  api.get("/tmdb/search", { params: { q, page } }).then((r) => r.data);

// (valinnainen) Säilytä vanha nimi, jos muualla käytetään:
export const searchMovies = searchAll;
