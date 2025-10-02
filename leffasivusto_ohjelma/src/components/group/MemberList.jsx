// src/components/group/MemberList.jsx
import { Button, ListGroup } from "react-bootstrap";

export default function MemberList({ members = [], isOwner, onRemove }) {
  if (members.length === 0) {
    return <p className="text-muted">No members.</p>;
  }
  return (
    <ListGroup className="mb-4">
      {members.map((m) => (
        <ListGroup.Item key={m.user_id} className="d-flex justify-content-between align-items-center">
          <span>{m.username || m.email || m.user_id} ({m.role})</span>
          {isOwner && m.role !== "admin" && (
            <Button variant="danger" size="sm" onClick={() => onRemove(m.user_id)}>Remove</Button>
          )}
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
}
