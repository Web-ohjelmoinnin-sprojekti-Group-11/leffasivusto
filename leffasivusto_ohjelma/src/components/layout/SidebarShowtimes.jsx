import { Card, Form, ListGroup, Button } from 'react-bootstrap'

// Placeholder – kutsutaan myöhemmin Finnkino-backendiin controllerin kautta
export default function SidebarShowtimes() {
  return (
    <Card className="mb-3">
      <Card.Header>Finnkino Showtimes & Filters</Card.Header>
      <Card.Body className="d-grid gap-3">
        <Form.Select><option>Select city</option></Form.Select>
        <Form.Select><option>Select theater</option></Form.Select>
        <Form.Control type="date" />
        <div>
          <div className="fw-semibold mb-2">Today’s showtimes</div>
          <ListGroup variant="flush">
            <ListGroup.Item className="small">Dune Part Two — Tennispalatsi — 18:30 — €12.50 — <Button size="sm">Book</Button></ListGroup.Item>
            <ListGroup.Item className="small">Oppenheimer — Kinopalatsi — 20:00 — €14.00 — <Button size="sm">Book</Button></ListGroup.Item>
            <ListGroup.Item className="small">Barbie — Sello — 19:15 — €11.50 — <Button size="sm">Book</Button></ListGroup.Item>
          </ListGroup>
        </div>
      </Card.Body>
    </Card>
  )
}
