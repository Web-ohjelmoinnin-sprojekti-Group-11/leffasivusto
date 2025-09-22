import api from "./api";

export const finnkinoApi = {
  getCities: async () => {
    const { data } = await api.get("/finnkino/cities");
    return data;
  },
  getTheaters: async (area) => {
    const { data } = await api.get("/finnkino/theaters", { params: { area } });
    return data;
  },
  getShowtimes: async ({ area, theatreId, date }) => {
    const { data } = await api.get("/finnkino/showtimes", { params: { area, theatreId, date } });
    return data;
  },
};

export default finnkinoApi;