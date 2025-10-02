// src/components/group/JoinRequests.jsx
import { Button, ListGroup } from "react-bootstrap";

export default function JoinRequests({ pending = [], onAccept, onReject }) {
  if (pending.length === 0) {
    return <p className="text-muted">No pending requests.</p>;
  }
  return (
    <ListGroup className="mb-4">
      {pending.map((r) => (
        <ListGroup.Item key={r.user_id} className="d-flex justify-content-between align-items-center">
          <span>{r.username || r.email || r.user_id}</span>
          <div>
            <Button size="sm" variant="success" className="me-2" onClick={() => onAccept(r.user_id)}>
              Accept
            </Button>
            <Button size="sm" variant="outline-danger" onClick={() => onReject(r.user_id)}>
              Reject
            </Button>
          </div>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
}
