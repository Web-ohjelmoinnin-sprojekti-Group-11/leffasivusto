// src/components/movies/MovieCard.jsx
import React from "react";
import PropTypes from "prop-types";

const MovieCard = ({ movie }) => (
  <div className="card h-100 shadow-sm">
    {movie.poster ? (
      <img src={movie.poster} className="card-img-top" alt={movie.title} />
    ) : (
      <div className="card-img-top d-flex align-items-center justify-content-center bg-light" style={{height: "375px"}}>
        <span className="text-muted">No image</span>
      </div>
    )}
    <div className="card-body">
      <h6 className="card-title mb-1">{movie.title}</h6>
      <small className="text-muted">
        {movie.releaseDate?.slice(0, 4)} • ⭐ {movie.vote?.toFixed(1)}
      </small>
      <p className="card-text mt-2 text-truncate" title={movie.overview}>
        {movie.overview}
      </p>
    </div>
  </div>
);

MovieCard.propTypes = {
  movie: PropTypes.object.isRequired,
};

export default MovieCard;
