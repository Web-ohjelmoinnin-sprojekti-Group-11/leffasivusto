import api from './api'

/** Centralized request with normalized English errors. */
async function request(method, url, data) {
  try {
    const res = await api({ method, url, data })
    return res.data
  } catch (e) {
    const serverMsg = e?.response?.data?.message || e?.response?.data?.error
    const status = e?.response?.status
    const msg = serverMsg || e?.message || 'Unknown error'
    const err = new Error(msg)
    if (status) err.status = status
    if (e?.response?.data) err.serverData = e.response.data
    throw err
  }
}

export const profileApi = {
  // Profile
  getProfile:     () => request('get',  '/auth/me'),
  updateProfile:  (body) => request('put',  '/auth/update', body),
  changePassword: (body) => request('post', '/auth/change-password', body),

  // User data
  getFavorites:   async () => {
    const data = await request('get', '/user/favorites')
    return Array.isArray(data) ? data : (data?.favorites ?? [])
  },
  addFavorite:    ({ movieId, ...rest }) => request('post',   '/user/favorites', { movieId, ...rest }),
  removeFavorite: (movieId) => request('delete', `/user/favorites/${movieId}`),
  getReviews:     () => request('get',    '/user/reviews'),
  removeReview:   (id) => request('delete', `/user/reviews/${id}`),
  getHistory:     () => request('get',    '/user/history'),
  getWatchLater:  () => request('get',    '/user/watch-later'),
  addWatchLater:  ({ movieId, ...rest }) => request('post',   '/user/watch-later', { movieId, ...rest }),
  removeWatchLater: (movieId) => request('delete', `/user/watch-later/${movieId}`),

  // Shareable favorites
  getShareToken: () => request('get', '/user/favorites/share'),
  manageShareToken: (body) => request('post', '/user/favorites/share', body),

  // Account deletion (deep delete on server)
  deleteAccount:  () => request('delete', '/auth/delete'),
}

export default profileApi
