import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import PayrollPage from './pages/PayrollPage';
import ProtectedRoute from './components/ProtectedRoute';

// ✅ CHỈ THÊM CHO STAFF
import StaffProfilePage from './pages/StaffProfilePage';
import DepartmentsPage from './pages/DepartmentsPage';

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

        {/* ✅ GIỮ NGUYÊN */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* ✅ THÊM STAFF PROFILE (có sidebar) */}
        <Route
          path="/staff/profile"
          element={
            <ProtectedRoute>
              <StaffProfilePage />
            </ProtectedRoute>
          }
        />

        {/* ✅ THÊM STAFF DEPARTMENTS (CHỈ STAFF ĐƯỢC VÀO) */}
        <Route
          path="/departments"
          element={
            <ProtectedRoute denyRole="admin">
              <DepartmentsPage />
            </ProtectedRoute>
          }
        />

        {/* ✅ GIỮ NGUYÊN ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* ✅ GIỮ NGUYÊN ADMIN */}
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
  const [apiBase] = useState(import.meta.env.VITE_API_BASE || 'http://localhost:4000');
  return (
    <AuthProvider apiBase={apiBase}>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
