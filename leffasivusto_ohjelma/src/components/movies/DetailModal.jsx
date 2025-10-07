// src/components/movies/DetailModal.jsx
import React, { useEffect, useState } from "react";
import { Modal, Button, Spinner, Form, Card, Badge } from "react-bootstrap";
import useDetails from "../../hooks/useDetails";
import * as reviewApi from "../../services/reviewService";
import { getToken } from "../../services/token";
import api from "../../services/api";

const IMG = (p, size = "w500") => (p ? `https://image.tmdb.org/t/p/${size}${p}` : null);

/**
 * Props:
 * - show: boolean
 * - item: { id | tmdb_id | movie_id | movieId, ... }
 * - onHide: () => void
 * - groupId?: number|string            // if provided -> single "Add to this group" button
 * - onAddedToGroup?: () => void        // optional callback after successful add
 */
export default function DetailModal({ show, item, onHide, groupId, onAddedToGroup }) {
  // 🔧 tärkeä muutos: ymmärtää myös movie_id / movieId
  const tmdbId = item?.id ?? item?.tmdb_id ?? item?.movie_id ?? item?.movieId ?? null;

  // TMDB details
  const { data, loading, error } = useDetails(item);

  // Reviews
  const [summary, setSummary] = useState({ count: 0, avg: 0 });
  const [reviews, setReviews] = useState([]);
  const [my, setMy] = useState(null);

  const isAuthed = !!getToken();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  // Add-to-group states
  const [adding, setAdding] = useState(false);
  const [addErr, setAddErr] = useState("");

  // If not on group page, allow choosing the target group
  const [myGroups, setMyGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");

  const isPerson = data?.kind === "person";
  const canAddSingle = !!groupId && !!tmdbId && isAuthed && !isPerson;
  const canChooseGroup = !groupId && !!tmdbId && isAuthed && !isPerson;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!show || !tmdbId) return;

      try {
        const [sum, list] = await Promise.all([
          reviewApi.getSummary(tmdbId),
          reviewApi.getByMovie(tmdbId, { limit: 20, offset: 0 }),
        ]);
        if (cancelled) return;
        setSummary(sum || { count: 0, avg: 0 });
        setReviews(Array.isArray(list) ? list : []);
      } catch {
        /* ignore */
      }

      if (isAuthed) {
        try {
          const mine = await reviewApi.getMine();
          if (cancelled) return;
          const mineForThis = (mine || []).find((r) => r.movie_id === tmdbId) || null;
          setMy(mineForThis);
          if (mineForThis) {
            setRating(mineForThis.rating);
            setText(mineForThis.text || "");
          } else {
            setRating(5);
            setText("");
          }
        } catch {
          setMy(null);
        }
      } else {
        setMy(null);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [show, tmdbId, isAuthed]);

  // Load my groups when selection UI is needed
  useEffect(() => {
    const loadGroups = async () => {
      if (!show || !canChooseGroup) return;
      try {
        const res = await api.get("/groups/mine", {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const groups = res.data?.groups || [];
        setMyGroups(groups);
        setSelectedGroup(groups[0]?.group_id ?? "");
      } catch {
        setMyGroups([]);
        setSelectedGroup("");
      }
    };
    loadGroups();
  }, [show, canChooseGroup]);

  const handleSave = async () => {
    if (!isAuthed) {
      setSaveErr("Please sign in to add a review.");
      return;
    }
    if (!(rating >= 1 && rating <= 5) || !text.trim()) {
      setSaveErr("Rating (1–5) and text are required.");
      return;
    }
    setSaveErr("");
    setSaving(true);
    try {
      const saved = await reviewApi.createOrUpdate({ movie_id: tmdbId, rating, text });
      setMy(saved);
      const [sum, list] = await Promise.all([
        reviewApi.getSummary(tmdbId),
        reviewApi.getByMovie(tmdbId, { limit: 20, offset: 0 }),
      ]);
      setSummary(sum || { count: 0, avg: 0 });
      setReviews(Array.isArray(list) ? list : []);
    } catch (e) {
      setSaveErr(e?.response?.data?.error || "Saving failed");
    } finally {
      setSaving(false);
    }
  };

  const postAdd = async (targetGroupId) => {
    setAddErr("");
    setAdding(true);
    try {
      await api.post(
        `/group_content/${targetGroupId}/movies`,
        { movie_id: tmdbId },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (onAddedToGroup) onAddedToGroup();
    } catch (e) {
      setAddErr(e?.response?.data?.error || "Failed to add to group");
    } finally {
      setAdding(false);
    }
  };

  const handleAddToGroup = () => postAdd(groupId);
  const handleAddToChosen = () => {
    if (!selectedGroup) {
      setAddErr("Select a group first");
      return;
    }
    postAdd(selectedGroup);
  };

  if (!show) return null;
  const title = item?.title || item?.name || "Details";

  // ---------- BODY ----------
  let body = null;

  if (loading) {
    body = (
      <div className="text-center p-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  } else if (error) {
    body = <div className="text-danger p-3">{error}</div>;
  } else if (data?.kind === "title" || data?.kind === "movie" || data?.kind === "tv") {
    const d = data.detail;
    const credits = data.credits || {};
    const cast = (credits.cast || []).slice(0, 10);
    const crew = (credits.crew || [])
      .filter((c) => /Directing/i.test(c.known_for_department || c.department))
      .slice(0, 5);

    body = (
      <div className="row g-3">
        <div className="col-12 col-md-4">
          {d?.poster_path && <img src={IMG(d.poster_path)} alt={d.title || d.name} className="img-fluid rounded" />}
        </div>
        <div className="col-12 col-md-8">
          <h4 className="mb-1">{d?.title || d?.name}</h4>
          <div className="text-muted mb-2">
            {(d?.release_date || d?.first_air_date || "").slice(0, 4)} • ⭐ {Number(d?.vote_average || 0).toFixed(1)}
          </div>
          {d?.overview && <p className="mb-3">{d.overview}</p>}

          {!!crew.length && (
            <>
              <h6 className="mt-3">Director(s)</h6>
              <ul className="mb-2">
                {crew.map((c) => (
                  <li key={c.credit_id || c.id}>{c.name}</li>
                ))}
              </ul>
            </>
          )}

          {!!cast.length && (
            <>
              <h6 className="mt-3">Cast</h6>
              <ul className="mb-3">
                {cast.map((c) => (
                  <li key={c.cast_id || c.credit_id || c.id}>
                    {c.name}
                    {c.character ? ` as ${c.character}` : ""}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Reviews summary */}
          <Card className="mb-3">
            <Card.Body className="d-flex align-items-center justify-content-between">
              <div>
                <div className="fw-semibold">Community rating</div>
                <div className="text-muted">
                  {summary.count} review{summary.count === 1 ? "" : "s"}
                </div>
              </div>
              <div>
                <Badge bg="warning" text="dark" className="fs-5">
                  ⭐ {summary.avg?.toFixed ? summary.avg.toFixed(1) : Number(summary.avg || 0).toFixed(1)}
                </Badge>
              </div>
            </Card.Body>
          </Card>

          {/* Community reviews */}
          {!!reviews.length && (
            <div className="mb-3">
              <h6 className="mt-2">Community reviews</h6>
              <ul className="mb-0">
                {reviews.slice(0, 5).map((r) => (
                  <li key={r.review_id} className="mb-1">
                    <span className="me-2">⭐ {r.rating}</span>
                    {r.created_at && (
                      <span className="text-muted me-2">
                        ({new Date(r.created_at).toLocaleDateString()})
                      </span>
                    )}
                    <span className="me-2">{r.user_email || r.user || r.user_id}</span>
                    {r.text && <span>— {r.text}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* My review form */}
          {isAuthed && (
            <Card className="mb-3">
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="fw-semibold">{my ? "Update your review" : "Add your review"}</div>
                  {my && (
                    <Badge bg="secondary" title="Your current rating">
                      ⭐ {my.rating}
                    </Badge>
                  )}
                </div>
                <Form>
                  <Form.Group className="mb-2">
                    <Form.Label>Rating (1–5)</Form.Label>
                    <Form.Select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Your review</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Write a short review..."
                    />
                  </Form.Group>
                  {saveErr && <div className="text-danger mb-2">{saveErr}</div>}
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save review"}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          )}

          {/* Add to group - single button (group page) */}
          {canAddSingle && (
            <div className="mt-3 d-flex align-items-center">
              <Button variant="primary" onClick={handleAddToGroup} disabled={adding}>
                {adding ? "Adding..." : "Add to this group"}
              </Button>
              {addErr && <div className="text-danger ms-3">{addErr}</div>}
            </div>
          )}

          {/* Add to group - choose target group (outside group page) */}
          {canChooseGroup && (
            <Card className="mt-3">
              <Card.Body className="d-flex flex-wrap align-items-center gap-2">
                <Form.Select
                  style={{ maxWidth: 320 }}
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                >
                  {myGroups.length === 0 && <option value="">No groups</option>}
                  {myGroups.map(g => (
                    <option key={g.group_id} value={g.group_id}>
                      {g.group_name} {g.role === "admin" ? "(owner)" : ""}
                    </option>
                  ))}
                </Form.Select>
                <Button onClick={handleAddToChosen} disabled={adding || !selectedGroup}>
                  {adding ? "Adding..." : "Add to selected group"}
                </Button>
                {addErr && <div className="text-danger">{addErr}</div>}
              </Card.Body>
            </Card>
          )}
        </div>
      </div>
    );
  } else if (data?.kind === "person") {
    const p = data.person;
    const cast = (data.credits?.cast || []).slice(0, 10);
    const crew = (data.credits?.crew || []).slice(0, 10);

    body = (
      <div className="row g-3">
        <div className="col-12 col-md-4">
          {p?.profile_path && <img src={IMG(p.profile_path)} alt={p.name} className="img-fluid rounded" />}
        </div>
        <div className="col-12 col-md-8">
          <h4 className="mb-1">{p?.name}</h4>
          <div className="text-muted mb-2">{p?.known_for_department}</div>
          {p?.biography && <p className="mb-3">{p.biography}</p>}

          {!!cast.length && (
            <>
              <h6 className="mt-3">Known for (acting)</h6>
              <ul className="mb-2">
                {cast.map((c) => (
                  <li key={`${c.credit_id || c.id}-cast`}>
                    {(c.title || c.name) || "—"} {c.release_date ? `(${c.release_date.slice(0, 4)})` : ""}
                  </li>
                ))}
              </ul>
            </>
          )}

          {!!crew.length && (
            <>
              <h6 className="mt-3">Crew</h6>
              <ul className="mb-0">
                {crew.map((c) => (
                  <li key={`${c.credit_id || c.id}-crew`}>
                    {c.job} — {(c.title || c.name) || "—"} {c.release_date ? `(${c.release_date.slice(0, 4)})` : ""}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    );
  } else {
    body = <div className="p-3">No details.</div>;
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg" dialogClassName="modal-xxl">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
