import api from "./api";

/** Miksi: keskitetty virheenkäsittely → järkevät viestit UI:hin. */
async function request(method, url, data) {
  try {
    const res = await api({ method, url, data });
    return res.data;
  } catch (e) {
    const msg =
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      e?.message ||
      "Tuntematon virhe";
    throw new Error(msg);
  }
}

export const profileApi = {
  // Profiili
  getProfile:     () => request("get",  "/auth/me"),
  updateProfile:  (body) => request("put",  "/auth/update", body),           // backend: lisää
  changePassword: (body) => request("post", "/auth/change-password", body),  // backend: lisää

  // Käyttäjän oma toiminta
  getFavorites:   () => request("get",    "/user/favorites"),                 // backend: lisää
  removeFavorite: (movieId) => request("delete", `/user/favorites/${movieId}`),
  getReviews:     () => request("get",    "/user/reviews"),
  removeReview:   (id) => request("delete", `/user/reviews/${id}`),
  getHistory:     () => request("get",    "/user/history"),
};

export default profileApi;