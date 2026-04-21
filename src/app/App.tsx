import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import LeadsPage from './pages/admin/leads/LeadsPage';
import AgentDashboard from './pages/agent/AgentDashboard';
import ContactPage from './pages/agent/ContactPage';
import HistoryPage from './pages/agent/HistoryPage';
import PerformancePage from './pages/agent/PerformancePage';
import AgendaPage from './pages/agent/AgendaPage';
import ContactsListPage from './pages/agent/ContactsListPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import ScorecardsPage from './pages/admin/ScorecardsPage';
import PointagePage from './pages/admin/PointagePage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import MapPage from './pages/admin/MapPage';
import PipelinePage from './pages/admin/PipelinePage';
import UsersPage from './pages/admin/UsersPage';
import AIConfigPage from './pages/admin/AIConfigPage';
import IntegrationsPage from './pages/admin/IntegrationsPage';
import AgentStatsPage from './pages/admin/AgentStatsPage';
import GDPRPage from './pages/admin/GDPRPage';
import ReportsPage from './pages/admin/ReportsPage';
import ImportLeadsPage from './pages/admin/ImportLeadsPage';
import FichierAcharge from './pages/admin/leads/LeadsPage';
//import ImportFile from './pages/admin/importfile';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/agent/dashboard" element={<ProtectedRoute><AgentDashboard /></ProtectedRoute>} />
      <Route path="/agent/contact" element={<ProtectedRoute><ContactPage /></ProtectedRoute>} />
      <Route path="/agent/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
      <Route path="/agent/performance" element={<ProtectedRoute><PerformancePage /></ProtectedRoute>} />
      <Route path="/agent/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
      <Route path="/agent/contacts" element={<ProtectedRoute><ContactsListPage /></ProtectedRoute>} />

      <Route path="/admin/import-leads/FichierAcharge" element={<ProtectedRoute><FichierAcharge /></ProtectedRoute>} />
      <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/scorecards" element={<ProtectedRoute><ScorecardsPage /></ProtectedRoute>} />
      <Route path="/admin/pointage" element={<ProtectedRoute><PointagePage /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/admin/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
      <Route path="/admin/pipeline" element={<ProtectedRoute><PipelinePage /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
      <Route path="/admin/ai-config" element={<ProtectedRoute><AIConfigPage /></ProtectedRoute>} />
      <Route path="/admin/integrations" element={<ProtectedRoute><IntegrationsPage /></ProtectedRoute>} />
      <Route path="/admin/agent-stats" element={<ProtectedRoute><AgentStatsPage /></ProtectedRoute>} />
      <Route path="/admin/gdpr" element={<ProtectedRoute><GDPRPage /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/admin/import-leads" element={<ProtectedRoute><ImportLeadsPage /></ProtectedRoute>} />
      <Route path="/admin/leads" element={<ProtectedRoute><LeadsPage /></ProtectedRoute>} />
      <Route path="/" element={
        user?.role === 'admin' ? <Navigate to="/admin/dashboard" /> : <Navigate to="/agent/dashboard" />
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}