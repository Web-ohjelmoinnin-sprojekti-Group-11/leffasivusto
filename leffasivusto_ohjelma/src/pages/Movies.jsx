// src/pages/Movies.jsx
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSearchMovies, useTrendingMovies } from "../hooks/useMovies";
import MovieGrid from "../components/movies/MovieGrid";
import SearchBar from "../components/search/SearchBar";

export default function Movies() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const q = (params.get("q") || "").trim();
  const page = Number(params.get("page") || 1);

  const isSearch = q.length > 0;
  const { movies, loading, error, totalPages } = isSearch
    ? useSearchMovies(q, page)
    : useTrendingMovies(true);

  const gotoPage = (p) => {
    const next = Math.max(1, p);
    if (isSearch) setParams({ q, page: String(next) });
    else setParams({ page: String(next) });
  };

  return (
    <div className="container py-4">
      <h2 className="mb-3">{isSearch ? `Results for "${q}"` : "Elokuvat"}</h2>

      <SearchBar
        className="mb-3"
        size="lg"
        onSubmit={(query) => navigate(`/movies?q=${encodeURIComponent(query)}&page=1`)}
      />

      {loading && <div>Ladataan…</div>}
      {error && <div className="text-danger">{error}</div>}
      {!loading && !error && <MovieGrid movies={movies} />}

      {isSearch && totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2 my-3">
          <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => gotoPage(page - 1)}>Edellinen</button>
          <span className="align-self-center small">Sivu {page}/{totalPages}</span>
          <button className="btn btn-outline-secondary" disabled={page >= totalPages} onClick={() => gotoPage(page + 1)}>Seuraava</button>
        </div>
      )}
    </div>
  );
}
