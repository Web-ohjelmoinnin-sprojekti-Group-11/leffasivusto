// src/pages/Movies.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSearchMovies, useTrendingMovies } from "../hooks/useMovies";
import MovieGrid from "../components/movies/MovieGrid";
import SearchBar from "../components/search/SearchBar";
import DetailModal from "../components/movies/DetailModal";

/* --- apu: robusti tunnistus oliomuodoille --- */
const getYear = (m) =>
  (m.releaseDate && Number(String(m.releaseDate).slice(0, 4))) ||
  (m.first_air_date && Number(String(m.first_air_date).slice(0, 4))) ||
  0;

const getVote = (m) => (typeof m.vote === "number" ? m.vote : m.vote_average ?? 0);
const getTitle = (m) => (m.title || m.name || "").toString();

const isTitle = (m) =>
  m.type === "title" || m.mediaType === "movie" || m.mediaType === "tv" ||
  (!!m.releaseDate && !m.type); // fallback: meillä on julkaisu-pvm => title

const isMovie = (m) => (m.mediaType === "movie") || (isTitle(m) && !m.mediaType); // trending: movie
const isTv    = (m) => m.mediaType === "tv";

const isPerson = (m) => m.type === "person" || m.mediaType === "person";

const dept = (m) =>
  m.department || m.knownForDept || m.known_for_department || m.subtitle || "";

const isActor     = (m) => isPerson(m) && /Acting/i.test(dept(m));
const isDirector  = (m) => isPerson(m) && /Directing/i.test(dept(m));

export default function Movies() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const q = (params.get("q") || "").trim();
  const page = Number(params.get("page") || 1);
  const isSearch = q.length > 0;

  // UI: tyyppisuodatin + järjestys (vain titles)
  const [typeFilter, setTypeFilter] = useState("all"); // all | movie | tv | actor | director
  const [sortKey, setSortKey] = useState("year");      // year | rating | alpha

  // KLIIKKAUS: valittu kortti modalille
  const [selected, setSelected] = useState(null);

  const { movies, loading, error, totalPages } = isSearch
    ? useSearchMovies(q, page)
    : useTrendingMovies(true);

  // 1) Suodata tyypin mukaan
  const filtered = useMemo(() => {
    switch (typeFilter) {
      case "movie":    return movies.filter((m) => isTitle(m) && (isMovie(m) || m.mediaType === "movie"));
      case "tv":       return movies.filter((m) => isTitle(m) && isTv(m));
      case "actor":    return movies.filter((m) => isActor(m));
      case "director": return movies.filter((m) => isDirector(m));
      default:         return movies.slice(); // all
    }
  }, [movies, typeFilter]);

  // 2) Järjestä
  const sorted = useMemo(() => {
    // “All”: ensin titles vuosi ↓, sitten people nimi A–Z
    if (typeFilter === "all") {
      const titles = filtered.filter(isTitle).sort((a, b) => getYear(b) - getYear(a));
      const people = filtered.filter(isPerson).sort((a, b) => getTitle(a).localeCompare(getTitle(b)));
      return [...titles, ...people];
    }

    // “Movies/Series”: sort avaimen mukaan
    if (typeFilter === "movie" || typeFilter === "tv") {
      const s = filtered.slice();
      if (sortKey === "year")   s.sort((a, b) => getYear(b) - getYear(a));                // uusin ensin
      if (sortKey === "rating") s.sort((a, b) => getVote(b) - getVote(a));                // korkein ensin
      if (sortKey === "alpha")  s.sort((a, b) => getTitle(a).localeCompare(getTitle(b))); // A–Ö
      return s;
    }

    // “Actors/Directors”: nimi A–Z
    return filtered.slice().sort((a, b) => getTitle(a).localeCompare(getTitle(b)));
  }, [filtered, typeFilter, sortKey]);

  // Paginaatio
  const gotoPage = (p) => {
    const next = Math.max(1, Math.min(totalPages || 1, p));
    if (isSearch) setParams({ q, page: String(next) });
    else setParams({ page: String(next) });
  };

  return (
    <div className="container-fluid px-4 py-4">
      <h2 className="mb-3">{isSearch ? `Results for "${q}"` : "Elokuvat"}</h2>

      <SearchBar
        className="mb-3"
        size="lg"
        onSubmit={(query) => navigate(`/movies?q=${encodeURIComponent(query)}&page=1`)}
      />

      {/* Tyyppisuodattimet */}
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

      {/* Järjestys (vain Movies/Series) */}
      {(typeFilter === "movie" || typeFilter === "tv") && (
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <span className="small text-muted">Sort by:</span>
          <div className="btn-group btn-group-sm" role="group" aria-label="Sort">
            <button
              className={`btn ${sortKey === "year" ? "btn-secondary" : "btn-outline-secondary"}`}
              onClick={() => setSortKey("year")}
            >
              Year ↓
            </button>
            <button
              className={`btn ${sortKey === "rating" ? "btn-secondary" : "btn-outline-secondary"}`}
              onClick={() => setSortKey("rating")}
            >
              Rating ↓
            </button>
            <button
              className={`btn ${sortKey === "alpha" ? "btn-secondary" : "btn-outline-secondary"}`}
              onClick={() => setSortKey("alpha")}
            >
              Title A–Z
            </button>
          </div>
        </div>
      )}

      {loading && <div>Ladataan…</div>}
      {error && <div className="text-danger">{error}</div>}
      {!loading && !error && (
        <MovieGrid
          movies={sorted}
          onSelect={(m) => setSelected(m)}
        />
      )}

      {/* Nuolinapit sivutukseen (vain haussa) */}
      {isSearch && totalPages > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-2 my-3">
          <button
            className="btn btn-outline-secondary"
            title="Previous"
            disabled={page <= 1}
            onClick={() => gotoPage(page - 1)}
          >
            ◀
          </button>
          <span className="small">Page {page} / {totalPages}</span>
          <button
            className="btn btn-outline-secondary"
            title="Next"
            disabled={page >= totalPages}
            onClick={() => gotoPage(page + 1)}
          >
            ▶
          </button>
        </div>
      )}

      {/* Detail modal */}
      <DetailModal
        show={!!selected}
        item={selected}
        onHide={() => setSelected(null)}
      />
    </div>
  );
}
