// src/components/movies/MovieCard.jsx
<<<<<<< Updated upstream
import React from "react";
import PropTypes from "prop-types";
=======
import React from 'react'
import PropTypes from 'prop-types'
import { Heart } from 'lucide-react'
import { useFavorites } from '../../hooks/useFavorites'
import { useAuth } from '../../state/AuthContext.jsx'
>>>>>>> Stashed changes

const btnBase = 'floating-heart-btn btn btn-light rounded-pill shadow-sm'

<<<<<<< Updated upstream
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
=======
export default function MovieCard({ movie }) {
  const { isFavorited, toggle, adding, removing } = useFavorites()
  const { isAuthenticated } = useAuth()
  const fav = isFavorited(movie.id)
  const disabled = adding || removing

  const onHeart = (e) => {
    e.stopPropagation()
    e.preventDefault()
    toggle(movie)
  }

  return (
    <div className="card h-100 shadow-sm movie-card position-relative">
      {movie.poster ? (
        <img src={movie.poster} className="card-img-top" alt={movie.title ? `Poster for ${movie.title}` : 'Poster'} />
      ) : (
        <div className="ratio ratio-2x3 bg-secondary-subtle d-flex align-items-center justify-content-center">
          <span className="text-muted small">No image</span>
        </div>
      )}

      <div className="card-body p-2">
        <div className="text-truncate fw-semibold" title={movie.title || movie.name || ''}>
          {movie.title || movie.name || 'Untitled'}
        </div>
        {movie.releaseDate && (
          <div className="text-muted small">{String(movie.releaseDate).slice(0, 4)}</div>
>>>>>>> Stashed changes
        )}
      </div>

      <button
        type="button"
        aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
        aria-pressed={fav}
        disabled={disabled || (!isAuthenticated && false)}
        className={`${btnBase} ${fav ? 'is-active' : ''}`}
        onClick={onHeart}
      >
        <Heart
          size={20}
          className="heart-icon"
          /* Why: fill for pressed state to look full */
          style={{ fill: fav ? 'currentColor' : 'transparent', transition: 'fill 120ms ease' }}
        />
        <span className="visually-hidden">{fav ? 'Favorited' : 'Not favorited'}</span>
      </button>
    </div>
  )
}

MovieCard.propTypes = {
  movie: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    name: PropTypes.string,
    poster: PropTypes.string,
    overview: PropTypes.string,
    releaseDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  }).isRequired,
}
