// src/hooks/useMovies.js
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { fetchTrending, fetchSearch } from "../controllers/movieController";

/**
 * Yleishook: jos query on tyhjä -> trending, muuten -> search (multi).
 * Laajennettu: optional filter { year, minVote, genres: number[] }.
 *  - year: number (esim. 2025)
 *  - minVote: number (esim. 8)
 *  - genres: TMDB-genreID:t (esim. [878, 99, 16])
 */
export function useMovies({ query = "", page = 1, enabled = true, filter } = {}) {
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
        // Search: välitetään myös filter backendille (jos sellainen on)
        const { results, totalPages: tp } = await fetchSearch(q, page, {
          signal: controller.signal,
          filter,
        });
        setMovies(results);
        setTotalPages(tp || 1);
      } else {
        // Trending: jos filteriä annettu -> pyydetään suodatettu trending backendiltä
        const list = await fetchTrending({
          signal: controller.signal,
          filter,
        });
        setMovies(list);
        setTotalPages(1);
      }
    } catch (e) {
      if (e?.name !== "CanceledError" && e?.name !== "AbortError") {
        setError("Datan haku epäonnistui.");
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, isSearch, q, page, filter]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  const refetch = useCallback(() => load(), [load]);

  return useMemo(
    () => ({ movies, loading, error, page, totalPages, refetch }),
    [movies, loading, error, page, totalPages, refetch]
  );
}

// Mukavuus-wrapperit – säilytetään entiset
export const useTrendingMovies = (enabled = true) =>
  useMovies({ query: "", page: 1, enabled });

export const useSearchMovies = (query, page = 1, enabled = true) =>
  useMovies({ query, page, enabled });
