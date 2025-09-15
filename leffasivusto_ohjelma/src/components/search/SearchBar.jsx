import { Form, InputGroup, Button } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

export default function SearchBar({ size = 'lg', className = '', onSubmit }) {
  const navigate = useNavigate()

  return (
    <Form
      className={className}
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.()
        navigate('/movies')
      }}
    >
      <InputGroup size={size}>
        <Form.Control placeholder="Search movies..." aria-label="Search movies" />
        <Button variant="primary" type="submit">Search</Button>
      </InputGroup>
    </Form>
  )
}
