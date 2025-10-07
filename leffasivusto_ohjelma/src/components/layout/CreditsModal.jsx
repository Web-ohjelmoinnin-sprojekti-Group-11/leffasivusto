import { Modal, Button } from "react-bootstrap";

export default function CreditsModal({ show, onHide }) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Credits</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-3">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
        <p className="mb-1">
          TMDB logo © TMDB — used per their branding guidelines.
        </p>
        <p className="mb-0">
          Learn more:&nbsp;
          <a
            href="https://developer.themoviedb.org/docs/faq"
            target="_blank"
            rel="noopener noreferrer"
          >
            TMDB Developer FAQ
          </a>
          .
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
