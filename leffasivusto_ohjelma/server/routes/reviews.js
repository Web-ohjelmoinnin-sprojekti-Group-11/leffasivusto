import { Router } from 'express'

const router = Router()

// in-memory "tietokanta"
let _id = 1
const reviewsByMovie = new Map()
// muoto: { id, movieId, user, rating, text, createdAt }

router.get('/:movieId', (req, res) => {
  const movieId = String(req.params.movieId)
  const list = reviewsByMovie.get(movieId) ?? []
  res.json(list)
})

router.post('/', (req, res) => {
  const { movieId, user, rating, text } = req.body ?? {}
  if (!movieId || typeof rating !== 'number' || !text) {
    return res.status(400).json({ error: 'movieId, rating (number) ja text vaaditaan' })
  }
  const review = {
    id: _id++,
    movieId: String(movieId),
    user: user || 'Anon',
    rating,
    text,
    createdAt: new Date().toISOString()
  }
  const list = reviewsByMovie.get(review.movieId) ?? []
  list.push(review)
  reviewsByMovie.set(review.movieId, list)
  res.status(201).json(review)
})

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id)
  let removed = false
  for (const [movieId, list] of reviewsByMovie.entries()) {
    const idx = list.findIndex(r => r.id === id)
    if (idx !== -1) {
      list.splice(idx, 1)
      reviewsByMovie.set(movieId, list)
      removed = true
      break
    }
  }
  if (!removed) return res.status(404).json({ error: 'Not found' })
  res.status(204).end()
})

export default router
