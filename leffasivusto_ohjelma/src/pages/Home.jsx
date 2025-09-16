// src/pages/Home.jsx
import React from "react";
import { Row, Col, Card } from "react-bootstrap";
import SidebarShowtimes from "../components/layout/SidebarShowtimes.jsx";
import FiltersBar from "../components/layout/FiltersBar.jsx";
import MovieGrid from "../components/movies/MovieGrid.jsx";
import HeroSection from "../components/layout/HeroSection.jsx";
import { useIntro } from "../state/IntroContext.jsx";
import { useTrendingMovies } from "../hooks/useMovies";

export default function Home() {
  const { introDone, completeIntro } = useIntro();
  const { movies, loading, error } = useTrendingMovies(introDone);

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
            <Card.Body><FiltersBar /></Card.Body>
          </Card>

          <h5 className="mb-3 reveal delay-5">Trending Movies</h5>
          <div className="reveal delay-6">
            {loading && <div>Ladataan…</div>}
            {error && <div className="text-danger">{error}</div>}
            {!loading && !error && <MovieGrid movies={movies} />}
          </div>
        </Col>
      </Row>
    </>
  );
}
