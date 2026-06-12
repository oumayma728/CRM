import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { Layout } from './components/Layout';
import LoginPage from './pages/LoginPage';
import FirstLoginPage from './pages/FirstLoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import LeadsPage from './pages/admin/leads/LeadsPage';
import AgentDashboard from './pages/agent/AgentDashboard';
import ContactPage from './pages/agent/ContactPage';
import HistoryPage from './pages/agent/HistoryPage';
import PerformancePage from './pages/agent/PerformancePage';
import AgendaPage from './pages/agent/AgendaPage';
import ContactsListPage from './pages/agent/ContactsListPage';
import CreateContactPage from './pages/CreateContactPage';

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
import ConfirmatricesAgendasPage from './pages/admin/ConfirmatricesAgendasPage';
// ── NEW from colleague ──────────────────────────────────────
import InjectionPage from './pages/admin/InjectionPage';
import PermissionPage from './pages/admin/PermissionPage';
// ───────────────────────────────────────────────────────────

import Confirmation1Dashboard from './pages/confirmation/Confirmation1Dashboard copy';
import AgendaEBI from './pages/confirmation/confirmation1/AgendaEBI';
import AgendaClient1 from './pages/confirmation/confirmation1/AgendaClient1';
import AgendaClient2 from './pages/confirmation/confirmation1/AgendaClient2';
import AgendaRefus from './pages/confirmation/confirmation1/AgendaRefus';
import EvaluationAgents from './pages/confirmation/confirmation1/EvaluationAgents';
import StatistiquesGlobales from './pages/confirmation/confirmation1/StatistiquesGlobales';
import FichiersContacts from './pages/confirmation/confirmation1/FichiersContacts';

import Confirmation2Dashboard from './pages/confirmation/Confirmation2Dashboard';
import AgendaClient1_2 from './pages/confirmation/confirmation2/AgendaClient1';
import EvaluationAgents2 from './pages/confirmation/confirmation2/EvaluationAgents2';
import StatistiquesGlobales2 from './pages/confirmation/confirmation2/StatistiquesGlobales2';
import FichiersContacts2 from './pages/confirmation/confirmation2/FichiersContacts2';

import ConfirmationClientDashboard from './pages/confirmation/ConfirmationClientDashboard';
import AgendaClient from './pages/confirmation/confirmation-client/AgendaClient';
import SuiviCommerciaux from './pages/confirmation/confirmation-client/SuiviCommerciaux';
import AttributionRDV from './pages/confirmation/confirmation-client/AttributionRDV';
import CommentaireBanque from './pages/confirmation/confirmation-client/CommentaireBanque';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/first-login" element={<FirstLoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />

      {/* ==================== AGENT ==================== */}
      <Route path="/agent/dashboard" element={<ProtectedRoute><AgentDashboard /></ProtectedRoute>} />
      <Route path="/agent/contact" element={<ProtectedRoute><ContactPage /></ProtectedRoute>} />
      <Route path="/agent/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
      <Route path="/agent/performance" element={<ProtectedRoute><PerformancePage /></ProtectedRoute>} />
      <Route path="/agent/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
      <Route path="/agent/contacts" element={<ProtectedRoute><ContactsListPage /></ProtectedRoute>} />

      {/* ==================== CONFIRMATRICE 1 ==================== */}
      <Route path="/confirmation1" element={<Layout><Outlet /></Layout>}>
        <Route path="dashboard" element={<Confirmation1Dashboard />} />
        <Route path="agenda-ebi" element={<AgendaEBI />} />
        <Route path="agenda-client1" element={<AgendaClient1 />} />
        <Route path="agenda-client2" element={<AgendaClient2 />} />
        <Route path="agenda-refus" element={<AgendaRefus />} />
        <Route path="evaluation" element={<EvaluationAgents />} />
        <Route path="statistiques" element={<StatistiquesGlobales />} />
        <Route path="fichiers" element={<FichiersContacts />} />
      </Route>

      {/* ==================== CONFIRMATRICE 2 ==================== */}
      <Route path="/confirmation2" element={<Layout><Outlet /></Layout>}>
        <Route path="dashboard" element={<Confirmation2Dashboard />} />
        <Route path="agenda-client1" element={<AgendaClient1_2 />} />
        <Route path="evaluation" element={<EvaluationAgents2 />} />
        <Route path="statistiques" element={<StatistiquesGlobales2 />} />
        <Route path="fichiers" element={<FichiersContacts2 />} />
      </Route>

      {/* ==================== CONFIRMATRICE CLIENT ==================== */}
      <Route path="/confirmation-client" element={<Layout><Outlet /></Layout>}>
        <Route path="dashboard" element={<ConfirmationClientDashboard />} />
        <Route path="agenda" element={<AgendaClient />} />
        <Route path="commerciaux" element={<SuiviCommerciaux />} />
        <Route path="attribution" element={<AttributionRDV />} />
        <Route path="banque" element={<CommentaireBanque />} />
      </Route>

      {/* ==================== ADMIN ==================== */}
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
      <Route path="/admin/confirmatrices-agendas" element={<ProtectedRoute><ConfirmatricesAgendasPage /></ProtectedRoute>} />
      {/* ── New routes from colleague ─────────────────────── */}
      <Route path="/admin/injection" element={<ProtectedRoute><InjectionPage /></ProtectedRoute>} />
      <Route path="/admin/permissions" element={<ProtectedRoute><PermissionPage /></ProtectedRoute>} />
      {/* ─────────────────────────────────────────────────── */}
      <Route path="/create-contact" element={<ProtectedRoute><CreateContactPage /></ProtectedRoute>} />

      {/* ==================== REDIRECTION PAR DÉFAUT ==================== */}
      <Route path="/" element={
        !user ? <Navigate to="/login" /> :
        user.role === 'admin' ? <Navigate to="/admin/dashboard" /> :
        user.role === 'conf1' ? <Navigate to="/confirmation1/dashboard" /> :
        user.role === 'conf2' ? <Navigate to="/confirmation2/dashboard" /> :
        user.role === 'confclient' ? <Navigate to="/confirmation-client/dashboard" /> :
        user.role === 'agent' ? <Navigate to="/agent/dashboard" /> :
        <Navigate to="/login" />
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
