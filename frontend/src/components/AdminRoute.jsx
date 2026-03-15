import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminRoute({ children }) {
  const { isAuthenticated, isAuthLoading, user } = useAuth();
  const location = useLocation();

  if (isAuthLoading || (isAuthenticated && !user)) {
    return <div className="auth-status-page">Checking admin access...</div>;
  }

  if (!isAuthenticated) return <Navigate to="/admin-login" replace state={{ from: location }} />;
  if (user?.role !== "admin") return <Navigate to="/menu" replace />;

  return children;
}
