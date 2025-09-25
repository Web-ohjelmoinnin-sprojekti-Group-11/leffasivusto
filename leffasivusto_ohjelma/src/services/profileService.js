// src/services/profileService.js
import api from './api'

/** Centralized request with normalized English errors. */
async function request(method, url, data) {
  try {
    const res = await api({ method, url, data })
    return res.data
  } catch (e) {
    const msg =
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      e?.message ||
      'Unknown error'
    throw new Error(msg)
  }
}

export const profileApi = {
  // Profile
  getProfile:     () => request('get',  '/auth/me'),
  updateProfile:  (body) => request('put',  '/auth/update', body),
  changePassword: (body) => request('post', '/auth/change-password', body),

  // User data
  getFavorites:   () => request('get',    '/user/favorites'),
  addFavorite:    ({ movieId, ...rest }) => request('post',   '/user/favorites', { movieId, ...rest }),
  removeFavorite: (movieId) => request('delete', `/user/favorites/${movieId}`),
  getReviews:     () => request('get',    '/user/reviews'),
  removeReview:   (id) => request('delete', `/user/reviews/${id}`),
  getHistory:     () => request('get',    '/user/history'),
}

export default profileApi
