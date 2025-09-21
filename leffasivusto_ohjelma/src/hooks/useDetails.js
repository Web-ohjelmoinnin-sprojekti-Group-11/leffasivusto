// YKSI hook kaikkeen: title(movie/tv) TAI person
import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

// Päätellään media-tyyppi turvallisesti myös "title"-korteille
function resolveMedia(item) {
  if (!item) return null;
  if (item.mediaType) return item.mediaType;              // "movie" | "tv" | "person"
  if (item.type === "person") return "person";
  if (item.type === "title") {
    // jos kortissa on first_air_date => tv, muuten movie
    return item.first_air_date ? "tv" : "movie";
  }
  // fallbackit: jos on tv:n päiväys → tv, jos on releaseDate → movie
  if (item.first_air_date) return "tv";
  if (item.releaseDate || item.release_date) return "movie";
  return null;
}

export default function useDetails(item) {
  const media = useMemo(() => resolveMedia(item), [item]);
  const id = item?.id;

  const [data, setData] = useState(null);   // {kind:'title'|'person', ...payload}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!id || !media) { setData(null); return; }
      try {
        setLoading(true); setError("");

        if (media === "person") {
          const r = await api.get(`/tmdb/person/${id}`);
          if (!cancelled) setData({ kind: "person", ...r.data });
        } else if (media === "movie" || media === "tv") {
          const r = await api.get(`/tmdb/title/${media}/${id}`);
          if (!cancelled) setData({ kind: "title", media, ...r.data });
        } else {
          if (!cancelled) setData(null);
        }
      } catch (e) {
        if (!cancelled) setError("Details fetch failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [id, media]);

  return { media, data, loading, error };
}
