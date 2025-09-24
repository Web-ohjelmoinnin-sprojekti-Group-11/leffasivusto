import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';  
import * as ctrl from '../controllers/reviewController.js';

const router = Router();

// Julkiset: elokuvan arvostelut & yhteenveto
router.get('/', ctrl.listByMovie);                // /api/reviews?movie_id=123
router.get('/summary', ctrl.getSummary);          // /api/reviews/summary?movie_id=123

// Oma käyttäjä
router.get('/me', requireAuth, ctrl.listMine);    // /api/reviews/me

// Luonti / muokkaus / poisto
router.post('/', requireAuth, ctrl.createOrUpdate);
router.patch('/:review_id', requireAuth, ctrl.updateOne);
router.delete('/:review_id', requireAuth, ctrl.removeOne);

export default router;
