import { useEffect, useState } from "react";
import { Card, Button, Stack, Spinner, Alert } from "react-bootstrap";
import { profileApi } from "../../services/profileService.js";

export default function Reviews() {
  const [items, setItems] = useState([]); const [busy, setBusy] = useState(true); const [err, setErr] = useState("");

  useEffect(() => {
    let on = true; (async () => {
      try { setBusy(true); setErr(""); const data = await profileApi.getReviews(); if (on) setItems(Array.isArray(data) ? data : []); }
      catch (e) { setErr(e?.message || "Error loading reviews"); }
      finally { on && setBusy(false); }
    })(); return () => { on = false; };
  }, []);

  const remove = async (id) => {
    const prev = items; setItems((s)=>s.filter(r=>(r.id ?? r.review_id) !== id)); // WHY: optimistic UI
    try { await profileApi.removeReview(id); } catch { setItems(prev); alert("Deletion failed"); }
  };

  if (busy) return <div className="py-3"><Spinner animation="border" size="sm" /> <span className="ms-2">Loading…</span></div>;
  if (err)  return <Alert variant="danger">{err}</Alert>;
  if (!items.length) return <div className="text-muted">No reviews yet.</div>;

  return (
    <Stack gap={3}>
      {items.map((r) => {
        const id = r.id ?? r.review_id;
        const title = r.movie?.title ?? r.title ?? "Movie";
        const rating = r.rating ?? r.stars ?? null;
        const text = r.text ?? r.body ?? "";
        const date = r.createdAt ?? r.created_at;
        return (
          <Card key={id}>
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div className="fw-semibold">{title}</div>
                {rating != null && <span className="badge bg-secondary">{rating}/10</span>}
              </div>
              {text && <Card.Text className="mt-2">{text}</Card.Text>}
              <div className="d-flex align-items-center justify-content-between mt-2">
                <small className="text-muted">{date ? new Date(date).toLocaleDateString() : ""}</small>
                <Button variant="outline-secondary" size="sm" onClick={()=>remove(id)}>Delete</Button>
              </div>
            </Card.Body>
          </Card>
        );
      })}
    </Stack>
  );
}
