import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import PayrollPage from "./pages/PayrollPage";
import ProtectedRoute from "./components/ProtectedRoute";
import DepartmentPage from "./pages/DepartmentPage";

//  STAFF
import StaffProfilePage from "./pages/StaffProfilePage";
import StaffDepartNhanVien from "./pages/StaffDepartNhanVien";
import StaffEmployNhanvien from "./pages/StaffEmployNhanvien";

//  Gate: staff vào /departments sẽ bị chuyển sang staff view
function DepartmentGate() {
  const { role } = useAuth();
  if (role !== "admin") {
    return <Navigate to="/staff/departments" replace />;
  }
  return <DepartmentPage />;
}

function AppShell() {
  return (
    <main>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/*  STAFF PROFILE */}
        <Route
          path="/staff/profile"
          element={
            <ProtectedRoute>
              <StaffProfilePage />
            </ProtectedRoute>
          }
        />

        {/*  STAFF VIEW: phòng ban dạng card */}
        <Route
          path="/staff/view"
          element={
            <ProtectedRoute>
              <StaffDepartNhanVien />
            </ProtectedRoute>
          }
        />

        {/*  FIX: /staff/employees chạy trang staff nhân viên (giống admin nhưng chỉ Xem) */}
        <Route
          path="/staff/employees"
          element={
            <ProtectedRoute>
              <StaffEmployNhanvien />
            </ProtectedRoute>
          }
        />

        {/*  giữ alias phòng ban */}
        <Route
          path="/staff/departments"
          element={
            <ProtectedRoute>
              <Navigate to="/staff/view?tab=departments" replace />
            </ProtectedRoute>
          }
        />

        {/*  /departments: admin giữ nguyên UI, staff bị chuyển hướng */}
        <Route
          path="/departments"
          element={
            <ProtectedRoute>
              <DepartmentGate />
            </ProtectedRoute>
          }
        />

        {/*  ADMIN giữ nguyên */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payroll"
          element={
            <ProtectedRoute role="admin">
              <PayrollPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </main>
  );
}

function App() {
  const [apiBase] = useState(
    import.meta.env.VITE_API_BASE || "http://localhost:4000"
  );
  return (
    <AuthProvider apiBase={apiBase}>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
