// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home.jsx";
import Movies from "../pages/Movies.jsx";
// … muut importit

export default function AppRoutes() {
  return (
    <Routes>
      {/* Pääreitti kotiin */}
      <Route path="/" element={<Home />} />
      {/* /home tukee suoria kirjanmerkkejä */}
      <Route path="/home" element={<Navigate to="/" replace />} />
      {/* Movies toimii edelleen */}
      <Route path="/movies" element={<Movies />} />
      {/* 404 fallback */}
      <Route path="*" element={<div className="text-center py-5">404 – Page not found</div>} />
    </Routes>
  );
}
