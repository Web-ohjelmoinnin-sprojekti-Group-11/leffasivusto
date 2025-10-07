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
        // --- SEARCH: hae chunk (5 sivua = ~100 tulosta) ja yhdistä ---
        const CHUNK = 5;
        const first = await fetchSearch(q, page, { signal: controller.signal, filter });
        const tp = first?.totalPages || 1;

        // Hae loput sivut rinnakkain
        const end = Math.min(tp, page + CHUNK - 1);
        const reqs = [];
        for (let p = page + 1; p <= end; p++) {
          reqs.push(fetchSearch(q, p, { signal: controller.signal, filter }));
        }
        const rest = await Promise.all(reqs);

        // Yhdistä + dedupe id:llä
        const all = [first, ...rest].flatMap(r => r?.results ?? []);
        const byId = new Map();
        for (const m of all) {
          const id = Number(m?.id);
          if (Number.isFinite(id) && !byId.has(id)) byId.set(id, m);
        }

        setMovies(Array.from(byId.values()));
        setTotalPages(tp);
      } else {
        // --- TRENDING: ~100 kpl pool (controller kasaa tämän puolestamme) ---
        const list = await fetchTrending({ signal: controller.signal, filter, size: 100 });
        setMovies(list || []);
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
