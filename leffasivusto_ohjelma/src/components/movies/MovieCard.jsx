import { Card, Button } from 'react-bootstrap'

export default function MovieCard({ movie }) {
  const poster = movie?.poster_path
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : 'https://via.placeholder.com/342x513?text=No+Image'

  return (
    <Card className="h-100">
      <div className="ratio ratio-2x3">
        <img src={poster} alt={movie.title} className="object-fit-cover" />
      </div>
      <Card.Body>
        <Card.Title className="fs-6">{movie.title}</Card.Title>
        <Card.Text className="small mb-2">
          {movie.release_date?.slice(0,4)} • {movie.vote_average?.toFixed(1)}
        </Card.Text>
        <div className="d-flex justify-content-between">
          <Button size="sm" variant="outline-primary">Details</Button>
          <Button size="sm" variant="outline-warning">☆ Favorite</Button>
        </div>
      </Card.Body>
    </Card>
  )
}
