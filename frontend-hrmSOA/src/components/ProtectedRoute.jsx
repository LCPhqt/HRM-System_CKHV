import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ role: requiredRole, children }) {
  const { token, role, authReady } = useAuth();
  const location = useLocation();

  //  Nếu authReady không tồn tại => coi như đã sẵn sàng
  const ready = authReady === undefined ? true : authReady;

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Đang khởi tạo phiên đăng nhập...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
