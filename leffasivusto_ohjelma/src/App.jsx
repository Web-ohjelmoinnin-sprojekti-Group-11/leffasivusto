import { Container } from 'react-bootstrap'
import Header from './components/layout/Header.jsx'
import AppRoutes from './routes/AppRoutes.jsx'



export default function App() {
  return (
    <>
      <Header />
      <Container fluid className="py-3">
        <AppRoutes />
      </Container>
    </>
  )
}
