import { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";            // << keskitetty Axios
import { getToken } from "../../services/token"; // << OIKEA polku

export default function CreateGroup() {
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!groupName.trim()) {
      setError("Please enter a group name");
      return;
    }

    try {
      const res = await api.post(
        "/groups",
        { group_name: groupName },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      const created = res.data?.group;
      if (created?.group_id) {
        setSuccess(`Group "${created.group_name}" created successfully!`);
        setGroupName("");
        navigate(`/groups/${created.group_id}`);
      } else {
        throw new Error("Unexpected response");
      }
    } catch (err) {
      console.error("Failed to create group:", err);
      setError("Failed to create group");
    }
  };

  return (
    <div>
      <h2>Create New Group</h2>
      {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
      {success && <Alert variant="success" className="mt-2">{success}</Alert>}

      <Form onSubmit={handleSubmit} className="mt-3">
        <Form.Group controlId="groupName" className="mb-3">
          <Form.Label>Group Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          Create Group
        </Button>
      </Form>
    </div>
  );
}
