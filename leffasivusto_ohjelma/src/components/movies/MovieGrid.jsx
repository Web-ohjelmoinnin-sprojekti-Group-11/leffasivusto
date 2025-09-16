// src/components/movies/MovieGrid.jsx
import React from "react";
import MovieCard from "./MovieCard";

const MovieGrid = ({ movies = [] }) => (
  <div className="row g-3">
    {movies.map((m) => (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2" key={m.id}>
        <MovieCard movie={m} />
      </div>
    ))}
  </div>
);

export default MovieGrid;
