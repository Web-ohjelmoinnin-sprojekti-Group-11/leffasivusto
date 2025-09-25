import { Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function GroupCard({ group }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/groups/${group.group_id}`);
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title>{group.group_name}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          Owner ID: {group.owner_id}
        </Card.Subtitle>
        <Button variant="outline-primary" onClick={handleClick}>
          View Group
        </Button>
      </Card.Body>
    </Card>
  );
}
