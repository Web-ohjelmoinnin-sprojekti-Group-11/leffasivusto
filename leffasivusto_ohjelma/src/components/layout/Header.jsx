import { Navbar, Container, Form, Button } from 'react-bootstrap'
import ThemeToggle from './ThemeToggle.jsx'
import { useAuth } from '../../state/AuthContext.jsx'
import AuthModal from './AuthModal.jsx'
import { Link, useNavigate } from 'react-router-dom'

export default function Header() {
  const { user, setAuthOpen, authOpen, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <>
      <Navbar bg="body" className="border-bottom px-3" expand="md">
        <Container fluid className="gap-2">
          <Navbar.Brand as={Link} to="/">🎬 MovieHub</Navbar.Brand>

          <Form className="d-flex flex-grow-1" onSubmit={(e)=>{e.preventDefault();navigate('/movies')}}>
            <Form.Control placeholder="Search movies..." />
          </Form>

          <div className="d-flex align-items-center gap-2">
            {user ? (
              <>
                <span className="small">Hi, {user.email}</span>
                <Button size="sm" variant="outline-secondary" onClick={logout}>Logout</Button>
              </>
            ) : (
              <Button size="sm" onClick={()=>setAuthOpen(true)}>Login / Sign up</Button>
            )}
            <ThemeToggle />
          </div>
        </Container>
      </Navbar>

      <AuthModal show={authOpen} onHide={()=>setAuthOpen(false)} />
    </>
  )
}
