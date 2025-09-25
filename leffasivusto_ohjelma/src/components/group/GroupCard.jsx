import { Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../services/api";
import { getToken } from "../../services/token";

export default function GroupCard({ group }) {
  const navigate = useNavigate();
  const [membership, setMembership] = useState(null);

  useEffect(() => {
    const fetchMembership = async () => {
      try {
        const res = await api.get(`/group_members/${group.group_id}`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        setMembership(res.data.myRole); // 'admin' | 'member' | 'pending'
      } catch {
        setMembership(null); // not a member
      }
    };
    fetchMembership();
  }, [group.group_id]);

  const handleJoin = async () => {
    try {
      await api.post(`/group_members/${group.group_id}/join`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      alert("Join request sent");
      setMembership("pending");
    } catch (err) {
      alert("Failed to send join request");
      console.error(err);
    }
  };

  const handleView = () => {
    navigate(`/groups/${group.group_id}`);
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title>{group.group_name}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          Owner ID: {group.owner_id}
        </Card.Subtitle>

        {membership === "admin" || membership === "member" ? (
          <Button variant="outline-primary" onClick={handleView}>
            View Group
          </Button>
        ) : membership === "pending" ? (
          <Button variant="secondary" disabled>
            Request pending
          </Button>
        ) : (
          <Button variant="success" onClick={handleJoin}>
            Request to join
          </Button>
        )}
      </Card.Body>
    </Card>
  );
}
