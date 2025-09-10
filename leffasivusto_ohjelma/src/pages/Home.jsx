import { Row, Col, Card } from 'react-bootstrap'
import SidebarShowtimes from '../components/layout/SidebarShowtimes.jsx'
import FiltersBar from '../components/layout/FiltersBar.jsx'
import MovieGrid from '../components/movies/MovieGrid.jsx'

export default function Home() {
  return (
    <Row className="g-3">
      <Col xs={12} lg={3}>
        <SidebarShowtimes />
      </Col>

      <Col xs={12} lg={9}>
        <Card className="mb-3">
          <Card.Header>Filters & tags</Card.Header>
          <Card.Body><FiltersBar /></Card.Body>
        </Card>

        <h5 className="mb-3">Trending Movies</h5>
        <MovieGrid />
      </Col>
    </Row>
  )
}
