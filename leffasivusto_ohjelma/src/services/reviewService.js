import api from './api'; // teidän axios-instance

export const getByMovie = (movieId, { limit = 20, offset = 0 } = {}) =>
  api.get('/reviews', { params: { movie_id: movieId, limit, offset } })
     .then(r => r.data);

     
export const getSummary = (movieId) =>
  api.get('/reviews/summary', { params: { movie_id: movieId } })
     .then(r => r.data);

export const getMine = () =>
  api.get('/reviews/me').then(r => r.data);

export const createOrUpdate = ({ movie_id, rating, text }) =>
  api.post('/reviews', { movie_id, rating, text }).then(r => r.data);

export const updateOne = (review_id, { rating, text }) =>
  api.patch(`/reviews/${review_id}`, { rating, text }).then(r => r.data);

export const removeOne = (review_id) =>
  api.delete(`/reviews/${review_id}`).then(r => r.status === 204);
