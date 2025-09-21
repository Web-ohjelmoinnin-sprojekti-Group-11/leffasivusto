// src/controllers/movieController.js
import Movie from "../models/Movie";
import { getTrendingMovies, searchAll, discoverMovies } from "../services/movieService";

// --- Trending ---
export const fetchTrending = async () => {
  const data = await getTrendingMovies();
  return (data.results || []).map((m) => ({ ...new Movie(m), type: "title" }));
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

export const fetchDiscover = async (opts = {}) => {
  const data = await discoverMovies(opts);
  const results = (data.results || []).map((m) => ({ ...new Movie(m), type: "title" }));
  return {
    page: data.page || 1,
    totalPages: data.total_pages || 1,
    results,
  };
};