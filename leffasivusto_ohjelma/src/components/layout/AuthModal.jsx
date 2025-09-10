// src/components/auth/AuthModal.jsx
import { useState } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import { useAuth } from '../../state/AuthContext.jsx'

export default function AuthModal({ show, onHide }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, register } = useAuth()

  const submit = async (e) => {
    e.preventDefault()
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password)
      }
      onHide() // sulkee modaalin onnistumisen jälkeen
    } catch (err) {
      alert(err.response?.data?.error || 'Something went wrong')
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{mode === 'login' ? 'Sign in' : 'Sign up'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={submit}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control 
              type="email" 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              required 
            />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label>Password</Form.Label>
            <Form.Control 
              type="password" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              required 
              minLength={8} 
            />
            <Form.Text>Min 8 characters.</Form.Text>
          </Form.Group>
          <div className="d-flex gap-2">
            <Button type="submit" className="flex-grow-1">
              {mode === 'login' ? 'Sign in' : 'Sign up'}
            </Button>
            <Button 
              variant="outline-secondary" 
              className="flex-grow-1" 
              onClick={()=>setMode(m=>m==='login'?'signup':'login')}
            >
              Switch to {mode==='login'?'Sign up':'Sign in'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  )
}
