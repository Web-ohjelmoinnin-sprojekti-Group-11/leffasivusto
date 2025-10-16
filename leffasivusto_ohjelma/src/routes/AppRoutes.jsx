import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home.jsx";
import Movies from "../pages/Movies.jsx";
import NotFound from "../pages/NotFound.jsx";
import Profile from "../pages/Profile.jsx";
import RequireAuth from "./RequireAuth.jsx";
import SharedFavorites from "../pages/SharedFavorites.jsx";

import CreateGroup from "../pages/Groups/CreateGroup.jsx";
import GroupList from "../pages/Groups/GroupList.jsx";
import GroupDetail from "../pages/Groups/GroupDetail.jsx";

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

      <Route
        path="/groups"
        element={
          <RequireAuth>
            <GroupList />
          </RequireAuth>
        }
      />
      <Route
        path="/groups/create"
        element={
          <RequireAuth>
            <CreateGroup />
          </RequireAuth>
        }
      />
      <Route
        path="/groups/:id"
        element={
          <RequireAuth>
            <GroupDetail />
          </RequireAuth>
        }
      />

      {/* Public shared favorites – kaksi reittiä:
         - /share/:token  (URL-safe tokenit)
         - /share/*       (tokenit joissa on esim. "/")
      */}
      <Route path="/share/:token" element={<SharedFavorites />} />
      <Route path="/share/*" element={<SharedFavorites />} />

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
