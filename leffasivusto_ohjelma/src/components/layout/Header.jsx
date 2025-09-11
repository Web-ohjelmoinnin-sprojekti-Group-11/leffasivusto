// src/components/layout/Header.jsx
import { Navbar, Container, Offcanvas, Nav, Form, Button } from 'react-bootstrap'
import ThemeToggle from './ThemeToggle.jsx'
import { useAuth } from '../../state/AuthContext.jsx'
import AuthModal from './AuthModal.jsx'
import { Link, useNavigate } from 'react-router-dom'
import logoLight from '../../assets/logo/pbdm_logo_navbar_transparent_light.png'
import logoDark from '../../assets/logo/pbdm_logo_navbar_transparent_dark.png'
import { useTheme } from '../../state/ThemeContext.jsx'



export default function Header() {
  const { user, setAuthOpen, authOpen, logout } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()


  

  return (
    <>
      <Navbar bg="body" expand={false} className="border-bottom px-3">
        <Container fluid className="align-items-center gap-2">
          {/* Logo */}
          <Navbar.Brand as={Link} to="/" className="p-0 d-flex align-items-center">
            <img
              src={theme === 'dark' ? logoDark : logoLight}
              alt="PBDM logo"
              height={40}
            />
          </Navbar.Brand>

          {/* Haku – kapeampi ja keskitetty, ei vie kaikkea tilaa */}
          <Form
            className="d-none d-sm-flex flex-grow-1 justify-content-center mx-sm-2"
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              navigate('/movies')
            }}
          >
            <div className="w-100" style={{ maxWidth: 540 }}>
              <Form.Control placeholder="Search movies..." aria-label="Search movies" />
            </div>
          </Form>

          {/* Oikea reuna: Menu + Login/Theme — tasainen väli gap-3 */}
          <div className="d-flex align-items-center gap-3 ms-auto">
            {/* Menu-nappi (ei kiinni loginissa, koska koko ryhmällä gap-3) */}
            <Navbar.Toggle
              aria-controls="offcanvasNavbar"
              aria-label="Open menu"
              className="rounded-pill px-3"
            />

            <div className="d-flex align-items-center gap-3">
              {user ? (
                <>
                  <span className="small d-none d-lg-inline">Hi, {user.email}</span>
                  <Button size="sm" variant="outline-secondary" onClick={logout}>
                    Logout
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setAuthOpen(true)}>
                  Login / Sign up
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>

          {/* Offcanvas-valikko */}
          <Navbar.Offcanvas id="offcanvasNavbar" placement="end" aria-labelledby="offcanvasNavbarLabel">
            <Offcanvas.Header closeButton>
              <Offcanvas.Title id="offcanvasNavbarLabel">Menu</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <Nav className="flex-column gap-1">
                <Nav.Link as={Link} to="/movies">Movies</Nav.Link>
                <Nav.Link as={Link} to="/showtimes">Showtimes</Nav.Link>
                <Nav.Link as={Link} to="/reviews">Reviews</Nav.Link>
                <Nav.Link as={Link} to="/groups">Groups</Nav.Link>
                <Nav.Link as={Link} to="/favorites">Favorites</Nav.Link>
                <Nav.Link as={Link} to="/schedule">Schedule</Nav.Link>
              </Nav>
            </Offcanvas.Body>
          </Navbar.Offcanvas>
        </Container>
      </Navbar>

      <AuthModal show={authOpen} onHide={() => setAuthOpen(false)} />
    </>
  )
}
