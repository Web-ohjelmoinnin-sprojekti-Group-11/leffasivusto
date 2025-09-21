// src/components/layout/Header.jsx
import { Navbar, Container, Offcanvas, Nav, Button } from 'react-bootstrap'
import ThemeToggle from './ThemeToggle.jsx'
import { useAuth } from '../../state/AuthContext.jsx'
import AuthModal from './AuthModal.jsx'
import { Link, NavLink } from 'react-router-dom'
import logoLight from '../../assets/logo/pbdm_logo_navbar_transparent_light.png'
import logoDark from '../../assets/logo/pbdm_logo_navbar_transparent_dark.png'
import { useTheme } from '../../state/ThemeContext.jsx'
import { useIntro } from '../../state/IntroContext.jsx'

export default function Header() {
  const { user, setAuthOpen, authOpen, logout } = useAuth()
  const { theme } = useTheme()
  const { introDone } = useIntro()

  return (
    <>
       <Navbar expand="md" className="border-bottom px-3">

        <Container fluid className="align-items-center gap-2">
          {/* Logo */}
          <Navbar.Brand as={Link} to="/" className="p-0 d-flex align-items-center">
            <img
              src={theme === 'dark' ? logoDark : logoLight}
              alt="PBDM logo"
              height={40}
            />
          </Navbar.Brand>

          {/* Keskilinkit – näkyvät vain ≥ md ja vasta introgaten jälkeen */}
          {introDone && (
            <Nav className="ms-2 me-auto d-none d-md-flex">
              <Nav.Link as={NavLink} to="/" end>Home</Nav.Link>
              <Nav.Link as={NavLink} to="/movies">Movies</Nav.Link>
              <Nav.Link as={NavLink} to="/groups">Groups</Nav.Link>
              {user && <Nav.Link as={NavLink} to="/profile">Profile</Nav.Link>}
            </Nav>
          )}

          {/* Oikea reuna */}
          <div className="d-flex align-items-center gap-3 ms-auto">
            {/* Burger vain mobiilissa (ja vain jos intro on valmis) */}
            {introDone && (
              <Navbar.Toggle
                aria-controls="offcanvasNavbar"
                className="rounded-pill px-3 d-md-none"
              />
            )}

            {user ? (
              <>
                <span className="small d-none d-lg-inline">Hi, {user.email}</span>
                <Button size="sm" variant="outline-secondary" onClick={logout}>Logout</Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setAuthOpen(true)}>Login / Sign up</Button>
            )}
            <ThemeToggle />
          </div>

          {/* Offcanvas – näkyy vain < md ja kun intro on valmis */}
          {introDone && (
            <Navbar.Offcanvas
              id="offcanvasNavbar"
              placement="end"
              className="d-md-none"
            >
              <Offcanvas.Header closeButton>
                <Offcanvas.Title>Menu</Offcanvas.Title>
              </Offcanvas.Header>
              <Offcanvas.Body>
                <Nav className="flex-column gap-1">
                  <Nav.Link as={NavLink} to="/" end>Home</Nav.Link>
                  <Nav.Link as={NavLink} to="/movies">Movies</Nav.Link>
                  <Nav.Link as={NavLink} to="/groups">Groups</Nav.Link>
                  {user && <Nav.Link as={NavLink} to="/profile">Profile</Nav.Link>}
                </Nav>
              </Offcanvas.Body>
            </Navbar.Offcanvas>
          )}
        </Container>
      </Navbar>

      <AuthModal show={authOpen} onHide={() => setAuthOpen(false)} />
    </>
  )
}
