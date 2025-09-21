// src/components/movies/MovieCard.jsx
import React from "react";
import PropTypes from "prop-types";

const MovieCard = ({ movie }) => {
  const isPerson = movie.type === "person";
  const hasImage = Boolean(movie.poster);

  return (
    <div className="card h-100 shadow-sm movie-card">
      {/* Näytä kuva vain jos se on olemassa */}
      {hasImage && (
        <img
          src={movie.poster}
          className="card-img-top card-poster"
          alt={movie.title}
        />
      )}

      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between">
          <h6 className="card-title mb-1">{movie.title}</h6>
          {isPerson && <span className="badge text-bg-secondary badge-person">Person</span>}
        </div>

        {/* Meta: vuosi + arvosana (title) tai department (person) */}
        {!isPerson ? (
          <small className="movie-meta">
            {movie.releaseDate?.slice(0, 4)}
            {typeof movie.vote === "number" && ` • ⭐ ${movie.vote.toFixed(1)}`}
          </small>
        ) : (
          movie.subtitle && <small className="movie-meta">{movie.subtitle}</small>
        )}

        {/* Juoni / Known for... (3 riviä) */}
        {movie.overview && (
          <p className="card-text mt-2 line-clamp-2" title={movie.overview}>
            {movie.overview}
          </p>
        )}
      </div>
    </div>
  );
};

MovieCard.propTypes = {
  movie: PropTypes.object.isRequired,
};

export default MovieCard;
