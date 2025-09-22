import { useEffect, useState } from "react";
import { Card, Row, Col, Spinner, Alert } from "react-bootstrap";
import { profileApi } from "../../services/profileService.js";

export default function History() {
  const [items, setItems] = useState([]); const [busy, setBusy] = useState(true); const [err, setErr] = useState("");

  useEffect(() => {
    let on = true; (async () => {
      try { setBusy(true); setErr(""); const data = await profileApi.getHistory(); if (on) setItems(Array.isArray(data) ? data : []); }
      catch (e) { setErr(e?.message || "Error loading history"); }
      finally { on && setBusy(false); }
    })(); return () => { on = false; };
  }, []);

  if (busy) return <div className="py-3"><Spinner animation="border" size="sm" /> <span className="ms-2">Loading…</span></div>;
  if (err)  return <Alert variant="danger">{err}</Alert>;
  if (!items.length) return <div className="text-muted">No watch history yet.</div>;

  return (
    <Row xs={1} md={2} lg={3} className="g-3">
      {items.map((m) => {
        const id = m.id ?? m.movie_id ?? m.tmdb_id ?? m.movieId;
        const title = m.title ?? `Movie #${id}`;
        const poster = m.posterUrl || (m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null);
        const viewedAt = m.viewedAt ?? m.viewed_at;
        return (
          <Col key={id}>
            <Card className="h-100">
              {poster && <Card.Img variant="top" src={poster} alt={title} loading="lazy" />}
              <Card.Body>
                <Card.Title className="h6">{title}</Card.Title>
                <Card.Text className="text-muted small">
                  Watched: {viewedAt ? new Date(viewedAt).toLocaleString() : "—"}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
