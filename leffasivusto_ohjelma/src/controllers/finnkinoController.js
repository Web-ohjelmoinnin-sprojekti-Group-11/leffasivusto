import { getCities, getShowtimes } from '../services/finnkinoService'

export async function fetchCities() {
  return await getCities()
}

export async function fetchShowtimes(params) {
  return await getShowtimes(params)
}
