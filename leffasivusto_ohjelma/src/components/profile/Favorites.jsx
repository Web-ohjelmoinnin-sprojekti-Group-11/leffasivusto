import { useEffect, useState, useMemo } from "react";
import { Card, Button, Row, Col, Spinner, Alert } from "react-bootstrap";
import { profileApi } from "../../services/profileService.js";

export default function Favorites() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setBusy(true); setErr("");
        const data = await profileApi.getFavorites();
        if (on) setItems(Array.isArray(data) ? data : []);
      } catch (e) { setErr(e?.message || "Error loading favorites"); }
      finally { on && setBusy(false); }
    })();
    return () => { on = false; };
  }, []);

  const handleRemove = async (movieId) => {
    const prev = items; setItems((s)=>s.filter(m=> (m.id ?? m.movie_id) !== movieId)); // WHY: optimistic UI
    try { await profileApi.removeFavorite(movieId); } catch { setItems(prev); alert("Removal failed"); }
  };

  const Grid = useMemo(() => (
    <Row xs={1} md={2} lg={3} className="g-3">
      {items.map((m) => {
        const id = m.id ?? m.movie_id ?? m.tmdb_id ?? m.movieId;
        const title = m.title ?? m.name ?? `Movie #${id}`;
        const poster = m.posterUrl || m.poster || (m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null);
        const subtitle = [m.year, Array.isArray(m.genres) ? m.genres.join(", ") : m.genre].filter(Boolean).join(" • ");
        return (
          <Col key={id}>
            <Card className="h-100">
              {poster && <Card.Img variant="top" src={poster} alt={title} loading="lazy" />}
              <Card.Body className="d-flex flex-column">
                <Card.Title className="h6">{title}</Card.Title>
                {subtitle && <Card.Text className="text-muted small">{subtitle}</Card.Text>}
                <div className="mt-auto d-flex gap-2">
                  <Button variant="outline-secondary" size="sm" onClick={()=>handleRemove(id)}>Remove</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        );
      })}
    </Row>
  ), [items]);

  if (busy) return <div className="py-3"><Spinner animation="border" size="sm" /> <span className="ms-2">Loading…</span></div>;
  if (err)  return <Alert variant="danger">{err}</Alert>;
  if (!items.length) return <div className="text-muted">No favorites yet.</div>;
  return <>{Grid}</>;
}