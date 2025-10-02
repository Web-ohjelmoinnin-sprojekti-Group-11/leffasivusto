// src/pages/Groups/GroupDetail.jsx
import { useParams, useNavigate } from "react-router-dom";
import { Button, Alert, Spinner, Row, Col } from "react-bootstrap";

import useGroupBasics from "../../hooks/useGroupBasics";
import useGroupLibrary from "../../hooks/useGroupLibrary";
import useGroupShowtimes from "../../hooks/useGroupShowtimes";

import MovieCard from "../../components/movies/MovieCard";
import DetailModal from "../../components/movies/DetailModal";
import JoinRequests from "../../components/group/JoinRequests";
import MemberList from "../../components/group/MemberList";
import GroupShowtimes from "../../components/group/GroupShowtimes";

import { useState } from "react";

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { state, actions } = useGroupBasics(id, navigate);
  const { group, members, membership, loading, error } = state;
  const { removeMember, accept, reject, deleteGroup, leaveGroup } = actions;

  const { libLoading, libError, libMovies, loadLibrary } = useGroupLibrary(id);
  const { stLoading, stError, showtimes } = useGroupShowtimes(id);

  // modal
  const [showModal, setShowModal] = useState(false);
  const [modalItem, setModalItem] = useState(null);

  const isOwner = membership?.role === "admin";
  const pending = members.filter((m) => m.role === "pending");
  const normalMembers = members.filter((m) => m.role !== "pending");

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
          <JoinRequests pending={pending} onAccept={accept} onReject={reject} />
        </>
      )}

      {/* Members */}
      <h4 className="mt-2">Members</h4>
      <MemberList members={normalMembers} isOwner={isOwner} onRemove={removeMember} />

      {/* Group movies */}
      <div className="d-flex align-items-center justify-content-between">
        <h4 className="mt-2">Group movies</h4>
        <small className="text-muted">Click a card to open details. Detail modal has “Add to this group”.</small>
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
              <div role="button" onClick={() => openModal(m)} className="text-decoration-none">
                <MovieCard movie={m} />
                {m.added_by && <div className="small text-muted mt-1">added by {m.added_by}</div>}
              </div>
            </Col>
          ))}
        </Row>
      )}

      {/* Group showtimes (DB) */}
      <h4 className="mt-4">Group showtimes</h4>
      <GroupShowtimes loading={stLoading} error={stError} showtimes={showtimes} />

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
