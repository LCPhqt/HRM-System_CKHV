import { Route, Routes, Navigate } from "react-router-dom";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardEmployee from "./pages/DashboardEmployee";
import EmployeeSchedule from "./pages/EmployeeSchedule";
import NotFoundPage from "./pages/NotFound";
import UnauthorizedPage from "./pages/Unauthorized";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./providers/AuthProvider";

function HomeRedirect() {
  const { user } = useAuth();
  const roles = user?.roles || [];
  if (roles.includes("admin") || roles.includes("hr")) {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/employee" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRoles={["admin", "hr"]}>
            <DashboardAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee"
        element={
          <ProtectedRoute requiredRoles={["employee", "user", "staff", "admin", "hr"]}>
            <DashboardEmployee />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/schedule"
        element={
          <ProtectedRoute requiredRoles={["employee", "user", "staff", "admin", "hr"]}>
            <EmployeeSchedule />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeRedirect />
          </ProtectedRoute>
        }
      />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;

