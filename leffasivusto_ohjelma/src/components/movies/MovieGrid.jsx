import React from "react";
import MovieCard from "./MovieCard";

const MovieGrid = ({ movies = [], onSelect }) => (
  <div className="row g-3 movies-grid">
    {movies.map((m) => (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2" key={`${m.mediaType || m.type || "title"}-${m.id}`}>
        <div onClick={() => onSelect?.(m)} style={{ cursor: "pointer" }}>
          <MovieCard movie={m} />
        </div>
      </div>
    ))}
  </div>
);

export default MovieGrid;
