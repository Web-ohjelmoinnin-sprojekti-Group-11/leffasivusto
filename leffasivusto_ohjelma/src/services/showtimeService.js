import api from "./api";
import { getToken } from "./token";

const auth = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

export const getGroupShowtimes = async (groupId) => {
  const res = await api.get(`/showtimes/${groupId}`, auth());
  return res.data?.showtimes ?? [];
};

export const getMyShowtimes = async () => {
  const res = await api.get(`/showtimes/mine`, auth());
  return res.data?.showtimes ?? [];
};

/** payload: { title, theatre_name, date: "dd.mm.yyyy", showtime: "HH:MM", movie_id?: number|null } */
export const addShowtime = async (groupId, payload) => {
  const res = await api.post(`/showtimes/${groupId}`, payload, auth());
  return res.data?.showtime ?? null;
};
