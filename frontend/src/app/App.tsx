import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import { PermissionProvider, usePermissions } from './contexts/PermissionContext';
import { Layout } from './components/Layout';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { Toaster } from 'react-hot-toast';

// Agent
import AgentDashboard from './pages/agent/AgentDashboard';

import ContactPage from './pages/agent/ContactPage';
import PerformancePage from './pages/agent/PerformancePage';
import AgendaPage from './pages/agent/AgendaPage';
import ContactsListPage from './pages/agent/ContactsListPage';
import AgentMessagesPage from './pages/agent/MessagesPage';

// Admin - Modernized Pages
import DashboardPage from './pages/admin/DashboardPage';
import ScoringPage from './pages/admin/ScoringPage';
import RealTimePage from './pages/admin/RealTimePage';
import LeadsPage from './pages/admin/LeadsPage';
import AgendaPageAdmin from './pages/admin/AgendaPage';
import SettingsPage from './pages/admin/SettingsPage';
import MapPage from './pages/admin/MapPage';
import AdminPerformancePage from './pages/admin/PerformancePage';
import AdminMessagesPage from './pages/admin/MessagesPage';

// Admin - Legacy
import ScorecardsPage from './pages/admin/ScorecardsPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import PipelinePage from './pages/admin/PipelinePage';
import UsersPage from './pages/admin/UsersPage';
import IntegrationsPage from './pages/admin/IntegrationsPage';
import AgentStatsPage from './pages/admin/AgentStatsPage';
import AgentsPage from './pages/admin/AgentsPage';
import GDPRPage from './pages/admin/GDPRPage';
import ReportsPage from './pages/admin/ReportsPage';
import ImportLeadsPage from './pages/admin/ImportLeadsPage';
import FollowupsPage from './pages/admin/FollowupsPage';
import PlanningPage from './pages/admin/PlanningPage';
import ImportFile from './pages/admin/importfile';
import FichierAcharge from './pages/admin/FichierAcharge';
import AlertsPage from './pages/admin/AlertsPage';
import SalaryPage from './pages/admin/SalaryPage';
import PointagePage from './pages/admin/PointagePage';


// AI
import AnalysisPage from './pages/AnalysisPage';
import ChatbotPage from './pages/ChatbotPage';

// Call Workspace
import CallWorkspace from './pages/admin/CallWorkspace';

// Quality
import QualityDashboard from './pages/quality/QualityDashboard';
import AgentQualityDetail from './pages/quality/AgentQualityDetail';
import QualityComparison from './pages/quality/QualityComparison';
import QualityPerformance from './pages/quality/QualityPerformance';
import ManualEvaluationPage from './pages/quality/ManualEvaluationPage';
import AgentTrendPage from './pages/quality/AgentTrendPage';
import QualityCalendarPage from './pages/quality/QualityCalendarPage';
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/agent/dashboard" />;
  return <>{children}</>;
}

function QualiteRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== 'qualite' && user?.role !== 'admin') return <Navigate to="/agent/dashboard" />;
  return <>{children}</>;
}

function ManagementRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== 'admin' && user?.role !== 'qualite') return <Navigate to="/agent/dashboard" />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">

          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Initialisation CRM...</p>
        </div>
      </div>
    );
  }

  return (

    <Routes>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* 🔥 GLOBAL LAYOUT */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>

        {/* Agent */}
        <Route path="/agent/dashboard" element={<AgentDashboard />} />
        <Route path="/agent/contact" element={<ContactPage />} />
        <Route path="/agent/performance" element={<PerformancePage />} />
        <Route path="/agent/agenda" element={<AgendaPage />} />
      <Route path="/agent/contacts" element={<ContactsListPage />} />
      <Route path="/agent/messages" element={<AgentMessagesPage />} />
      <Route path="/agent/audio-analysis" element={<AnalysisPage />} />

      {/* AI */}
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />

      </Route>

{/* 🔐 ADMIN (with Layout too) */}
<Route element={<AdminRoute><Layout /></AdminRoute>}>

<Route path="/admin/dashboard" element={<DashboardPage />} />
      <Route path="/admin/realtime" element={<RealTimePage />} />
      <Route path="/admin/pointage" element={<PointagePage />} />
<Route path="/admin/performance" element={<AdminPerformancePage />} />
<Route path="/admin/map" element={<MapPage />} />
<Route path="/admin/leads" element={<LeadsPage />} />
<Route path="/admin/agenda" element={<AgendaPageAdmin />} />
<Route path="/admin/scoring" element={<ScoringPage />} />
<Route path="/admin/analysis" element={<AnalysisPage />} />
<Route path="/admin/ai-config" element={<SettingsPage />} />
<Route path="/admin/messages" element={<AdminMessagesPage />} />
<Route path="/admin/settings" element={<SettingsPage />} />
<Route path="/admin/scorecards" element={<ScorecardsPage />} />
<Route path="/admin/analytics" element={<AnalyticsPage />} />
<Route path="/admin/pipeline" element={<PipelinePage />} />
<Route path="/admin/users" element={<UsersPage />} />
<Route path="/admin/integrations" element={<IntegrationsPage />} />
      <Route path="/admin/agent-stats" element={<AgentStatsPage />} />
      <Route path="/admin/agents" element={<AgentsPage />} />
<Route path="/admin/gdpr" element={<GDPRPage />} />
<Route path="/admin/reports" element={<ReportsPage />} />
<Route path="/admin/import-leads" element={<ImportLeadsPage />} />
<Route path="/admin/followups" element={<FollowupsPage />} />
<Route path="/admin/planning" element={<PlanningPage />} />
<Route path="/admin/import-leads/importfile" element={<ImportFile />} />
<Route path="/admin/import-leads/FichierAcharge" element={<FichierAcharge />} />
      <Route path="/admin/alerts" element={<AlertsPage />} />
      <Route path="/admin/salaries" element={<SalaryPage />} />
      <Route path="/admin/calls" element={<CallWorkspace />} />

    </Route>

      {/* 🛡️ QUALITY & MANAGEMENT SERVICE */}
      <Route element={<ManagementRoute><Layout /></ManagementRoute>}>
        <Route path="/qualite/dashboard" element={<QualityDashboard />} />
        <Route path="/qualite/agents" element={<AgentQualityDetail />} />
      <Route path="/qualite/compare" element={<QualityComparison />} />
      <Route path="/qualite/comparison" element={<QualityComparison />} />
      <Route path="/qualite/performance" element={<QualityPerformance />} />
        <Route path="/qualite/trends" element={<AgentTrendPage />} />
      <Route path="/qualite/evaluation" element={<ManualEvaluationPage />} />
      <Route path="/qualite/calendar" element={<QualityCalendarPage />} />
      <Route path="/qualite/chatbot" element={<ChatbotPage />} />
      <Route path="/qualite/analysis" element={<AnalysisPage />} />
        <Route path="/qualite/messages" element={<AdminMessagesPage />} />
        <Route path="/qualite/calls" element={<CallWorkspace />} />
      </Route>

      {/* Redirect */}
      <Route path="/" element={
  user?.role === 'admin'
? <Navigate to="/admin/realtime" />
: user?.role === 'qualite'
            ? <Navigate to="/qualite/dashboard" />
            : <Navigate to="/agent/dashboard" />
      } />

    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PermissionProvider>
          <AlertProvider>
            <ThemeProvider>
              <Toaster position="top-right" reverseOrder={false} />
              <AppRoutes />
            </ThemeProvider>
          </AlertProvider>
        </PermissionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}