import { useEffect, useMemo, useState } from 'react';
import heroLight from '../../assets/hero/hero_light.png';
import heroDark  from '../../assets/hero/hero_light.png';
import SearchBar from '../search/SearchBar.jsx';
import HeroGreeting from './HeroGreeting.jsx';

export default function HeroSection({
  showSearch = true,
  // Greeting asetukset (etusivulla pysyvä teksti)
  greetingText = "Which movie shall we watch today?",
  greetingPersistent = true,
  greetingDurationMs = 2500,   // käytössä vain jos greetingPersistent=false
  // CTA introa varten
  ctaLabel = 'Start Adventure',
  ctaSubLabel = 'Push me',
  onCta,
  glowSweep = false,           // intro-vaiheen “glow sweep”
}) {
  // ThemeContext kirjoittaa <html data-theme="pink|dark">
  const [theme, setTheme] = useState(
    typeof document !== 'undefined'
      ? document.documentElement.getAttribute('data-theme') || 'pink'
      : 'pink'
  );
  const [leaving, setLeaving] = useState(false); // piilota CTA heti klikissä

  useEffect(() => {
    const el = document.documentElement;
    const mo = new MutationObserver(() =>
      setTheme(el.getAttribute('data-theme') || 'pink')
    );
    mo.observe(el, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);

  const src = useMemo(() => (theme === 'dark' ? heroDark : heroLight), [theme]);

  const handleCta = () => {
    setLeaving(true);              // nappi katoaa heti
    if (typeof onCta === 'function') onCta();
  };

  return (
    <div className={`hero-bleed position-relative${glowSweep ? ' glow-sweep' : ''}`}>
      <img className="hero-img" src={src} alt="Pink Baby Dragons movie night" />

      {/* Pysyvä tervehdys näkyy vain “valmiissa” näkymässä (eli kun showSearch = true) */}
      {showSearch && greetingText && (
        <HeroGreeting
          text={greetingText}
          persistent={greetingPersistent}
          durationMs={greetingDurationMs}
        />
      )}

      <div className="hero-overlay d-flex justify-content-center">
        {showSearch ? (
          <div className="hero-search w-100">
            <SearchBar size="lg" className="hero-search" />
          </div>
        ) : (
          !leaving && (
            <button
              type="button"
              className="btn btn-primary btn-lg px-5 py-3 rounded-pill shadow d-flex flex-column align-items-center"
              onClick={handleCta}
              aria-label={`${ctaLabel} — ${ctaSubLabel}`}
            >
              <span className="fw-semibold">{ctaLabel}</span>
              <small className="opacity-75" style={{ marginTop: '-2px' }}>
                {ctaSubLabel}
              </small>
            </button>
          )
        )}
      </div>
    </div>
  );
}
