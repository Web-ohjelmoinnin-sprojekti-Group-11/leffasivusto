// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { Row, Col, Card } from "react-bootstrap";
import SidebarShowtimes from "../components/layout/SidebarShowtimes.jsx";
import FiltersBar from "../components/layout/FiltersBar.jsx";
import MovieGrid from "../components/movies/MovieGrid.jsx";
import HeroSection from "../components/layout/HeroSection.jsx";
import { useIntro } from "../state/IntroContext.jsx";
import { fetchTrending } from "../controllers/movieController";
import { fetchDiscover } from "../controllers/movieController";
import DetailModal from "../components/movies/DetailModal";

export default function Home() {
  const { introDone, completeIntro } = useIntro();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  // Filtteri + sivutus
  const [activeFilter, setActiveFilter] = useState(null);        // { key, label, params }
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Haku: jos ei filtteriä -> trending, muuten -> discover
  useEffect(() => {
    if (!introDone) return;

    let cancel = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        if (activeFilter) {
          const { results, page: cur, totalPages: tp } =
            await fetchDiscover({ ...(activeFilter.params || {}), page });
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
          setError("Elokuvien haku epäonnistui.");
          console.error(e);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    run();
    return () => { cancel = true; };
  }, [introDone, activeFilter, page]);

  // Kun filtteri vaihtuu, palataan sivulle 1
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setPage(1);
  };

  const gotoPrev = () => setPage((p) => Math.max(1, p - 1));
  const gotoNext = () => setPage((p) => Math.min(totalPages, p + 1));

  if (!introDone) {
    return (
      <div className="container-fluid px-0">
        <HeroSection showSearch={false} glowSweep ctaLabel="Start Adventure" onCta={completeIntro} />
      </div>
    );
  }

  return (
    <>
      <div className="container-fluid px-0 reveal delay-1">
        <HeroSection showSearch greetingText="Which movie shall we watch today?" greetingDurationMs={2500} />
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

          <h5 className="mb-3 reveal delay-5">
            {activeFilter ? `${activeFilter.label} picks` : "Trending Movies"}
          </h5>

          <div className="reveal delay-6">
            {loading && <div>Ladataan…</div>}
            {error && <div className="text-danger">{error}</div>}
            {!loading && !error && (
              <>
                <MovieGrid movies={movies} onSelect={(m) => setSelected(m)} />

                {/* Sivutus: näkyy vain kun on filtteri käytössä ja sivuja > 1 */}
                {activeFilter && totalPages > 1 && (
                  <div className="d-flex align-items-center justify-content-center gap-4 my-4">
                    <button
                      className="btn btn-primary rounded-3 px-3"
                      disabled={page <= 1}
                      onClick={gotoPrev}
                      title="Previous page"
                    >
                      ◀
                    </button>
                    <span className="fs-5">Page {page} / {totalPages}</span>
                    <button
                      className="btn btn-primary rounded-3 px-3"
                      disabled={page >= totalPages}
                      onClick={gotoNext}
                      title="Next page"
                    >
                      ▶
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
