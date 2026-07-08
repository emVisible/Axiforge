import { Navigate, Route, Routes } from "react-router";
import AdminLayout from "@/layout/AdminLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ReportsPage from "@/pages/ReportsPage";
import UsersPage from "@/pages/UsersPage";
import ContentPage from "@/pages/ContentPage";
import AuditPage from "@/pages/AuditPage";
import ViolationsPage from "@/pages/ViolationsPage";
import { getAdminToken } from "@/api/adminClient";

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!getAdminToken()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="content" element={<ContentPage />} />
        <Route path="violations" element={<ViolationsPage />} />
        <Route path="audit" element={<AuditPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
