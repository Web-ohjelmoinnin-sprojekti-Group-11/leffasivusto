// src/pages/Groups/GroupDetail.jsx
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, ListGroup, Alert, Spinner, Row, Col } from "react-bootstrap";
import api from "../../services/api";
import { getToken } from "../../services/token";

import MovieCard from "../../components/movies/MovieCard";
import DetailModal from "../../components/movies/DetailModal";

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Authorization header (memoituna ettei muutu joka renderillä)
  const auth = useMemo(
    () => ({ headers: { Authorization: `Bearer ${getToken()}` } }),
    []
  );

  // Group library
  const [libLoading, setLibLoading] = useState(true);
  const [libError, setLibError] = useState(null);
  const [libMovies, setLibMovies] = useState([]);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalItem, setModalItem] = useState(null);

  // Ryhmän perustiedot + oma rooli + jäsenet
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const g = await api.get(`/groups/${id}`, auth);
        setGroup(g.data.group);
        setMembership(g.data.membership || null);

        try {
          const m = await api.get(`/group_members/${id}`, auth);
          setMembers(m.data.members || []);
        } catch {
          setMembers([]);
        }
      } catch (err) {
        if (err?.response?.status === 403) {
          navigate("/groups");
          return;
        }
        console.error(err);
        setError("Failed to load group");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate, auth]);

  // Lataa ryhmän elokuvat (kutsutaan myös onnistuneen lisäyksen jälkeen)
  const loadLibrary = async () => {
    try {
      setLibLoading(true);
      setLibError(null);
      setLibMovies([]);

      // 1) Movie-id:t ryhmälle
      const gc = await api.get(`/group_content/${id}/movies`, auth);
      const items = gc.data?.movies || [];

      // 2) Hae TMDB-detaljit ja rakenna kortit
      const results = await Promise.all(
        items.map(async (x) => {
          const tmdbId = Number(x.movie_id);

          let payload = null;
          try {
            const r1 = await api.get(`/tmdb/title/${tmdbId}`);
            payload = r1.data || null;
          } catch (e1) {
            if (e1?.response?.status === 404) {
              try {
                const r2 = await api.get(`/tmdb/tv/${tmdbId}`);
                payload = r2.data || null;
              } catch {
                payload = null;
              }
            }
          }

          if (!payload) {
            return {
              id: tmdbId,
              title: `#${tmdbId}`,
              name: null,
              poster: null,
              overview: "",
              vote_average: null,
              releaseDate: "",
              added_by: x.added_by,
              mediaType: "movie", // oletus jos ei saatu detaileja
            };
          }

          const d = payload.detail || payload;
          const mediaType = d.title ? "movie" : "tv";

          return {
            id: tmdbId,
            title: d.title || d.name || `#${tmdbId}`,
            name: d.name,
            poster: d.poster_path
              ? `https://image.tmdb.org/t/p/w500${d.poster_path}`
              : null,
            overview: d.overview || "",
            vote_average:
              typeof d.vote_average === "number" ? d.vote_average : null,
            releaseDate: d.release_date || d.first_air_date || "",
            added_by: x.added_by,
            mediaType, // *** TÄRKEÄ: camelCase ***
          };
        })
      );

      setLibMovies(results);
    } catch (err) {
      console.error(err);
      setLibError("Failed to load group movies");
    } finally {
      setLibLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isOwner = membership?.role === "admin";

  const removeMember = async (userId) => {
    try {
      await api.delete(`/group_members/${id}/members/${userId}`, auth);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (err) {
      console.error("Failed to remove member:", err);
      setError("Failed to remove member");
    }
  };

  const accept = async (userId) => {
    try {
      await api.post(
        `/group_members/${id}/requests/${userId}`,
        { action: "accept" },
        auth
      );
      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, role: "member" } : m))
      );
    } catch (err) {
      console.error("Accept failed:", err);
      setError("Failed to accept request");
    }
  };

  const reject = async (userId) => {
    try {
      await api.post(
        `/group_members/${id}/requests/${userId}`,
        { action: "reject" },
        auth
      );
      setMembers((prev) =>
        prev.filter((m) => !(m.user_id === userId && m.role === "pending"))
      );
    } catch (err) {
      console.error("Reject failed:", err);
      setError("Failed to reject request");
    }
  };

  const deleteGroup = async () => {
    if (!group) return;
    if (
      !window.confirm(
        `Delete group "${group.group_name}"? This cannot be undone.`
      )
    )
      return;
    try {
      await api.delete(`/groups/${id}`, auth);
      navigate("/groups");
    } catch (err) {
      console.error("Group delete error:", err);
      setError("Failed to delete group");
    }
  };

  const leaveGroup = async () => {
    if (!window.confirm("Leave this group?")) return;
    try {
      await api.delete(`/group_members/${id}/leave`, auth);
      navigate("/groups");
    } catch (err) {
      console.error("Leave group error:", err);
      setError(err?.response?.data?.error || "Failed to leave group");
    }
  };

  // Avataan modal – annetaan mukaan myös mediaType
  const openModal = (m) => {
    setModalItem({
      id: Number(m.id),
      title: m.title,
      name: m.name,
      mediaType: m.mediaType || "movie",
    });
    setShowModal(true);
  };

  if (error) return <Alert variant="danger" className="mt-3">{error}</Alert>;
  if (loading) return <div className="my-4"><Spinner animation="border" /></div>;
  if (!group) return <p>Not found.</p>;

  const pending = members.filter((m) => m.role === "pending");
  const normalMembers = members.filter((m) => m.role !== "pending");

  return (
    <div>
      <div className="d-flex align-items-start justify-content-between">
        <h2 className="mb-3">{group.group_name}</h2>

        {isOwner ? (
          <Button variant="danger" onClick={deleteGroup}>Delete group</Button>
        ) : membership?.role === "member" ? (
          <Button variant="outline-danger" onClick={leaveGroup}>Leave group</Button>
        ) : null}
      </div>

      {/* Join requests (owner only) */}
      {isOwner && (
        <>
          <h4 className="mt-3">Join requests</h4>
          {pending.length === 0 ? (
            <p className="text-muted">No pending requests.</p>
          ) : (
            <ListGroup className="mb-4">
              {pending.map((r) => (
                <ListGroup.Item
                  key={r.user_id}
                  className="d-flex justify-content-between align-items-center"
                >
                  <span>{r.username || r.email || r.user_id}</span>
                  <div>
                    <Button
                      size="sm"
                      variant="success"
                      className="me-2"
                      onClick={() => accept(r.user_id)}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => reject(r.user_id)}
                    >
                      Reject
                    </Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </>
      )}

      {/* Members */}
      <h4 className="mt-2">Members</h4>
      {normalMembers.length === 0 ? (
        <p className="text-muted">No members.</p>
      ) : (
        <ListGroup className="mb-4">
          {normalMembers.map((m) => (
            <ListGroup.Item
              key={m.user_id}
              className="d-flex justify-content-between align-items-center"
            >
              <span>
                {m.username || m.email || m.user_id} ({m.role})
              </span>
              {isOwner && m.role !== "admin" && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => removeMember(m.user_id)}
                >
                  Remove
                </Button>
              )}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      {/* Group movies */}
      <div className="d-flex align-items-center justify-content-between">
        <h4 className="mt-2">Group movies</h4>
        <small className="text-muted">
          Click a card to open details. Detail modal has “Add to this group”.
        </small>
      </div>

      {libLoading ? (
        <div className="my-4"><Spinner animation="border" /></div>
      ) : libError ? (
        <Alert variant="warning">{libError}</Alert>
      ) : libMovies.length === 0 ? (
        <p className="text-muted">No movies yet. Open a movie and click “Add to this group”.</p>
      ) : (
        <Row xs={2} sm={3} md={4} lg={6} className="g-3 mt-1">
          {libMovies.map((m) => (
            <Col key={`${m.id}-${m.mediaType || "movie"}`}>
              <div
                role="button"
                onClick={() => openModal(m)}
                className="text-decoration-none"
              >
                <MovieCard movie={m} />
                {m.added_by && (
                  <div className="small text-muted mt-1">added by {m.added_by}</div>
                )}
              </div>
            </Col>
          ))}
        </Row>
      )}

      <DetailModal
        show={showModal}
        onHide={() => setShowModal(false)}
        item={modalItem}
        groupId={id}
        onAddedToGroup={loadLibrary}
      />
    </div>
  );
}
