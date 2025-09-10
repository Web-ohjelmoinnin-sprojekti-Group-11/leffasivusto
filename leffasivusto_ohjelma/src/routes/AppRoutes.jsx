import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home.jsx'
import Movies from '../pages/Movies.jsx'
import NotFound from '../pages/NotFound.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/movies" element={<Movies />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
