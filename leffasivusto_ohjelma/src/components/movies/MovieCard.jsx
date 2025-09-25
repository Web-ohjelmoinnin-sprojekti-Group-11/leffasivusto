// src/components/movies/MovieCard.jsx
import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Heart } from "lucide-react";
import { useFavorites } from "../../hooks/useFavorites";
import { useAuth } from "../../state/AuthContext.jsx";

const btnBase = "floating-heart-btn btn btn-light rounded-pill shadow-sm";

export default function MovieCard({ movie }) {
  // ----- Derivaatit elokuva/person-korteille -----
  const title = movie.title || movie.name || "Untitled";
  const poster = movie.poster;
  const hasImage = !!poster;
  const year =
    (movie.releaseDate && String(movie.releaseDate).slice(0, 4)) ||
    (movie.first_air_date && String(movie.first_air_date).slice(0, 4)) ||
    "";
  const vote =
    typeof movie.vote === "number"
      ? movie.vote
      : typeof movie.vote_average === "number"
      ? movie.vote_average
      : null;

  const isPerson = movie.mediaType === "person" || movie.isPerson === true;

  // ----- Hover-kuvauksen viive -----
  const [reveal, setReveal] = useState(false);
  const hoverTimer = useRef(null);

  const onEnter = () => {
    if (!movie.overview) return;
    hoverTimer.current = setTimeout(() => setReveal(true), 1500);
  };
  const onLeave = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
    setReveal(false);
  };
  useEffect(() => {
    return () => clearTimeout(hoverTimer.current);
  }, []);

  // ----- Favorites -----
  const { isFavorited, toggle, adding, removing } = useFavorites();
  const { isAuthenticated } = useAuth();
  const fav = isFavorited(movie.id);
  const disabled = adding || removing || !isAuthenticated;

  const onHeart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!disabled) toggle(movie);
  };

  return (
    <div
      className={`card h-100 shadow-sm movie-card position-relative ${
        reveal ? "is-revealed" : ""
      }`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* Kuva */}
      {hasImage ? (
        <img
          src={poster}
          className="card-img-top card-poster"
          alt={title ? `Poster for ${title}` : "Poster"}
          loading="lazy"
        />
      ) : (
        <div className="ratio ratio-2x3 bg-secondary-subtle d-flex align-items-center justify-content-center">
          <span className="text-muted small">No image</span>
        </div>
      )}

      {/* Tekstit */}
      <div className="card-body p-2">
        <div className="d-flex align-items-center justify-content-between">
          <h6 className="card-title mb-1 text-truncate" title={title}>
            {title}
          </h6>
          {isPerson && (
            <span className="badge text-bg-secondary badge-person">Person</span>
          )}
        </div>

        {!isPerson ? (
          <small className="movie-meta text-muted">
            {year}
            {typeof vote === "number" && ` • ⭐ ${vote.toFixed(1)}`}
          </small>
        ) : (
          movie.subtitle && (
            <small className="movie-meta text-muted">{movie.subtitle}</small>
          )
        )}

        {/* Kuvaus – liukuu esiin 1.5s hoverin jälkeen */}
        {movie.overview && (
          <div
            className="overview-wrap mt-2"
            aria-hidden={!reveal}
            title={movie.overview}
          >
            <p className="card-text overview-content">{movie.overview}</p>
          </div>
        )}
      </div>

      {/* Suosikki-sydän */}
      <button
        type="button"
        aria-label={fav ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={fav}
        disabled={disabled}
        className={`${btnBase} ${fav ? "is-active" : ""}`}
        onClick={onHeart}
      >
        <Heart
          size={20}
          className="heart-icon"
          style={{
            fill: fav ? "currentColor" : "transparent",
            transition: "fill 120ms ease",
          }}
        />
        <span className="visually-hidden">
          {fav ? "Favorited" : "Not favorited"}
        </span>
      </button>
    </div>
  );
}

MovieCard.propTypes = {
  movie: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    name: PropTypes.string,
    poster: PropTypes.string,
    overview: PropTypes.string,
    subtitle: PropTypes.string,
    mediaType: PropTypes.string, // 'movie' | 'tv' | 'person'
    vote: PropTypes.number,
    vote_average: PropTypes.number,
    releaseDate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.instanceOf(Date),
    ]),
    first_air_date: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.instanceOf(Date),
    ]),
    isPerson: PropTypes.bool,
  }).isRequired,
};
