import { Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function GroupCard({ group }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/groups/${group.group_id}`);
  };

  return (
    <Card className="h-100 shadow-sm">
      <Card.Body>
        <Card.Title className="mb-1">{group.group_name}</Card.Title>
        <Card.Subtitle className="mb-3 text-muted">
          Owner ID: {group.owner_id}
        </Card.Subtitle>
        <Button variant="outline-primary" onClick={handleClick}>
          View Group
        </Button>
      </Card.Body>
    </Card>
  );
}
