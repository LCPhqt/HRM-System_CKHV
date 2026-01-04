import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import PayrollPage from "./pages/PayrollPage";
import CRMPage from "./pages/CRMPage";
import ProtectedRoute from "./components/ProtectedRoute";
import DepartmentPage from "./pages/DepartmentPage";

//  STAFF
import StaffProfilePage from "./pages/StaffProfilePage";
import StaffDepartNhanVien from "./pages/StaffDepartNhanVien";
import StaffEmployNhanvien from "./pages/StaffEmployNhanvien";
import StaffCustomersPage from "./pages/StaffCustomersPage";
import CustomerHistoryPage from "./pages/CustomerHistoryPage";

function DepartmentGate() {
  const { role } = useAuth();
  if (role !== "admin") return <Navigate to="/staff/departments" replace />;
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

        {/*  Alias để không rớt login nếu còn link cũ */}
        <Route
          path="/staff/view"
          element={
            <ProtectedRoute>
              <Navigate to="/staff/departments" replace />
            </ProtectedRoute>
          }
        />

        {/*  STAFF */}
        <Route
          path="/staff/profile"
          element={
            <ProtectedRoute>
              <StaffProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff/departments"
          element={
            <ProtectedRoute>
              <StaffDepartNhanVien />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff/employees"
          element={
            <ProtectedRoute>
              <StaffEmployNhanvien />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff/customers"
          element={
            <ProtectedRoute>
              <StaffCustomersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/customers/history"
          element={
            <ProtectedRoute>
              <CustomerHistoryPage />
            </ProtectedRoute>
          }
        />

        {/*  admin departments */}
        <Route
          path="/departments"
          element={
            <ProtectedRoute>
              <DepartmentGate />
            </ProtectedRoute>
          }
        />

        {/*  ADMIN */}
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

        <Route
          path="/crm"
          element={
            <ProtectedRoute role="admin">
              <CRMPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/crm/history"
          element={
            <ProtectedRoute role="admin">
              <CustomerHistoryPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </main>
  );
}

function App() {
  const [apiBase] = useState(import.meta.env.VITE_API_BASE || "http://localhost:4000");
  return (
    <AuthProvider apiBase={apiBase}>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
