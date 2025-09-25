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
  const [membership, setMembership] = useState(null); // { role: 'admin' | 'member' | ... }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const authHeader = { headers: { Authorization: `Bearer ${getToken()}` } };

  useEffect(() => {
    const fetchAll = async () => {
      setError(null);
      setLoading(true);
      try {
        // 1) Ryhmä + oma rooli
        const g = await api.get(`/groups/${id}`, authHeader);
        setGroup(g.data.group);
        setMembership(g.data.membership || null);

        // 2) Jäsenet (jos endpoint käytössä)
        try {
          const m = await api.get(`/groups/members/${id}`, authHeader);
          setMembers(m.data.members || []);
        } catch {
          setMembers([]);
        }
      } catch (err) {
        console.error("Group fetch error:", err);
        setError("Failed to load group");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const removeMember = async (userId) => {
    try {
      await api.delete(`/groups/members/remove/${id}/${userId}`, authHeader);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (err) {
      console.error("Failed to remove member:", err);
      setError("Failed to remove member");
    }
  };

  const deleteGroup = async () => {
    if (!group) return;
    const ok = window.confirm(
      `Delete group "${group.group_name}"? This cannot be undone.`
    );
    if (!ok) return;

    try {
      await api.delete(`/groups/${id}`, authHeader);
      navigate("/groups");
    } catch (err) {
      console.error("Group delete error:", err);
      setError("Failed to delete group");
    }
  };

  if (error) return <Alert variant="danger" className="mt-3">{error}</Alert>;
  if (loading) return <div className="my-4"><Spinner animation="border" /></div>;
  if (!group) return <p>Not found.</p>;

  const isOwner = membership?.role === "admin"; // teidän skeema: owner -> admin

  return (
    <div>
      <div className="d-flex align-items-start justify-content-between">
        <h2 className="mb-3">{group.group_name}</h2>
        {isOwner && (
          <Button variant="danger" onClick={deleteGroup}>
            Delete group
          </Button>
        )}
      </div>

      <h4 className="mt-2">Members</h4>
      {members.length === 0 ? (
        <p className="text-muted">No members.</p>
      ) : (
        <ListGroup>
          {members.map((m) => (
            <ListGroup.Item key={m.user_id}>
              {m.username} ({m.role})
              {isOwner && m.role !== "admin" && (
                <Button
                  variant="danger"
                  size="sm"
                  className="ms-2"
                  onClick={() => removeMember(m.user_id)}
                >
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
