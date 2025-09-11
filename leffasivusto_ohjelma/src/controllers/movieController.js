import { getTrending } from '../services/movieService'

export async function fetchTrending() {
  return await getTrending()
}
