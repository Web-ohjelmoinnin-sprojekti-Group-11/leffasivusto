// src/hooks/useGroupLibrary.js
import { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import { getToken } from "../services/token";

export default function useGroupLibrary(id) {
  const [libLoading, setLibLoading] = useState(true);
  const [libError, setLibError] = useState(null);
  const [libMovies, setLibMovies] = useState([]);

  const auth = useMemo(
    () => ({ headers: { Authorization: `Bearer ${getToken()}` } }),
    []
  );

  const loadLibrary = async () => {
    try {
      setLibLoading(true);
      setLibError(null);
      setLibMovies([]);

      const gc = await api.get(`/group_content/${id}/movies`, auth);
      const items = gc.data?.movies || [];

      const results = await Promise.all(
        items.map(async (x) => {
          const tmdbId = Number(x.movie_id);
          let payload = null;
          try {
            const r1 = await api.get(`/tmdb/title/${tmdbId}`);
            payload = r1.data || null;
          } catch (e1) {
            if (e1?.response?.status === 404) {
              try {
                const r2 = await api.get(`/tmdb/tv/${tmdbId}`);
                payload = r2.data || null;
              } catch {
                payload = null;
              }
            }
          }
          if (!payload) {
            return {
              id: tmdbId,
              title: `#${tmdbId}`,
              name: null,
              poster: null,
              overview: "",
              vote_average: null,
              releaseDate: "",
              added_by: x.added_by,
              mediaType: "movie",
            };
          }
          const d = payload.detail || payload;
          const mediaType = d.title ? "movie" : "tv";
          return {
            id: tmdbId,
            title: d.title || d.name || `#${tmdbId}`,
            name: d.name,
            poster: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : null,
            overview: d.overview || "",
            vote_average: typeof d.vote_average === "number" ? d.vote_average : null,
            releaseDate: d.release_date || d.first_air_date || "",
            added_by: x.added_by,
            mediaType,
          };
        })
      );
      setLibMovies(results);
    } catch (err) {
      console.error(err);
      setLibError("Failed to load group movies");
    } finally {
      setLibLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return { libLoading, libError, libMovies, loadLibrary };
}
