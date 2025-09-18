import React from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import useDetails from "../../hooks/useDetails";

const IMG = (p, size = "w500") => p ? `https://image.tmdb.org/t/p/${size}${p}` : null;

export default function DetailModal({ show, item, onHide }) {
  // TÄRKEÄÄ: vain yksi hook-kutsu, ei ehdollisia hookkeja
  const { media, data, loading, error } = useDetails(item);

  if (!show) return null;

  const title = item?.title || item?.name || "Details";

  // ---- Rungon rakentaminen ilman hookeja ----
  let body = null;

  if (loading) {
    body = (
      <div className="text-center p-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  } else if (error) {
    body = <div className="text-danger p-3">{error}</div>;
  } else if (data?.kind === "title") {
    const d = data.detail;
    const credits = data.credits || {};
    const cast = (credits.cast || []).slice(0, 10);
    const crew = (credits.crew || []).filter(c => /Directing/i.test(c.known_for_department || c.department)).slice(0, 5);

    body = (
      <div className="row g-3">
        <div className="col-12 col-md-4">
          {d?.poster_path && <img src={IMG(d.poster_path)} alt={d.title} className="img-fluid rounded" />}
        </div>
        <div className="col-12 col-md-8">
          <h4 className="mb-1">{d?.title || d?.name}</h4>
          <div className="text-muted mb-2">
            {(d?.release_date || d?.first_air_date || "").slice(0, 4)} • ⭐ {Number(d?.vote_average || 0).toFixed(1)}
          </div>
          {d?.overview && <p className="mb-3">{d.overview}</p>}

          {!!crew.length && (
            <>
              <h6 className="mt-3">Director(s)</h6>
              <ul className="mb-2">
                {crew.map(c => <li key={c.credit_id || c.id}>{c.name}</li>)}
              </ul>
            </>
          )}

          {!!cast.length && (
            <>
              <h6 className="mt-3">Cast</h6>
              <ul className="mb-0">
                {cast.map(c => (
                  <li key={c.cast_id || c.credit_id || c.id}>
                    {c.name}{c.character ? ` as ${c.character}` : ""}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    );
  } else if (data?.kind === "person") {
    const p = data.person;
    const cast = (data.credits?.cast || []).slice(0, 10);
    const crew = (data.credits?.crew || []).slice(0, 10);

    body = (
      <div className="row g-3">
        <div className="col-12 col-md-4">
          {p?.profile_path && <img src={IMG(p.profile_path)} alt={p.name} className="img-fluid rounded" />}
        </div>
        <div className="col-12 col-md-8">
          <h4 className="mb-1">{p?.name}</h4>
          <div className="text-muted mb-2">{p?.known_for_department}</div>
          {p?.biography && <p className="mb-3">{p.biography}</p>}

          {!!cast.length && (
            <>
              <h6 className="mt-3">Known for (acting)</h6>
              <ul className="mb-2">
                {cast.map(c => (
                  <li key={`${c.credit_id || c.id}-cast`}>
                    {(c.title || c.name) || "—"} {c.release_date ? `(${c.release_date.slice(0,4)})` : ""}
                  </li>
                ))}
              </ul>
            </>
          )}

          {!!crew.length && (
            <>
              <h6 className="mt-3">Crew</h6>
              <ul className="mb-0">
                {crew.map(c => (
                  <li key={`${c.credit_id || c.id}-crew`}>
                    {c.job} — {(c.title || c.name) || "—"} {c.release_date ? `(${c.release_date.slice(0,4)})` : ""}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    );
  } else {
    body = <div className="p-3">No details.</div>;
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg" dialogClassName="modal-xxl">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
