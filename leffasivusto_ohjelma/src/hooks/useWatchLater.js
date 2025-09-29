// src/hooks/useWatchLater.js
import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "../services/profileService";
import { useAuth } from "../state/AuthContext.jsx";

function toIdSet(list) {
  const out = new Set();
  for (const it of Array.isArray(list) ? list : []) {
    const id = Number(it?.id ?? it?.movieId ?? it);
    if (Number.isFinite(id)) out.add(id);
  }
  return out;
}

export function useWatchLater() {
  const qc = useQueryClient();
  const { isAuthenticated, setAuthOpen } = useAuth();

  const watchLaterQ = useQuery({
    queryKey: ["watchLater"],
    queryFn: async () => {
      const data = await profileApi.getWatchLater();
      return Array.isArray(data) ? data : [];
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
    gcTime: 30 * 60_000,
  });

  const ids = useMemo(() => toIdSet(watchLaterQ.data), [watchLaterQ.data]);
  const isInWatchLater = (movieId) => ids.has(Number(movieId));

  const addMutation = useMutation({
    mutationFn: async (movie) => {
      const movieId = Number(movie?.id ?? movie);
      if (!Number.isFinite(movieId)) throw new Error("Invalid movie id");
      return profileApi.addWatchLater({ movieId });
    },
    onMutate: async (movie) => {
      const movieId = Number(movie?.id ?? movie);
      await qc.cancelQueries({ queryKey: ["watchLater"] });
      const prev = qc.getQueryData(["watchLater"]);
      const next = Array.isArray(prev) ? [...prev] : [];
      if (!next.some((x) => Number(x?.id ?? x) === movieId))
        next.unshift({ id: movieId });
      qc.setQueryData(["watchLater"], next);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["watchLater"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["watchLater"] }),
  });

  const removeMutation = useMutation({
    mutationFn: async (movieId) => {
      const id = Number(movieId);
      if (!Number.isFinite(id)) throw new Error("Invalid movie id");
      return profileApi.removeWatchLater(id);
    },
    onMutate: async (movieId) => {
      const id = Number(movieId);
      await qc.cancelQueries({ queryKey: ["watchLater"] });
      const prev = qc.getQueryData(["watchLater"]);
      const next = (Array.isArray(prev) ? prev : []).filter(
        (x) => Number(x?.id ?? x) !== id
      );
      qc.setQueryData(["watchLater"], next);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["watchLater"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["watchLater"] }),
  });

  const requireAuthOr = () => {
    if (!isAuthenticated) {
      setAuthOpen(true);
      return false;
    }
    return true;
  };

  return {
    watchLaterQ,
    ids,
    isInWatchLater,
    add: (movie) =>
      requireAuthOr() ? addMutation.mutate(movie) : undefined,
    remove: (movieId) =>
      requireAuthOr() ? removeMutation.mutate(movieId) : undefined,
    toggle: (movie) => {
      const id = Number(movie?.id ?? movie);
      return isInWatchLater(id)
        ? requireAuthOr() && removeMutation.mutate(id)
        : requireAuthOr() && addMutation.mutate(movie);
    },
    adding: addMutation.isPending,
    removing: removeMutation.isPending,
  };
}