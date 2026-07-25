import {Routes , Route , Navigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import {Roles, Role_Home} from '../constants/role.ts';
import LoginPage from '../Pages/LoginPage';
import ProtectedRoute from '../components/ProtectedRoute';
import DashboardPage from '../Pages/admin/dashboardPage.tsx';
import AdminMessagesPage from '../app/pages/admin/MessagesPage';
import ExportPage from '../app/pages/admin/ExportPage';
import PerformancePage from '../app/pages/admin/PerformancePage';
import QualityComparisonPage from '../app/pages/admin/QualityComparisonPage';
import FollowupsPage from '../app/pages/admin/FollowupsPage';
import RealTimePage from '../app/pages/admin/RealTimePage';
import SettingsPage from '../app/pages/admin/SettingsPage';
import InjectionPage from '../Pages/admin/injectionPage.tsx';
import PointagePage from '../Pages/admin/pointagePage.tsx';
import PermissionPage from '../Pages/admin/PermissionPage.tsx';
import ClientsPage from '../Pages/admin/ClientsPage.tsx';
import type { RoleId } from '../constants/role';
export default function AppRoutes() {
    const { isAuthenticated, user } = useAuth();
    return (
         <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute allowedRoles={[Roles.SuperAdmin, Roles.Admin]} />}>
        <Route path="/admin/dashboard" element={<DashboardPage />} />
        <Route path="/admin/injection" element={<InjectionPage />} />
        <Route path="/admin/leads" element={<InjectionPage />} />
        <Route path="/admin/pointage" element={<PointagePage />} />
        <Route path="/admin/permissions" element={<PermissionPage />} />
        <Route path="/admin/clients" element={<ClientsPage />} />
        <Route path="/admin/messages" element={<AdminMessagesPage />} />
        <Route path="/admin/export" element={<ExportPage />} />
        <Route path="/admin/performance" element={<PerformancePage />} />
        <Route path="/admin/quality-comparison" element={<QualityComparisonPage />} />
        <Route path="/admin/followups" element={<FollowupsPage />} />
        <Route path="/admin/realtime" element={<RealTimePage />} />
        <Route path="/admin/settings" element={<SettingsPage />} />
      </Route>

      <Route
        path="*"
        element={
          isAuthenticated() && user
            ? <Navigate to={Role_Home[user.roleId as RoleId] ?? '/login'} replace />
            : <Navigate to="/login" replace />
        }
      />
    </Routes>
    );
}
