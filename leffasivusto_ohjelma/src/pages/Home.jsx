// src/pages/Home.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Row, Col, Card } from "react-bootstrap";
import SidebarShowtimes from "../components/layout/SidebarShowtimes.jsx";
import FiltersBar from "../components/layout/FiltersBar.jsx";
import MovieGrid from "../components/movies/MovieGrid.jsx";
import HeroSection from "../components/layout/HeroSection.jsx";
import { useIntro } from "../state/IntroContext.jsx";
import { fetchTrending, fetchDiscover } from "../controllers/movieController";
import DetailModal from "../components/movies/DetailModal";

/* apufunktiot lajitteluun */
const getYear = (m) =>
  (m.releaseDate && Number(String(m.releaseDate).slice(0, 4))) ||
  (m.first_air_date && Number(String(m.first_air_date).slice(0, 4))) || 0;

const getVote = (m) => (typeof m.vote === "number" ? m.vote : m.vote_average ?? 0);
const getTitle = (m) => (m.title || m.name || "").toString();

export default function Home() {
  const { introDone, completeIntro } = useIntro();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  // Discover – filtteri & sivutus
  const [activeFilter, setActiveFilter] = useState(null); // { key, label, params }
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Sorttaus (vain Discover-tilassa)
  const [sortKey, setSortKey] = useState("rating"); // rating | year | alpha

  useEffect(() => {
    if (!introDone) return;

    let cancel = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        if (activeFilter) {
          const { results, totalPages: tp } = await fetchDiscover({
            ...(activeFilter.params || {}),
            page,
          });
          if (!cancel) {
            setMovies(results || []);
            setTotalPages(tp || 1);
          }
        } else {
          const list = await fetchTrending();
          if (!cancel) {
            setMovies(list || []);
            setTotalPages(1);
          }
        }
      } catch (e) {
        if (!cancel) {
          console.error(e);
          setError("Elokuvien haku epäonnistui.");
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    run();
    return () => {
      cancel = true;
    };
  }, [introDone, activeFilter, page]);

  // Filtteri vaihtui → takaisin sivulle 1 ja laitetaan oletuslajittelu
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setPage(1);
    setSortKey("rating");
  };

  // Lajittelu (vain discover-näytössä)
  const sorted = useMemo(() => {
    if (!activeFilter) return movies;
    const s = movies.slice();
    if (sortKey === "year") s.sort((a, b) => getYear(b) - getYear(a));
    if (sortKey === "rating") s.sort((a, b) => getVote(b) - getVote(a));
    if (sortKey === "alpha") s.sort((a, b) => getTitle(a).localeCompare(getTitle(b)));
    return s;
  }, [movies, activeFilter, sortKey]);

  if (!introDone) {
    return (
      <div className="container-fluid px-0">
        <HeroSection
          showSearch={false}
          glowSweep
          ctaLabel="Start Adventure"
          onCta={completeIntro}
        />
      </div>
    );
  }

  return (
    <>
      <div className="container-fluid px-0 reveal delay-1">
        <HeroSection
          showSearch
          greetingText="Which movie shall we watch today?"
          greetingDurationMs={2500}
        />
      </div>

      <Row className="g-3">
        <Col xs={12} lg={3} className="reveal delay-2">
          <SidebarShowtimes />
        </Col>

        <Col xs={12} lg={9} className="reveal delay-3">
          <Card className="mb-3 reveal delay-4">
            <Card.Header>Filters &amp; tags</Card.Header>
            <Card.Body>
              <FiltersBar onChange={handleFilterChange} />
            </Card.Body>
          </Card>

          {/* Otsikko + Sort-by (vain Discover-tilassa) */}
          <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
            <h5 className="mb-0">
              {activeFilter ? `${activeFilter.label} picks` : "Trending Movies"}
            </h5>

            {activeFilter && (
              <div className="d-flex flex-wrap align-items-center gap-2 ms-auto">
                <span className="small text-muted">Sort by:</span>
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    className={`btn btn-outline-primary ${sortKey === "year" ? "active" : ""}`}
                    onClick={() => setSortKey("year")}
                    title="Newest first"
                  >
                    Year ↓
                  </button>
                  <button
                    className={`btn btn-outline-primary ${sortKey === "rating" ? "active" : ""}`}
                    onClick={() => setSortKey("rating")}
                    title="Highest rated first"
                  >
                    Rating ↓
                  </button>
                  <button
                    className={`btn btn-outline-primary ${sortKey === "alpha" ? "active" : ""}`}
                    onClick={() => setSortKey("alpha")}
                    title="Alphabetical A–Z"
                  >
                    Title A–Z
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="reveal delay-6">
            {loading && <div>Ladataan…</div>}
            {error && <div className="text-danger">{error}</div>}
            {!loading && !error && (
              <>
                <MovieGrid movies={sorted} onSelect={(m) => setSelected(m)} />

                {/* Sivutus (vain discover) */}
                {activeFilter && totalPages > 1 && (
                    <div className="pager-pink d-flex align-items-center justify-content-center gap-2 my-4 flex-wrap">  
                    <button
                      className="btn btn-primary"
                      disabled={page === 1}
                      onClick={() => setPage(1)}
                      title="First page"
                      aria-label="First page"
                    >
                      «
                    </button>

                    <button
                      className="btn btn-primary"
                      disabled={page <= 5}
                      onClick={() => setPage((p) => Math.max(1, p - 5))}
                      title="-5 pages"
                      aria-label="Minus five pages"
                    >
                      −5
                    </button>

                    <button
                      className="btn btn-primary"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      title="Previous"
                      aria-label="Previous page"
                    >
                      ‹
                    </button>

                    <span className="mx-3 small">Page {page} / {totalPages}</span>

                    <button
                      className="btn btn-primary"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      title="Next"
                      aria-label="Next page"
                    >
                      ›
                    </button>

                    <button
                      className="btn btn-primary"
                      disabled={page > totalPages - 5}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 5))}
                      title="+5 pages"
                      aria-label="Plus five pages"
                    >
                      +5
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </Col>
      </Row>

      <DetailModal show={!!selected} item={selected} onHide={() => setSelected(null)} />
    </>
  );
}
