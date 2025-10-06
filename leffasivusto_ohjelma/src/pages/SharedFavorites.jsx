import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Spinner, Alert } from 'react-bootstrap'
import MovieGrid from '../components/movies/MovieGrid.jsx'
import api from '../services/api'
import { getTitleDetails } from '../services/movieService'

const IMG = (p, size = 'w500') => (p ? `https://image.tmdb.org/t/p/${size}${p}` : null)

export default function SharedFavorites() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [movies, setMovies] = useState([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true); setError(null)
      try {
        const res = await api.get(`/share/${token}`)
        const ids = (res.data?.movies || []).map((m) => Number(m.id))
        // fetch details in parallel (small lists expected)
        const details = await Promise.all(ids.map((id) => getTitleDetails('movie', id).then(d => d?.detail).catch(()=>null)))
        const mapped = details.filter(Boolean).map(d => ({
          id: d.id,
          title: d.title || d.name,
          poster: IMG(d.poster_path),
          releaseDate: d.release_date,
          type: 'movie'
        }))
        if (mounted) setMovies(mapped)
      } catch (e) {
        if (mounted) setError(e?.response?.data?.error || e?.message || 'Failed to load shared favorites')
      } finally { if (mounted) setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [token])

  if (loading) return <div className="py-3"><Spinner animation="border" size="sm" /> <span className="ms-2">Loading…</span></div>
  if (error) return <Alert variant="danger">{error}</Alert>
  if (!movies.length) return <div className="text-muted">No favorites found or list is empty.</div>
  return <div>
    <h2 className="mb-3">Favorites</h2>
    <MovieGrid movies={movies} />
  </div>
}
