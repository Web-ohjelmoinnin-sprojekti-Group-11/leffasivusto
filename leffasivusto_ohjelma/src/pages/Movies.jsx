// src/pages/Movies.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSearchMovies } from "../hooks/useMovies";
import MovieGrid from "../components/movies/MovieGrid";
import SearchBar from "../components/search/SearchBar";
import DetailModal from "../components/movies/DetailModal";
import { fetchTrending } from "../controllers/movieController";

/* helpers */
const getYear = (m) =>
  (m.releaseDate && Number(String(m.releaseDate).slice(0, 4))) ||
  (m.first_air_date && Number(String(m.first_air_date).slice(0, 4))) || 0;
const getVote = (m) => (typeof m.vote === "number" ? m.vote : m.vote_average ?? 0);
const getTitle = (m) => (m.title || m.name || "").toString();
const isTitle = (m) =>
  m.type === "title" || m.mediaType === "movie" || m.mediaType === "tv" ||
  (!!m.releaseDate && !m.type);
const isMovie = (m) => m.mediaType === "movie" || (isTitle(m) && !m.mediaType);
const isTv = (m) => m.mediaType === "tv";
const isPerson = (m) => m.type === "person" || m.mediaType === "person";
const dept = (m) => m.department || m.knownForDept || m.known_for_department || m.subtitle || "";
const isActor = (m) => isPerson(m) && /Acting/i.test(dept(m));
const isDirector = (m) => isPerson(m) && /Directing/i.test(dept(m));

/* selkeämpi teksti tyhjätilaan */
const FILTER_LABELS = {
  all: "items",
  movie: "movies",
  tv: "series",
  actor: "actors",
  director: "directors",
};

