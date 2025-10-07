import { useMemo, useEffect, useState } from "react";
import { Spinner, Alert, Button, InputGroup, FormControl } from "react-bootstrap";
import { useFavorites } from "../../hooks/useFavorites";
import MovieGrid from "../movies/MovieGrid.jsx";
import DetailModal from "../movies/DetailModal.jsx";
import { getTitleDetails } from "../../services/movieService";
import { profileApi } from "../../services/profileService";
import { getToken } from "../../services/token";
import { useAuth } from "../../state/AuthContext.jsx";

// TMDB image helper
const IMG = (p, size = "w500") => (p ? `https://image.tmdb.org/t/p/${size}${p}` : null);

export default function Favorites() {
  const { favoritesQ } = useFavorites();
  const [shareToken, setShareToken] = useState(null);
  const [sharing, setSharing] = useState(false);
  const { setAuthOpen } = useAuth();

  // DetailModal
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await profileApi.getShareToken();
        if (mounted) setShareToken(res?.token || null);
      } catch {
        /* ignore */
      }
    })();
    return () => { mounted = false; };
  }, []);

  const baseUrl = typeof window !== "undefined" ? `${window.location.protocol}//${window.location.host}` : "";
  const shareUrl = shareToken ? `${baseUrl}/share/${shareToken}` : "";

  const createOrRemove = async (action) => {
    const at = getToken();
    if (!at) {
      alert("You must be logged in to create or remove a share link. Please sign in and try again.");
      return;
    }
    setSharing(true);
    try {
      if (action === "create") {
        const r = await profileApi.manageShareToken({ action: "create" });
        setShareToken(r?.token || null);
      } else {
        await profileApi.manageShareToken({ action: "remove" });
        setShareToken(null);
      }
    } catch (e) {
      const serverErr = e?.serverData?.error || e?.serverData?.message || e?.message || "";
      if (e?.status === 401 || /Missing or invalid Authorization header/i.test(serverErr)) {
        setAuthOpen(true);
        alert("Please sign in to create or remove a share link.");
      } else {
        const sd = e?.serverData || {};
        const details = sd.detail ? `${sd.detail}` : (sd.error || sd.message || e?.message || "no details");
        const code = sd.code ? ` code=${sd.code}` : "";
        alert(`Failed to manage share link (status: ${e?.status || "unknown"}${code})\n\n${details}`);
      }
    } finally { setSharing(false); }
  };

  const copyToClipboard = async () => {
    if (!shareUrl) return;
    try { await navigator.clipboard.writeText(shareUrl); alert("Link copied"); }
    catch { alert("Copy failed. Use manual copy."); }
  };

  const ids = useMemo(
    () => (Array.isArray(favoritesQ.data) ? favoritesQ.data.map((x) => Number(x?.id ?? x)) : []),
    [favoritesQ.data]
  );

  const [movies, loading, error] = useFavoriteMovies(ids);

  if (favoritesQ.isPending || loading) {
    return <div className="py-3"><Spinner animation="border" size="sm" /> <span className="ms-2">Loading…</span></div>;
  }
  if (favoritesQ.isError || error) {
    const msg = favoritesQ.error?.message || error?.message || "Failed to load favorites";
    return <Alert variant="danger">{msg}</Alert>;
  }
  if (!movies.length) return <div className="text-muted">No favorites yet.</div>;

  const isAuthed = !!getToken();

  return (
    <>
      <div className="mb-3">
        <small className="text-muted">Share link:</small>
        <InputGroup className="mt-1">
          <FormControl readOnly value={shareUrl} placeholder="Not shared" />
          <Button variant="outline-secondary" onClick={copyToClipboard} disabled={!shareUrl}>Copy</Button>
          <Button
            variant="outline-primary"
            onClick={() => createOrRemove(shareToken ? "remove" : "create")}
            disabled={sharing || !isAuthed}
          >
            {shareToken ? "Remove share" : "Create / Share"}
          </Button>
        </InputGroup>
        {!isAuthed && <div className="form-text text-muted">Sign in to create a public share link.</div>}
      </div>

      <MovieGrid movies={movies} onSelect={(m) => setSelected(m)} />
      <DetailModal show={!!selected} item={selected} onHide={() => setSelected(null)} />
    </>
  );
}

import { useQueries } from "@tanstack/react-query";
function useFavoriteMovies(ids) {
  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["title", "movie", id],
      queryFn: async () => {
        const data = await getTitleDetails("movie", id);
        const d = data?.detail;
        return {
          id,
          title: d?.title || d?.name || `#${id}`,
          poster: IMG(d?.poster_path),
          releaseDate: d?.release_date,
          vote: typeof d?.vote_average === "number" ? d.vote_average : 0,
          mediaType: "movie",   // auttaa detailien noudossa
          type: "title",
        };
      },
      staleTime: 5 * 60_000,
    })),
  });

  const loading = queries.some((q) => q.isPending);
  const error = queries.find((q) => q.isError)?.error || null;
  const movies = queries.filter((q) => q.isSuccess && q.data).map((q) => q.data);
  return [movies, loading, error];
}
