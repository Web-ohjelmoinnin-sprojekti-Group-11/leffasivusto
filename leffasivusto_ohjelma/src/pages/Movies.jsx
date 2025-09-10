import { Container, Pagination } from 'react-bootstrap'
import FiltersBar from '../components/layout/FiltersBar.jsx'
import MovieGrid from '../components/movies/MovieGrid.jsx'

export default function Movies() {
  return (
    <Container fluid>
      <h4 className="mb-3">Movies – Catalogue</h4>
      <FiltersBar />
      <MovieGrid />
      <div className="d-flex justify-content-center mt-3">
        <Pagination>
          <Pagination.Prev />
          <Pagination.Item active>1</Pagination.Item>
          <Pagination.Item>2</Pagination.Item>
          <Pagination.Item>3</Pagination.Item>
          <Pagination.Next />
        </Pagination>
      </div>
    </Container>
  )
}
