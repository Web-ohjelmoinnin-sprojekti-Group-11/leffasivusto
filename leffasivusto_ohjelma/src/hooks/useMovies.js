// src/hooks/useMovies.js
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { fetchTrending, fetchSearch } from "../controllers/movieController";

/**
 * Yleishook: jos query on tyhjä -> trending, muuten -> search (multi).
 * @param {object} opts
 * @param {string} [opts.query]   - Hakusana; tyhjä => trending
 * @param {number} [opts.page=1]  - Sivunumero (vain haussa)
 * @param {boolean} [opts.enabled=true] - Voiko haku käynnistyä
 */
export function useMovies({ query = "", page = 1, enabled = true } = {}) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);

  const abortRef = useRef(null);
  const q = (query || "").trim();
  const isSearch = q.length > 0;

  const load = useCallback(async () => {
    if (!enabled) return;

    // Peruuta käynnissä oleva pyyntö
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");

    try {
      if (isSearch) {
        const { results, totalPages: tp } = await fetchSearch(q, page, {
          signal: controller.signal,
        });
        setMovies(results);
        setTotalPages(tp || 1);
      } else {
        const list = await fetchTrending({ signal: controller.signal });
        setMovies(list);
        setTotalPages(1);
      }
    } catch (e) {
      // Jos peruutettiin, ei ilmoiteta virhettä
      if (e?.name !== "CanceledError" && e?.name !== "AbortError") {
        setError("Datan haku epäonnistui.");
        // eslint-disable-next-line no-console
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, isSearch, q, page]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  // API pintaan myös manuaalista uudelleenhakua varten
  const refetch = useCallback(() => load(), [load]);

  return useMemo(
    () => ({ movies, loading, error, page, totalPages, refetch }),
    [movies, loading, error, page, totalPages, refetch]
  );
}

// Mukavuus-wrapperit
export const useTrendingMovies = (enabled = true) =>
  useMovies({ query: "", page: 1, enabled });

export const useSearchMovies = (query, page = 1, enabled = true) =>
  useMovies({ query, page, enabled });
