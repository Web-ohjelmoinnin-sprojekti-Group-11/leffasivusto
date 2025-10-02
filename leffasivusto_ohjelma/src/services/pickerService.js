import api from "./api";

/** params: { keyword?: string, genreId?: number|null, decade: number } */
export async function randomPick({ keyword = "", genreId = null, decade = null }) {
  const params = {};
  if (keyword) params.kw = keyword;
  if (genreId) params.genre = genreId;
  if (decade) params.decade = decade;
  const { data } = await api.get("/tmdb/picker", { params }); // reitti tmdb-routerissa
  return data;
}
