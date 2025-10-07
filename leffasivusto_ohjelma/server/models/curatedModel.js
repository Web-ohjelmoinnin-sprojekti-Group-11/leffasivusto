// server/models/curatedModel.js
import tmdb from "../utils/tmdb.js";

/**
 * Hakee discoverista useita sivuja ja yhdistää. Palauttaa {items, total_pages, total_results}
 */
export async function discoverPaged(params = {}, { maxPages = 50 } = {}) {
  const page1 = Number(params.page || 1);
  const { data: first } = await tmdb.get("/discover/movie", { params: { ...params, page: page1 } });

  const totalPages = Math.min(first?.total_pages || 1, maxPages);
  const promises = [];
  for (let p = page1 + 1; p <= totalPages; p++) {
    promises.push(tmdb.get("/discover/movie", { params: { ...params, page: p } }));
  }
  const rest = await Promise.all(promises);

  const items = [first, ...rest.map(r => r.data)]
    .flatMap(d => Array.isArray(d?.results) ? d.results : []);

  return {
    items,
    total_pages: totalPages,
    total_results: first?.total_results ?? items.length,
  };
}

/** IMDB-tyylinen painotettu arvosana (Bayes) */
export function weightedRating({ R, v, C, m }) {
  // R = movie’s average rating, v = vote count, C = mean vote across set, m = min votes threshold
  return (v / (v + m)) * R + (m / (v + m)) * C;
}
