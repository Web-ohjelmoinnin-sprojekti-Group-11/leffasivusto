// src/components/layout/Header.jsx
import { Navbar, Container, Form, Button } from 'react-bootstrap'
import ThemeToggle from './ThemeToggle.jsx'
import { useAuth } from '../../state/AuthContext.jsx'
import AuthModal from './AuthModal.jsx'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { getToken } from '../../services/token'   // <-- tuodaan tokenin hakija

export default function Header() {
  const { user, setAuthOpen, authOpen, logout } = useAuth()
  const navigate = useNavigate()

  // Who am I -nappi
  const whoAmI = async () => {
    try {
      const { data } = await api.get('/auth/me')
      const token = getToken()
      console.log('ME ->', data)
      console.log('ACCESS TOKEN ->', token)
      alert(`User: ${data.user.email}\nToken: ${token?.slice(0,30)}...`)
    } catch (e) {
      console.error('ME ERR ->', e?.response?.status, e?.response?.data)
      alert('ME error – katso konsoli')
    }
  }

  return (
    <>
      <Navbar bg="body" className="border-bottom px-3" expand="md">
        <Container fluid className="gap-2">
          <Navbar.Brand as={Link} to="/">🎬 MovieHub</Navbar.Brand>

          <Form
            className="d-flex flex-grow-1"
            onSubmit={(e) => {
              e.preventDefault()
              navigate('/movies')
            }}
          >
            <Form.Control placeholder="Search movies..." />
          </Form>

          <div className="d-flex align-items-center gap-2">
            {user ? (
              <>
                <span className="small">Hi, {user.email}</span>
                <Button size="sm" variant="outline-secondary" onClick={logout}>
                  Logout
                </Button>
                <Button size="sm" variant="outline-info" onClick={whoAmI}>
                  Who am I?
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setAuthOpen(true)}>
                Login / Sign up
              </Button>
            )}
            <ThemeToggle />
          </div>
        </Container>
      </Navbar>

      <AuthModal show={authOpen} onHide={() => setAuthOpen(false)} />
    </>
  )
}
