import { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { getToken } from "../services/token.js";

export default function CreateGroup() {
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!groupName.trim()) {
      setError("Please enter a group name");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:3001/api/groups",
        { group_name: groupName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`Group "${res.data.group.group_name}" created successfully!`);
      setGroupName("");
      navigate(`/groups/${res.data.group.group_id}`);
    } catch (err) {
      console.error("Failed to create group:", err);
      setError("Failed to create group");
    }
  };

  return (
    <div>
      <h2>Create New Group</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSubmit}>
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
