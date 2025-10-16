// src/hooks/useFavorites.js
import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../services/profileService';
import { useAuth } from '../state/AuthContext.jsx';

function toIdSet(list) {
  const out = new Set();
  for (const it of Array.isArray(list) ? list : []) {
    const id = Number(it?.id ?? it?.movieId ?? it);
    if (Number.isFinite(id)) out.add(id);
  }
  return out;
}

export function useFavorites() {
  const qc = useQueryClient();
  const { isAuthenticated, setAuthOpen, user } = useAuth();

  // 🔑 Käyttäjäkohtainen queryKey
  const qKey = ['favorites', user?.user_id ?? 'anon'];

  const favoritesQ = useQuery({
    queryKey: qKey,
    queryFn: async () => {
      const data = await profileApi.getFavorites();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user?.user_id && isAuthenticated, // ei haeta ellei kirjautunut
    // Näytä heti tyhjä lista kun käyttäjä vaihtuu / uloskirjautuu
    placeholderData: [],
    staleTime: 60_000,
    gcTime: 30 * 60_000,
  });

  const ids = useMemo(() => toIdSet(favoritesQ.data), [favoritesQ.data]);
  const isFavorited = (movieId) => ids.has(Number(movieId));

  const addMutation = useMutation({
    mutationFn: async (movie) => {
      const movieId = Number(movie?.id ?? movie);
      if (!Number.isFinite(movieId)) throw new Error('Invalid movie id');
      return profileApi.addFavorite({ movieId });
    },
    onMutate: async (movie) => {
      const movieId = Number(movie?.id ?? movie);
      await qc.cancelQueries({ queryKey: qKey });
      const prev = qc.getQueryData(qKey);
      const next = Array.isArray(prev) ? [...prev] : [];
      if (!next.some((x) => Number(x?.id ?? x) === movieId)) next.unshift({ id: movieId });
      qc.setQueryData(qKey, next);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(qKey, ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: qKey }),
  });

  const removeMutation = useMutation({
    mutationFn: async (movieId) => {
      const id = Number(movieId);
      if (!Number.isFinite(id)) throw new Error('Invalid movie id');
      return profileApi.removeFavorite(id);
    },
    onMutate: async (movieId) => {
      const id = Number(movieId);
      await qc.cancelQueries({ queryKey: qKey });
      const prev = qc.getQueryData(qKey);
      const next = (Array.isArray(prev) ? prev : []).filter((x) => Number(x?.id ?? x) !== id);
      qc.setQueryData(qKey, next);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(qKey, ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: qKey }),
  });

  const requireAuthOr = () => {
    if (!isAuthenticated) { setAuthOpen(true); return false; }
    return true;
  };

  return {
    favoritesQ,
    ids,
    isFavorited,
    add: (movie) => (requireAuthOr() ? addMutation.mutate(movie) : undefined),
    remove: (movieId) => (requireAuthOr() ? removeMutation.mutate(movieId) : undefined),
    toggle: (movie) => {
      const id = Number(movie?.id ?? movie);
      return isFavorited(id)
        ? (requireAuthOr() ? removeMutation.mutate(id) : undefined)
        : (requireAuthOr() ? addMutation.mutate(movie) : undefined);
    },
    adding: addMutation.isPending,
    removing: removeMutation.isPending,
  };
}
