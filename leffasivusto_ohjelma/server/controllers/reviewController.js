import * as Review from '../models/reviewModel.js';

const toInt = (x) => Number.parseInt(x, 10);

const getUserId = (req) => req?.user?.user_id ?? req?.user?.id ?? null;

export async function createOrUpdate(req, res, next) {
  try {
    const userId  = getUserId(req);
    const movieId = toInt(req.body.movie_id);
    const rating  = toInt(req.body.rating);
    const text    = (req.body.text || '').trim();

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!Number.isInteger(movieId)) return res.status(400).json({ error: 'movie_id required' });
    if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ error: 'rating 1..5' });
    if (!text) return res.status(400).json({ error: 'text required' });

    const row = await Review.upsert({ userId, movieId, rating, text });
    res.json(row);
  } catch (err) { next(err); }
}

export async function listByMovie(req, res, next) {
  try {
    const movieId = toInt(req.query.movie_id);
    if (!Number.isInteger(movieId)) return res.status(400).json({ error: 'movie_id required' });

    const items = await Review.getByMovie(movieId, {
      limit: toInt(req.query.limit) || 20,
      offset: toInt(req.query.offset) || 0,
    });
    res.json(items);
  } catch (err) { next(err); }
}

export async function listMine(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const items = await Review.getMine(userId);
    res.json(items);
  } catch (err) { next(err); }
}

export async function updateOne(req, res, next) {
  try {
    const userId = getUserId(req);
    const reviewId = toInt(req.params.review_id);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const rating = req.body.rating !== undefined ? toInt(req.body.rating) : undefined;
    const text   = req.body.text?.trim();

    if (rating !== undefined && !(rating >= 1 && rating <= 5))
      return res.status(400).json({ error: 'rating 1..5' });

    const row = await Review.patch(reviewId, userId, { rating, text });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) { next(err); }
}

export async function removeOne(req, res, next) {
  try {
    const userId = getUserId(req);
    const reviewId = toInt(req.params.review_id);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const ok = await Review.remove(reviewId, userId);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) { next(err); }
}

export async function getSummary(req, res, next) {
  try {
    const movieId = toInt(req.query.movie_id);
    if (!Number.isInteger(movieId)) return res.status(400).json({ error: 'movie_id required' });
    const s = await Review.summary(movieId);
    res.json(s);
  } catch (err) { next(err); }
}
