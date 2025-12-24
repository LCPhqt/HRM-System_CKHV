import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, role: requiredRole, denyRole }) {
  const { token, role } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/home" replace />;
  }

  if (denyRole && role === denyRole) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

export default ProtectedRoute;
