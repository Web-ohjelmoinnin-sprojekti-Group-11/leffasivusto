// src/components/movies/MovieCard.jsx
import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Heart } from 'lucide-react'
import { useFavorites } from '../../hooks/useFavorites'
import { useAuth } from '../../state/AuthContext.jsx'

const btnBase = 'floating-heart-btn btn btn-light rounded-pill shadow-sm'

export default function MovieCard({ movie }) {
  // Sydän / suosikit
  const { isFavorited, toggle, adding, removing } = useFavorites()
  const { isAuthenticated } = useAuth()
  const fav = isFavorited(movie.id)
  const disabled = adding || removing

  // Hover-viive: 1.5 s ennen kuin kuvaus aukeaa
  const [reveal, setReveal] = useState(false)
  const hoverTimer = useRef(null)

  const onEnter = () => {
    if (!movie.overview) return
    hoverTimer.current = setTimeout(() => setReveal(true), 1500)
  }

  const onLeave = () => {
    clearTimeout(hoverTimer.current)
    hoverTimer.current = null
    setReveal(false)
  }

  useEffect(() => () => clearTimeout(hoverTimer.current), [])

  const onHeart = (e) => {
    e.stopPropagation()
    e.preventDefault()
    toggle(movie)
  }

  const title = movie.title || movie.name || 'Untitled'
  const year =
    movie.releaseDate
      ? String(movie.releaseDate).slice(0, 4)
      : undefined

  return (
    <div
      className={`card h-100 shadow-sm movie-card ${reveal ? 'is-revealed' : ''}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {movie.poster ? (
        <img
          src={movie.poster}
          className="card-img-top"
          alt={title ? `Poster for ${title}` : 'Poster'}
          loading="lazy"
        />
      ) : (
        <div className="ratio ratio-2x3 bg-secondary-subtle d-flex align-items-center justify-content-center">
          <span className="text-muted small">No image</span>
        </div>
      )}

      <div className="card-body p-2">
        <div className="d-flex align-items-center justify-content-between">
          <div className="text-truncate fw-semibold" title={title}>
            {title}
          </div>
        </div>

        {(year || typeof movie.vote === 'number') && (
          <small className="movie-meta">
            {year}
            {typeof movie.vote === 'number' && ` • ⭐ ${movie.vote.toFixed(1)}`}
          </small>
        )}

        {movie.overview && (
          <div
            className="overview-wrap"
            aria-hidden={!reveal}
            title={movie.overview}
          >
            <p className="card-text overview-content">{movie.overview}</p>
          </div>
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
    vote: PropTypes.number,
    releaseDate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.instanceOf(Date),
    ]),
  }).isRequired,
}

