import api from './api'

export async function getTrending() {
  const { data } = await api.get('/movies/trending') // TODO: backend kun valmis
  return data.results || []
}
