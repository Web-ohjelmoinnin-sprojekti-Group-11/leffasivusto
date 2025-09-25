import { useState, useEffect } from "react";
import { Button, Row, Col, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { getToken } from "../../services/token";
import GroupCard from "../../components/group/GroupCard.jsx";

export default function GroupList() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await api.get("/groups", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setGroups(res.data.groups || []);
    } catch (err) {
      console.error("Failed to fetch groups:", err);
      setError("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => navigate("/groups/create");

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Groups</h2>
        <Button variant="primary" onClick={handleCreateClick}>
          Create Group
        </Button>
      </div>

      {loading && (
        <div className="text-center my-5">
          <Spinner animation="border" />
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        {groups.length > 0 ? (
          groups.map((group) => (
            <Col key={group.group_id} md={4} className="mb-3">
              <GroupCard group={group} />
            </Col>
          ))
        ) : (
          !loading && <p>No groups found.</p>
        )}
      </Row>
    </div>
  );
}
