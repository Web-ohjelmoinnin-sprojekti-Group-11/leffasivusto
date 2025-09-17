// src/components/auth/AuthModal.jsx
import { useEffect, useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../state/AuthContext.jsx';

export default function AuthModal({ show, onHide }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, register, loading, error, success, setSuccess, setError } = useAuth();

  useEffect(() => {
    // Tyhjennä ilmoitukset, kun modal avataan tai moodi vaihtuu
    if (show) { setSuccess?.(null); setError?.(null); }
  }, [show, mode, setSuccess, setError]);

  useEffect(() => {
    // Sign up onnistui → näytä viesti → sulje hetken kuluttua
    if (success && mode === 'signup') {
      const t = setTimeout(() => { onHide?.(); }, 1200);
      return () => clearTimeout(t);
    }
  }, [success, mode, onHide]);

  const submit = async (e) => {
    e.preventDefault();
    if (mode === 'login') {
      await login(email, password); // epäonnistuessa error näkyy, modal ei sulkeudu
    } else {
      await register(email, password); // onnistumisessa success näkyy ja suljetaan viiveellä
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{mode === 'login' ? 'Sign in' : 'Sign up'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="mb-3">Invalid email or password.</Alert>}
        {success && mode === 'signup' && <Alert variant="success" className="mb-3">Registration successful.</Alert>}

        <Form onSubmit={submit}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              required
              autoFocus
              disabled={loading}
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              required
              minLength={8}
              disabled={loading}
            />
            <Form.Text>Min 8 characters.</Form.Text>
          </Form.Group>

          <div className="d-flex gap-2">
            <Button type="submit" className="flex-grow-1" disabled={loading}>
              {loading ? (<><Spinner size="sm" className="me-2" />Please wait…</>) : 'Submit'}
            </Button>
            <Button
              variant="outline-secondary"
              className="flex-grow-1"
              onClick={()=>setMode(m=>m==='login'?'signup':'login')}
              disabled={loading}
            >
              Switch to {mode==='login' ? 'Sign up' : 'Sign in'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
