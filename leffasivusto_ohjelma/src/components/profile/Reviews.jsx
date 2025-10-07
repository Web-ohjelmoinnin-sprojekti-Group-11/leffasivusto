// src/components/profile/Reviews.jsx
import { useEffect, useState } from "react";
import { Alert, Button, Spinner } from "react-bootstrap";
import * as reviewApi from "../../services/reviewService";
import { getTitleById } from "../../services/movieService";
import DetailModal from "../movies/DetailModal";

const IMG = (p, size = "w342") => (p ? `https://image.tmdb.org/t/p/${size}${p}` : null);

// pienen esikatselun rivien rajaus
const CLAMP_STYLE = {
  display: "-webkit-box",
  WebkitLineClamp: 4,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export default function Reviews() {
  const [rows, setRows] = useState([]);   // [{ review, item }]
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setBusy(true);
        setErr("");

        const mine = await reviewApi.getMine(); // [{ review_id, movie_id, rating, text, created_at }]
        const ids = [...new Set(mine.map((r) => r.movie_id))];
        const items = await Promise.all(ids.map((id) => getTitleById(id).catch(() => null)));

        const byId = Object.fromEntries(items.filter(Boolean).map((it) => [it.id, it]));

        const data = mine
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .map((r) => ({
            review: r,
            item:
              byId[r.movie_id] || {
                id: r.movie_id,
                title: `Movie #${r.movie_id}`,
                name: `Movie #${r.movie_id}`,
                poster_path: null,
                release_date: "",
                vote_average: null,
                media_type: "movie",
              },
          }));

        if (on) setRows(data);
      } catch (e) {
        setErr(e?.response?.data?.error || e?.message || "Error loading reviews");
      } finally {
        on && setBusy(false);
      }
    })();
    return () => { on = false; };
  }, []);

  const remove = async (review_id) => {
    const prev = rows;
    setRows((s) => s.filter((x) => x.review.review_id !== review_id)); // optimistinen
    try {
      await reviewApi.removeOne(review_id);
    } catch {
      setRows(prev);
      alert("Deletion failed");
    }
  };

  if (busy) {
    return (
      <div className="py-3">
        <Spinner animation="border" size="sm" /> <span className="ms-2">Loading…</span>
      </div>
    );
  }
  if (err) return <Alert variant="danger">{err}</Alert>;
  if (!rows.length) return <div className="text-muted">No reviews yet.</div>;

   return (
    <>
      {/* HUOM: lisätty gy-4 -> enemmän pystyväliä, mutta pidetään g-3 vaakagap */}
      <div className="row row-cols-2 row-cols-md-4 row-cols-lg-6 g-3 gy-4">
        {rows.map(({ review, item }) => {
          const title = item.title || item.name || `Movie #${item.id}`;
          const poster = IMG(item.poster_path);
          const dateStr = review.created_at ? new Date(review.created_at).toLocaleDateString() : "";

          return (
            <div className="col" key={review.review_id}>
              <div
                className="h-100 card border-0 shadow-sm position-relative d-flex"
                role="button"
                onClick={() => setSelected(item)}
              >
                {/* Poster */}
                {poster ? (
                  <img
                    src={poster}
                    alt={title}
                    className="card-img-top"
                    style={{ objectFit: "cover", aspectRatio: "2/3" }}
                  />
                ) : (
                  <div
                    className="card-img-top bg-light d-flex align-items-center justify-content-center"
                    style={{ aspectRatio: "2/3" }}
                  >
                    <span className="text-muted small">No image</span>
                  </div>
                )}

                {/* Otsikko */}
                <div className="card-body p-2">
                  <div className="fw-semibold small text-truncate" title={title}>
                    {title}
                  </div>
                </div>

                {/* Oma arvosana overlayna */}
                <span
                  className="position-absolute top-0 end-0 translate-middle badge rounded-pill bg-secondary"
                  style={{ zIndex: 2 }}
                  title="Your rating"
                >
                  ⭐ {review.rating}/5
                </span>

                {/* ↓ Kaikki “alatekstit” kortin sisällä footerissa, tasainen pohja */}
                <div className="card-footer bg-transparent border-0 pt-0 mt-auto">
                  <div className="d-flex align-items-center justify-content-between">
                    <small className="text-muted">{dateStr}</small>
                    {/* estä modalin avautuminen deleteä klikatessa */}
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); remove(review.review_id); }}
                    >
                      Delete
                    </Button>
                  </div>

                  {review.text && (
                    <div className="mt-1 small" style={CLAMP_STYLE} title={review.text}>
                      {review.text}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <DetailModal show={!!selected} item={selected} onHide={() => setSelected(null)} />
    </>
  );
}
