// src/services/movieService.js
import api from "./api";

// Trending
export const getTrendingMovies = () =>
  api.get("/tmdb/trending").then((r) => r.data);

// Search (multi)
export const searchAll = (q, page = 1) =>
  api.get("/tmdb/search", { params: { q, page } }).then((r) => r.data);

// Alias jos käytetään muualla
export const searchMovies = searchAll;

// Title ja person -tiedot
export const getTitleDetails = (type, id) =>
  api.get(`/tmdb/title/${type}/${id}`).then((r) => r.data);

export const getPersonDetails = (id) =>
  api.get(`/tmdb/person/${id}`).then((r) => r.data);

export const getPersonCredits = (id) =>
  api.get(`/tmdb/person/${id}/credits`).then((r) => r.data);

// Discover – tämä palauttaa TMDB:n raakadatasta koko vastauksen (results, total_pages, ...)
export const discoverMovies = ({ year, minRating, genres, page = 1 } = {}) =>
  api
    .get("/tmdb/discover", { params: { year, minRating, genres, page } })
    .then((r) => r.data);