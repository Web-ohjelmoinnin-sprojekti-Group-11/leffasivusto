// src/components/movies/MovieCard.jsx
import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

const MovieCard = ({ movie }) => {
  const isPerson = movie.type === "person";
  const hasImage = Boolean(movie.poster);

  // Hover-viive: 1.5 s ennen kuin kuvaus aukeaa
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

  // Siivous varmuuden vuoksi
  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  return (
    <div
      className={`card h-100 shadow-sm movie-card ${reveal ? "is-revealed" : ""}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* Kuva */}
      {hasImage && (
        <img
          src={movie.poster}
          className="card-img-top card-poster"
          alt={movie.title}
          loading="lazy"
        />
      )}

      {/* Perusmeta: nimi + badge + vuosi + arvosana */}
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between">
          <h6 className="card-title mb-1">{movie.title}</h6>
          {isPerson && (
            <span className="badge text-bg-secondary badge-person">Person</span>
          )}
        </div>

        {!isPerson ? (
          <small className="movie-meta">
            {movie.releaseDate?.slice(0, 4)}
            {typeof movie.vote === "number" && ` • ⭐ ${movie.vote.toFixed(1)}`}
          </small>
        ) : (
          movie.subtitle && <small className="movie-meta">{movie.subtitle}</small>
        )}

        {/* Kuvaus: hidden by default, slides down after 1.5s hover */}
        {movie.overview && (
          <div
            className="overview-wrap"
            aria-hidden={!reveal}
            // title: koko teksti tooltipiin
            title={movie.overview}
          >
            <p className="card-text overview-content">{movie.overview}</p>
          </div>
        )}
      </div>
    </div>
  );
};

MovieCard.propTypes = {
  movie: PropTypes.object.isRequired,
};

export default MovieCard;
