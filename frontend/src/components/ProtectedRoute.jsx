import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, isAuthLoading, user } = useAuth();
  const location = useLocation();

  if (isAuthLoading || (isAuthenticated && !user)) {
    return <div className="auth-status-page">Checking your session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && user?.role !== role) {
    return <Navigate to={user?.role === "admin" ? "/admin-dashboard" : "/menu"} replace />;
  }

  return children;
}
