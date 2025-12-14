import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

export default function ProtectedRoute({ children, requiredRoles }) {
  const { accessToken, user } = useAuth();
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const roles = user?.roles || [];
    const allowed = roles.some((r) => requiredRoles.includes(r));
    if (!allowed) {
      return <Navigate to="/unauthorized" replace state={{ from: location }} />;
    }
  }

  return children;
}

