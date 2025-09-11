// src/pages/Home.jsx
import { Row, Col } from 'react-bootstrap'
import SidebarShowtimes from '../components/layout/SidebarShowtimes.jsx'
import FiltersBar from '../components/layout/FiltersBar.jsx'
import MovieGrid from '../components/movies/MovieGrid.jsx'
import HeroBanner from '../components/layout/HeroBanner.jsx'

export default function Home() {
  return (
    <>
      
      <div className="container-fluid px-0">
        <HeroBanner />
      </div>

      <Row className="g-3 mt-3">
        <Col xs={12} lg={3}>
          <SidebarShowtimes />
        </Col>
        <Col xs={12} lg={9}>
          <div className="mb-3">
            <FiltersBar />
          </div>
          <h5 className="mb-3">Trending Movies</h5>
          <MovieGrid />
        </Col>
      </Row>
    </>
  )
}