export default function Movies() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const q = (params.get("q") || "").trim();
  const page = Number(params.get("page") || 1);
  const isSearch = q.length > 0;

  const [typeFilter, setTypeFilter] = useState("all"); // all | movie | tv | actor | director
  const [sortKey, setSortKey] = useState("year");      // year | rating | alpha
  const [selected, setSelected] = useState(null);

  /* --- HAKU: kutsutaan AINA, mutta enabled = isSearch --- */
  const {
    movies: searchMoviesList,
    loading: searchLoading,
    error: searchError,
    totalPages,
  } = useSearchMovies(q, page, isSearch);

  /* --- TRENDIT: 100kpl pool, kun EI haeta --- */
  const [trendState, setTrendState] = useState({ movies: [], loading: false, error: "" });

  useEffect(() => {
    let cancelled = false;
    if (!isSearch) {
      (async () => {
        try {
          setTrendState((s) => ({ ...s, loading: true, error: "" }));
          const list = await fetchTrending({ size: 100 });
          if (!cancelled) setTrendState({ movies: list || [], loading: false, error: "" });
        } catch (e) {
          if (!cancelled)
            setTrendState({ movies: [], loading: false, error: "Failed to load movies." });
        }
      })();
    } else {
      setTrendState((s) => ({ ...s, movies: [] }));
    }
    return () => { cancelled = true; };
  }, [isSearch]);

  // Valitse lähde
  const movies = isSearch ? searchMoviesList : trendState.movies;
  const loading = isSearch ? searchLoading : trendState.loading;
  const error = isSearch ? searchError : trendState.error;

  // Suodatus
  const filtered = useMemo(() => {
    switch (typeFilter) {
      case "movie":    return movies.filter((m) => isTitle(m) && (isMovie(m) || m.mediaType === "movie"));
      case "tv":       return movies.filter((m) => isTitle(m) && isTv(m));
      case "actor":    return movies.filter((m) => isActor(m));
      case "director": return movies.filter((m) => isDirector(m));
      default:         return movies.slice();
    }
  }, [movies, typeFilter]);

  // Järjestys
  const sorted = useMemo(() => {
    if (typeFilter === "all") {
      const titles = filtered.filter(isTitle).sort((a, b) => getYear(b) - getYear(a));
      const people = filtered.filter(isPerson).sort((a, b) => getTitle(a).localeCompare(getTitle(b)));
      return [...titles, ...people];
    }
    if (typeFilter === "movie" || typeFilter === "tv") {
      const s = filtered.slice();
      if (sortKey === "year")   s.sort((a, b) => getYear(b) - getYear(a));
      if (sortKey === "rating") s.sort((a, b) => getVote(b) - getVote(a));
      if (sortKey === "alpha")  s.sort((a, b) => getTitle(a).localeCompare(getTitle(b)));
      return s;
    }
    return filtered.slice().sort((a, b) => getTitle(a).localeCompare(getTitle(b)));
  }, [filtered, typeFilter, sortKey]);

  // Tyhjätilan ehto (vain hakunäkymässä)
  const noResults = isSearch && !loading && !error && sorted.length === 0;

  // Paginaatio vain haussa
  const gotoPage = (p) => {
    const next = Math.max(1, Math.min(totalPages || 1, p));
    if (isSearch) setParams({ q, page: String(next) });
    else setParams({ page: String(next) });
  };

  return (
    <div className="container-fluid px-4 py-4">
      <h2 className="mb-3">{isSearch ? `Results for "${q}"` : "Movies"}</h2>

      <SearchBar
        className="mb-3"
        size="lg"
        onSubmit={(query) => navigate(`/movies?q=${encodeURIComponent(query)}&page=1`)}
      />

      {/* Type filters */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {[
          { key: "all",      label: "All" },
          { key: "movie",    label: "Movies" },
          { key: "tv",       label: "Series" },
          { key: "actor",    label: "Actors" },
          { key: "director", label: "Directors" },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`btn btn-sm ${typeFilter === key ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setTypeFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sort (only Movies/Series) */}
      {(typeFilter === "movie" || typeFilter === "tv") && (
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <span className="small text-muted">Sort by:</span>
          <div className="btn-group btn-group-sm" role="group" aria-label="Sort">
            <button
              className={`btn ${sortKey === "year" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setSortKey("year")}
            >
              Year ↓
            </button>
            <button
              className={`btn ${sortKey === "rating" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setSortKey("rating")}
            >
              Rating ↓
            </button>
            <button
              className={`btn ${sortKey === "alpha" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setSortKey("alpha")}
            >
              Title A–Z
            </button>
          </div>
        </div>
      )}

      {loading && <div>Loading…</div>}
      {error && <div className="text-danger">{error}</div>}

      {/* ✅ Tyhjätila hakutuloksille */}
      {noResults && (
        <div
          className="text-center text-muted my-5"
          aria-live="polite"
        >
          <h5 className="mb-2">No {FILTER_LABELS[typeFilter]} found for “{q}”.</h5>
          <p className="mb-3">Tips: use fewer keywords, check spelling, or change the type filter.</p>
          <div className="d-flex justify-content-center gap-2">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => setTypeFilter("all")}
            >
              Show all types
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { setParams({}); navigate("/movies"); }}
            >
              Back to trending
            </button>
          </div>
        </div>
      )}

      {/* Tulokset */}
      {!loading && !error && !noResults && (
        <MovieGrid movies={sorted} onSelect={(m) => setSelected(m)} />
      )}

      {/* Pager (search only) */}
      {isSearch && totalPages > 1 && (
        <div className="pager-pink d-flex justify-content-center align-items-center gap-2 my-3">
          <button
            className="btn btn-primary"
            title="Previous"
            disabled={page <= 1}
            onClick={() => gotoPage(page - 1)}
          >
            ‹
          </button>
          <span className="small">Page {page} / {totalPages}</span>
          <button
            className="btn btn-primary"
            title="Next"
            disabled={page >= totalPages}
            onClick={() => gotoPage(page + 1)}
          >
            ›
          </button>
        </div>
      )}

      <DetailModal show={!!selected} item={selected} onHide={() => setSelected(null)} />
    </div>
  );
}
