import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home.jsx";
import Movies from "../pages/Movies.jsx";
import NotFound from "../pages/NotFound.jsx";
import Profile from "../pages/Profile.jsx";
import RequireAuth from "./RequireAuth.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/movies" element={<Movies />} />

      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        }
      />

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

