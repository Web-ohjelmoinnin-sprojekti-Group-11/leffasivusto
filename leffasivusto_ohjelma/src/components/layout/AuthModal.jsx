// src/components/layout/AuthModal.jsx
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { useAuth } from '../../state/AuthContext.jsx';

export default function AuthModal({ show, onHide }) {
  const { login, register, loading, error, success, setError, setSuccess } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Kun modal avataan tai moodi vaihtuu → nollaa viestit
  useEffect(() => {
    if (show) { setError(null); setSuccess(null); }
  }, [show, mode, setError, setSuccess]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const action = mode === 'login' ? login : register;
    const { ok } = await action(email, password);
    if (ok) onHide?.();              // sulje vain onnistumisessa
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{mode === 'login' ? 'Sign in' : 'Sign up'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
        {success && mode === 'signup' && <Alert variant="success" className="mb-3">{success}</Alert>}

        <Form onSubmit={onSubmit}>
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
              {loading ? (<><Spinner animation="border" size="sm" className="me-2" />Please wait…</>) : (mode==='login' ? 'Sign in' : 'Create account')}
            </Button>
            <Button
              variant="outline-secondary"
              className="flex-grow-1"
              onClick={()=>setMode(m => m === 'login' ? 'signup' : 'login')}
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
