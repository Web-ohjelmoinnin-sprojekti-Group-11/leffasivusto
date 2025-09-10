import { Button, ButtonGroup } from 'react-bootstrap'

export default function FiltersBar() {
  return (
    <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
      <ButtonGroup>
        <Button variant="outline-secondary">2024</Button>
        <Button variant="outline-secondary">⭐ 7+</Button>
      </ButtonGroup>
      <Button variant="outline-secondary">Sci-Fi</Button>
      <Button variant="outline-secondary">Action</Button>
      <Button variant="outline-secondary">Comedy</Button>
      <Button variant="outline-secondary">Animation</Button>
    </div>
  )
}
