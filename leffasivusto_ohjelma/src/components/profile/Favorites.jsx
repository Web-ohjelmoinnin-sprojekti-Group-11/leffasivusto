// src/components/profile/Favorites.jsx
import { useMemo } from "react"
import { Spinner, Alert } from "react-bootstrap"
import { useFavorites } from "../../hooks/useFavorites"
import MovieGrid from "../movies/MovieGrid.jsx"
import { getTitleDetails } from "../../services/movieService"

// TMDB image helper
const IMG = (p, size = "w500") => (p ? `https://image.tmdb.org/t/p/${size}${p}` : null)

export default function Favorites() {
  const { favoritesQ } = useFavorites()

  const ids = useMemo(
    () => (Array.isArray(favoritesQ.data) ? favoritesQ.data.map((x) => Number(x?.id ?? x)) : []),
    [favoritesQ.data]
  )

  // Fetch minimal details for each favorite id
  // Keep it simple: small lists are fine; for large lists consider batching or pagination.
  const [movies, loading, error] = useFavoriteMovies(ids)

  if (favoritesQ.isPending || loading) {
    return <div className="py-3"><Spinner animation="border" size="sm" /> <span className="ms-2">Loading…</span></div>
  }
  if (favoritesQ.isError || error) {
    const msg = favoritesQ.error?.message || error?.message || "Failed to load favorites"
    return <Alert variant="danger">{msg}</Alert>
  }
  if (!movies.length) return <div className="text-muted">No favorites yet.</div>

  return <MovieGrid movies={movies} />
}

import { useQueries } from "@tanstack/react-query"
function useFavoriteMovies(ids) {
  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["title", "movie", id],
      queryFn: async () => {
        const data = await getTitleDetails("movie", id)
        const d = data?.detail
        return {
          id,
          title: d?.title || d?.name || `#${id}`,
          poster: IMG(d?.poster_path),
          releaseDate: d?.release_date,
          type: "movie",
        }
      },
      staleTime: 5 * 60_000,
    })),
  })

  const loading = queries.some((q) => q.isPending)
  const error = queries.find((q) => q.isError)?.error || null
  const movies = queries.filter((q) => q.isSuccess && q.data).map((q) => q.data)
  return [movies, loading, error]
}
