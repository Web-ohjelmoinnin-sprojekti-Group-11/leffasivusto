// src/components/group/GroupShowtimes.jsx
import { Alert, Card, ListGroup, Spinner } from "react-bootstrap";

export default function GroupShowtimes({ loading, error, showtimes }) {
  if (loading) return <div className="my-3"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="warning">{error}</Alert>;
  if (!showtimes || showtimes.length === 0) return <p className="text-muted">No showtimes shared yet.</p>;

  return (
    <Card className="mb-4">
      <ListGroup variant="flush">
        {showtimes.map((s) => (
          <ListGroup.Item key={s.id} className="d-flex justify-content-between align-items-center">
            <div>
              <strong>{s.title}</strong>
              <div className="small text-muted">
                {s.theatre_name} — {s.pretty_time}
              </div>
              {s.added_by && <div className="small text-muted">added by {s.added_by}</div>}
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  );
}
