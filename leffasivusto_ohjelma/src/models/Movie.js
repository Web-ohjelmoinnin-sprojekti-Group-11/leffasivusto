// src/models/Movie.js
export default class Movie {
  constructor(raw) {
    this.id = raw.id;
    this.title = raw.title || raw.name || "";
    this.overview = raw.overview || "";
    this.releaseDate = raw.release_date || raw.first_air_date || "";
    this.vote = raw.vote_average ?? 0;
    this.poster = raw.poster_path
      ? `https://image.tmdb.org/t/p/w500${raw.poster_path}`
      : null;
  }
}
