import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, role: requiredRole, denyRole }) {
  const { token, role } = useAuth();
  const location = useLocation();

  // ✅ Nếu chưa login -> về login
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // ✅ Nếu route yêu cầu role cụ thể
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/home" replace />;
  }

  // ✅ Nếu route cấm role nào đó (ví dụ denyRole="admin")
  if (denyRole && role === denyRole) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

export default ProtectedRoute;
