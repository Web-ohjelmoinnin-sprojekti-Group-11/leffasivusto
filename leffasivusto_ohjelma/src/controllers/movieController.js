import Movie from "../models/Movie";
import { getTrendingMovies, searchAll } from "../services/movieService";

export const fetchTrending = async () => {
  const data = await getTrendingMovies();
  return (data.results || []).map((m) => new Movie(m));
};

export const fetchSearch = async (q, page = 1) => {
  const data = await searchAll(q, page);

  const results = (data.results || []).map((m) => {
    // Henkilöt (näyttelijät/ohjaajat ym.) tulevat media_type === "person"
    if (m.media_type === "person") {
      const knownFor = (m.known_for || [])
        .map((k) => k.title || k.name)
        .filter(Boolean)
        .slice(0, 3)
        .join(", ");

      return {
        id: m.id,
        title: m.name,                  // MovieCard käyttää title-kenttää
        overview: knownFor ? `Known for: ${knownFor}` : "Person",
        poster: m.profile_path
          ? `https://image.tmdb.org/t/p/w500${m.profile_path}`
          : null,
        vote: null,
        releaseDate: null,
      };
    }

    // Muut (movie/tv) menevät Movie-mallin kautta
    return new Movie(m);
  });

  return {
    page: data.page,
    totalPages: data.total_pages,
    results,
  };
};
