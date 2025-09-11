import api from './api'

export async function getCities() {
  const { data } = await api.get('/finnkino/cities')
  return data
}

export async function getShowtimes(params) {
  const { data } = await api.get('/finnkino/showtimes', { params })
  return data
}
