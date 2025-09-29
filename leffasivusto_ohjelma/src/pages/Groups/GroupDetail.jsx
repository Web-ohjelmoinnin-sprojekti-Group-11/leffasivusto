import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, ListGroup, Alert, Spinner } from "react-bootstrap";
import api from "../../services/api";
import { getToken } from "../../services/token";

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [membership, setMembership] = useState(null); // { role: 'admin'|'member' }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const auth = { headers: { Authorization: `Bearer ${getToken()}` } };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) group + my role
        const g = await api.get(`/groups/${id}`, auth);
        setGroup(g.data.group);
        setMembership(g.data.membership || null);

        // 2) members (includes pending)
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
      await api.post(`/group_members/${id}/requests/${userId}`, { action: "accept" }, auth);
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
      await api.post(`/group_members/${id}/requests/${userId}`, { action: "reject" }, auth);
      setMembers((prev) => prev.filter((m) => !(m.user_id === userId && m.role === "pending")));
    } catch (err) {
      console.error("Reject failed:", err);
      setError("Failed to reject request");
    }
  };

  const deleteGroup = async () => {
    if (!group) return;
    if (!window.confirm(`Delete group "${group.group_name}"? This cannot be undone.`)) return;
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
      // Option A: palaa listaan
      navigate("/groups");
      // Option B (jos haluat jäädä sivulle): päivitä oma membership & listat
      // setMembership(null);
      // setMembers(prev => prev.filter(m => m.user_id !== myId)); // myId pitäisi tulla JWT:stä
    } catch (err) {
      console.error("Leave group error:", err);
      setError(err?.response?.data?.error || "Failed to leave group");
    }
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

        {/* Owner: can delete; Member: can leave */}
        {isOwner ? (
          <Button variant="danger" onClick={deleteGroup}>Delete group</Button>
        ) : membership?.role === "member" ? (
          <Button variant="outline-danger" onClick={leaveGroup}>Leave group</Button>
        ) : null}
      </div>

      {isOwner && (
        <>
          <h4 className="mt-3">Join requests</h4>
          {pending.length === 0 ? (
            <p className="text-muted">No pending requests.</p>
          ) : (
            <ListGroup className="mb-4">
              {pending.map((r) => (
                <ListGroup.Item key={r.user_id} className="d-flex justify-content-between align-items-center">
                  <span>{r.username || r.email || r.user_id}</span>
                  <div>
                    <Button size="sm" variant="success" className="me-2" onClick={() => accept(r.user_id)}>
                      Accept
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => reject(r.user_id)}>
                      Reject
                    </Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </>
      )}

      <h4 className="mt-2">Members</h4>
      {normalMembers.length === 0 ? (
        <p className="text-muted">No members.</p>
      ) : (
        <ListGroup>
          {normalMembers.map((m) => (
            <ListGroup.Item key={m.user_id} className="d-flex justify-content-between align-items-center">
              <span>{m.username || m.email || m.user_id} ({m.role})</span>
              {isOwner && m.role !== "admin" && (
                <Button variant="danger" size="sm" onClick={() => removeMember(m.user_id)}>
                  Remove
                </Button>
              )}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
}
