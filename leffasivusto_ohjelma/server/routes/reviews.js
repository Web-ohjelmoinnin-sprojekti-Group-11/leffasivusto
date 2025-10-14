import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';  
import * as ctrl from '../controllers/reviewController.js';

const router = Router();

// Apumetodi movie_id-parametrin tarkistamiseen
function validateMovieId(req, res, next) {
  const { movie_id } = req.query;

  if (!movie_id) {
    return res.status(400).json({ error: 'movie_id query parameter is required' });
  }

  // Tarkista onko movie_id kelvollinen (numero, voit muokata tätä tarkistusta tarpeen mukaan)
  if (isNaN(movie_id)) {
    return res.status(400).json({ error: 'Invalid movie_id' });
  }

  next(); // Jos validointi menee läpi, jatketaan normaalisti
}

// Julkiset: elokuvan arvostelut & yhteenveto
router.get('/', validateMovieId, ctrl.listByMovie);               // /api/reviews?movie_id=123
router.get('/summary', validateMovieId, ctrl.getSummary);         // /api/reviews/summary?movie_id=123

// Oma käyttäjä
router.get('/me', requireAuth, ctrl.listMine);                    // /api/reviews/me

// Luonti / muokkaus / poisto (Näissä ei tarvita movie_id, mutta vaativat autentikoinnin)
router.post('/', requireAuth, ctrl.createOrUpdate);
router.patch('/:review_id', requireAuth, ctrl.updateOne);
router.delete('/:review_id', requireAuth, ctrl.removeOne);

export default router;
