import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

/** Miksi: Estää pääsyn profiiliin ilman kirjautumista; säilyttää paluureitin. */
export default function RequireAuth({ children }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated && !user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  return children;
}
