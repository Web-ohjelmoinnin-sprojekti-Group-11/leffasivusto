// src/components/layout/AuthModal.jsx
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { useAuth } from '../../state/AuthContext.jsx';

export default function AuthModal({ show, onHide }) {
  const { login, register, loading, error, success, setError, setSuccess } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Regex: at least 8 characters, one uppercase letter, one number
  const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

  // Reset messages when modal opens or mode changes
  useEffect(() => {
    if (show) {
      setError(null);
      setSuccess(null);
      setPasswordError('');
    }
  }, [show, mode, setError, setSuccess]);

  // Validate password strength in real time (only in signup mode)
  const handlePasswordChange = (value) => {
    setPassword(value);
    if (mode === 'signup') {
      if (!strongPasswordRegex.test(value)) {
        setPasswordError('Password must be at least 8 characters long and include one uppercase letter and one number.');
      } else {
        setPasswordError('');
      }
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const action = mode === 'login' ? login : register;

    // Prevent submission if password is weak (signup only)
    if (mode === 'signup' && !strongPasswordRegex.test(password)) {
      setPasswordError('Password must be at least 8 characters long and include one uppercase letter and one number.');
      return;
    }

    const { ok } = await action(email, password);
    if (ok) onHide?.(); // close modal only on success
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
              onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => handlePasswordChange(e.target.value)}
              required
              minLength={8}
              disabled={loading}
              isInvalid={!!passwordError}
            />
            <Form.Text muted>
              At least 8 characters, one uppercase letter, and one number.
            </Form.Text>
            {passwordError && (
              <Form.Control.Feedback type="invalid">
                {passwordError}
              </Form.Control.Feedback>
            )}
          </Form.Group>

          <div className="d-flex gap-2">
            <Button type="submit" className="flex-grow-1" disabled={loading}>
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Please wait…
                </>
              ) : (
                mode === 'login' ? 'Sign in' : 'Create account'
              )}
            </Button>
            <Button
              variant="outline-secondary"
              className="flex-grow-1"
              onClick={() => setMode(m => m === 'login' ? 'signup' : 'login')}
              disabled={loading}
            >
              Switch to {mode === 'login' ? 'Sign up' : 'Sign in'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
