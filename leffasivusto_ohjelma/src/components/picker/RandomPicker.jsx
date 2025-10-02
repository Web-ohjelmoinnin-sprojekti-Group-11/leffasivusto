// src/components/picker/RandomPicker.jsx
import { useMemo, useState } from "react";
import { Form, Row, Col, Button, Card, Spinner } from "react-bootstrap";
import { randomPick } from "../../services/pickerService";
import DetailModal from "../movies/DetailModal";

import { Heart, Clock } from "lucide-react";
import { useFavorites } from "../../hooks/useFavorites";
import { useWatchLater } from "../../hooks/useWatchLater";
import { useAuth } from "../../state/AuthContext.jsx";

// TMDB movie genres (common)
const GENRES = [
  { id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" }, { id: 80, name: "Crime" }, { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" }, { id: 10751, name: "Family" }, { id: 14, name: "Fantasy" },
  { id: 36, name: "History" }, { id: 27, name: "Horror" }, { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" }, { id: 10749, name: "Romance" }, { id: 878, name: "Sci-Fi" },
  { id: 10770, name: "TV Movie" }, { id: 53, name: "Thriller" }, { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

export default function RandomPicker() {
  const [keyword, setKeyword] = useState("");
  const [genreId, setGenreId] = useState("");           // optional
  const [decade, setDecade] = useState(2020);           // required
  const [loading, setLoading] = useState(false);
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);       // DetailModal

  // 2020s → 1920s
  const DECADES = useMemo(() => {
    return Array.from({ length: 2020 - 1920 + 1 }, (_, i) => 2020 - i)
      .filter((y) => y % 10 === 0)
      .map((y) => ({ label: `${y}s`, value: y }));
  }, []);

  // samat hookit kuin MovieCardissa
  const { isFavorited, toggle: toggleFavorite, adding, removing } = useFavorites();
  const { isInWatchLater, toggle: toggleWatchLater, adding: addingWL, removing: removingWL } = useWatchLater();
  const { isAuthenticated } = useAuth();

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    setLoading(true); setError(null); setMovie(null);
    try {
      const data = await randomPick({
        keyword: keyword.trim(),
        genreId: genreId ? Number(genreId) : null,
        decade
      });
      setMovie(data);
      localStorage.setItem("picker_last_v2", JSON.stringify({ keyword, genreId, decade }));
    } catch (e2) {
      setError(e2?.response?.data?.error || "No movie found.");
    } finally {
      setLoading(false);
    }
  };

  // Modalille sopiva item
  const detailItem = movie ? {
    id: movie.id,
    title: movie.title,
    name: movie.title,
    overview: movie.overview,
    releaseDate: movie.releaseDate,
    poster_path: movie.posterUrl
      ? movie.posterUrl.replace("https://image.tmdb.org/t/p/w500", "")
      : null,
    vote_average: movie.vote ?? null,
    media_type: "movie",
  } : null;

  // MovieCard-tyylinen objekti hookeille
  const cardMovie = movie ? {
    id: movie.id,
    title: movie.title,
    name: movie.title,
    poster: movie.posterUrl || null, // MovieCard käyttää `poster`
    overview: movie.overview || "",
    vote: typeof movie.vote === "number" ? movie.vote : undefined,
    releaseDate: movie.releaseDate || null,
    mediaType: "movie",
  } : null;

  const fav = movie ? isFavorited(movie.id) : false;
  const inWatchLater = movie ? isInWatchLater(movie.id) : false;
  const favDisabled = adding || removing || !isAuthenticated;
  const wlDisabled = addingWL || removingWL || !isAuthenticated;
  const btnBase = "floating-heart-btn btn btn-light rounded-pill shadow-sm";

  return (
    <>
      {/* Valinnat: labelit jokaisen laatikon yläpuolella ja linjassa */}
      <Form onSubmit={onSubmit}>
        <Row className="g-2">
          <Col md={5}>
            <Form.Group controlId="rpKeyword">
              <Form.Label className="small text-muted fw-semibold">Keyword</Form.Label>
              <Form.Control
                placeholder="Keyword (e.g. space, heist)"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group controlId="rpGenre">
              <Form.Label className="small text-muted fw-semibold">Genre</Form.Label>
              <Form.Select
                value={genreId}
                onChange={(e) => setGenreId(e.target.value)}
              >
                <option value="">(Optional) Genre</option>
                {GENRES.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={4}>
            <Form.Group controlId="rpEra">
              <Form.Label className="small text-muted fw-semibold">Era</Form.Label>
              <Form.Select
                value={decade}
                onChange={(e) => setDecade(Number(e.target.value))}
              >
                {DECADES.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <div className="mt-3 d-flex gap-2">
          <Button type="submit" disabled={loading || (!keyword && !genreId && !decade)}>
            {loading ? <Spinner size="sm" /> : "Find a movie"}
          </Button>
        </div>
      </Form>

      {error && <div className="alert alert-warning mt-3">{error}</div>}

      {movie && (
        <Card
          className="mt-3 position-relative"
          style={{ maxWidth: 900, cursor: "pointer" }}
          role="button"
          onClick={() => setSelected(detailItem)}
        >
          <div className="d-flex">
            {/* ISO posteri + napit oikeassa yläkulmassa */}
            <div
              className="poster-wrap position-relative me-3"
              style={{ width: 300, minWidth: 300 }}
            >
              {/* ❤️ */}
              <button
                type="button"
                aria-label={fav ? "Remove from favorites" : "Add to favorites"}
                aria-pressed={fav}
                disabled={favDisabled}
                className={`${btnBase} heart-top-right ${fav ? "is-active" : ""}`}
                onClick={(e) => { e.stopPropagation(); toggleFavorite(cardMovie); }}
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

              {/* ⏰ */}
              <button
                type="button"
                aria-label={inWatchLater ? "Remove from watch later" : "Add to watch later"}
                aria-pressed={inWatchLater}
                disabled={wlDisabled}
                className={`${btnBase} clock-top-right ${inWatchLater ? "is-active" : ""}`}
                onClick={(e) => { e.stopPropagation(); toggleWatchLater(cardMovie); }}
              >
                <Clock
                  size={20}
                  className="clock-icon"
                  style={{
                    fill: inWatchLater ? "currentColor" : "transparent",
                    transition: "fill 120ms ease",
                  }}
                />
                <span className="visually-hidden">
                  {inWatchLater ? "In Watch Later" : "Add to Watch Later"}
                </span>
              </button>

              {movie.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="card-img-top card-poster"
                  style={{ width: "100%", height: "auto", objectFit: "cover", borderRadius: 4 }}
                />
              ) : (
                <div
                  className="ratio ratio-2x3 bg-secondary-subtle d-flex align-items-center justify-content-center"
                  style={{ width: 300, minWidth: 300 }}
                >
                  <span className="text-muted small">No image</span>
                </div>
              )}
            </div>

            <Card.Body>
              <Card.Title className="mb-1">
                {movie.title}{" "}
                {movie.releaseDate && <small>({String(movie.releaseDate).slice(0,4)})</small>}
              </Card.Title>
              <Card.Text className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
                {movie.overview || "No overview available."}
              </Card.Text>
              <div className="text-muted small mt-2">Click to view full details</div>
            </Card.Body>
          </div>
        </Card>
      )}

      {/* DetailModal avautuu tästä komponentista */}
      <DetailModal show={!!selected} item={selected} onHide={() => setSelected(null)} />
    </>
  );
}
