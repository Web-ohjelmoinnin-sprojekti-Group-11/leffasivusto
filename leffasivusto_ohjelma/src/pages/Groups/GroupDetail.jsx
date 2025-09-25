import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button, ListGroup, Alert } from "react-bootstrap";
import axios from "axios";

export default function GroupDetails() {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchGroup();
  }, []);

  const fetchGroup = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/api/groups/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroup(res.data.group);

      // Hae jäsenet erillisestä endpointista jos lisäät groupMembersRoutes
      const membersRes = await axios.get(
        `http://localhost:3001/api/groups/members/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMembers(membersRes.data.members || []);
    } catch (err) {
      console.error("Failed to fetch group:", err);
      setError("Failed to load group");
    }
  };

  const removeMember = async (userId) => {
    try {
      await axios.delete(
        `http://localhost:3001/api/groups/members/remove/${id}/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (err) {
      console.error("Failed to remove member:", err);
      setError("Failed to remove member");
    }
  };

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!group) return <p>Loading...</p>;

  return (
    <div>
      <h2>{group.group_name}</h2>
      <h4>Members:</h4>
      <ListGroup>
        {members.map((m) => (
          <ListGroup.Item key={m.user_id}>
            {m.username} ({m.role})
            {m.role !== "owner" && (
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
    </div>
  );
}
