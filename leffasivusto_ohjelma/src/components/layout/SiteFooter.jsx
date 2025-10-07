import { useState } from "react";
import CreditsModal from "./CreditsModal.jsx";
// ⬇️ oikea polku styles-kansioon
import "../../styles/SiteFooter.css";

export default function SiteFooter() {
  const [open, setOpen] = useState(false);

  return (
    <footer className="site-footer mt-4">
      <div className="container d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="d-flex align-items-center gap-2">
          {/* Vaihda polut omien assettiesi mukaan (public/assets/…) */}
          <picture>
            {/* vaalea logo vaalealle teemalle */}
            <source srcSet="/assets/tmdb-black.svg" media="(prefers-color-scheme: light)" />
            {/* tumma logo tummalle taustalle */}
            <img src="/assets/tmdb-white.svg" alt="TMDB logo" height={18} />
          </picture>

          <span className="small">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </span>
        </div>

        <nav className="d-flex align-items-center gap-3 small">
          <button className="btn btn-sm btn-outline-primary" onClick={() => setOpen(true)}>
            Credits
          </button>
          <a
            className="link-underline link-underline-opacity-0"
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="The Movie Database"
          >
            themoviedb.org
          </a>
        </nav>
      </div>

      <CreditsModal show={open} onHide={() => setOpen(false)} />
    </footer>
  );
}
