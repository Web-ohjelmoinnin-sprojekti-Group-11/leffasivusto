// src/hooks/useGroupShowtimes.js
import { useEffect, useState } from "react";
import { getGroupShowtimes } from "../services/showtimeService";

export default function useGroupShowtimes(id) {
  const [stLoading, setStLoading] = useState(true);
  const [stError, setStError] = useState(null);
  const [showtimes, setShowtimes] = useState([]);

  const fmtTime = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("fi-FI", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso || "";
    }
  };

  const loadShowtimes = async () => {
    try {
      setStLoading(true);
      setStError(null);
      const listRaw = await getGroupShowtimes(id);
      const list = listRaw
        .map((s) => ({
          ...s,
          pretty_time: s.pretty_time || fmtTime(s.showtime || s.created_at),
        }))
        .sort((a, b) => new Date(a.showtime) - new Date(b.showtime));
      setShowtimes(list);
    } catch (e) {
      console.error(e);
      setStError("Failed to load group showtimes");
    } finally {
      setStLoading(false);
    }
  };

  useEffect(() => {
    loadShowtimes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return { stLoading, stError, showtimes, loadShowtimes };
}
