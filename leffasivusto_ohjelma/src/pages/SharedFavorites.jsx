// src/pages/SharedFavorites.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Spinner, Alert } from "react-bootstrap";
import MovieGrid from "../components/movies/MovieGrid.jsx";
import api from "../services/api";
import { getTitleDetails } from "../services/movieService";

const IMG = (p, size = "w500") => (p ? `https://image.tmdb.org/t/p/${size}${p}` : null);

export default function SharedFavorites() {
  // nappaa joko :token tai koko loppupolku (*), jotta myös "/" sisältävät tokenit toimivat
  const params = useParams();
  const tokenRaw = params.token ?? params["*"] ?? "";
  const token = decodeURIComponent(tokenRaw);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        // public endpoint (ei cookiea)
        const res = await api.get(`/share/${encodeURIComponent(token)}`, { withCredentials: false });
        const ids = Array.isArray(res.data?.movies) ? res.data.movies : [];

        const details = await Promise.all(
          ids.map((raw) =>
            getTitleDetails("movie", Number(raw))
              .then((d) => d?.detail || null)
              .catch(() => null)
          )
        );

        const mapped = details
          .filter(Boolean)
          .map((d) => ({
            id: d.id,
            title: d.title || d.name || `#${d.id}`,
            poster: IMG(d.poster_path),
            releaseDate: d.release_date,
            type: "movie",
          }));

        if (mounted) setMovies(mapped);
      } catch (e) {
        if (mounted) setError(e?.response?.data?.error || e?.message || "Failed to load shared favorites");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [token]);

  if (loading) return <div className="py-3"><Spinner animation="border" size="sm" /> <span className="ms-2">Loading…</span></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!movies.length) return <div className="text-muted">No favorites found or list is empty.</div>;

  return (
    <div>
      <h2 className="mb-3">Shared Favorites</h2>
      <MovieGrid movies={movies} />
    </div>
  );
}
