// src/components/profile/WatchLater.jsx
import { useMemo } from "react"
import { Spinner, Alert } from "react-bootstrap"
import { useWatchLater } from "../../hooks/useWatchLater"
import MovieGrid from "../movies/MovieGrid.jsx"
import { getTitleDetails } from "../../services/movieService"

// TMDB image helper
const IMG = (p, size = "w500") => (p ? `https://image.tmdb.org/t/p/${size}${p}` : null)

export default function WatchLater() {
  const { watchLaterQ } = useWatchLater()

  const ids = useMemo(
    () => (Array.isArray(watchLaterQ.data) ? watchLaterQ.data.map((x) => Number(x?.id ?? x)) : []),
    [watchLaterQ.data]
  )

  const [movies, loading, error] = useWatchLaterMovies(ids)

  if (watchLaterQ.isPending || loading) {
    return (
      <div className="py-3">
        <Spinner animation="border" size="sm" /> <span className="ms-2">Loading…</span>
      </div>
    )
  }
  if (watchLaterQ.isError || error) {
    const msg = watchLaterQ.error?.message || error?.message || "Failed to load Watch Later list"
    return <Alert variant="danger">{msg}</Alert>
  }
  if (!movies.length) return <div className="text-muted">No movies in your Watch Later list yet.</div>

  return <MovieGrid movies={movies} />
}

import { useQueries } from "@tanstack/react-query"
function useWatchLaterMovies(ids) {
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