import { useEffect, useState } from 'react'
import MovieCard from './MovieCard.jsx'
import * as movieController from '../../controllers/movieController'
import { Row, Col } from 'react-bootstrap'

export default function MovieGrid() {
  const [items, setItems] = useState([])

  useEffect(() => {
    movieController.fetchTrending()
      .then(setItems)
      .catch(()=>setItems([]))
  }, [])

  const skeleton = Array.from({length:6}, (_,i)=>({ id: `s${i}`, title: 'Loading...' }))

  return (
    <Row xs={1} sm={2} md={3} lg={3} xl={3} xxl={3} className="g-3">
      {(items.length?items:skeleton).map(m=>(
        <Col key={m.id}><MovieCard movie={m} /></Col>
      ))}
    </Row>
  )
}
