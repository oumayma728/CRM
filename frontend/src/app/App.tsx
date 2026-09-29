import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth, homePathFor } from './contexts/AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import { PermissionProvider, usePermissions } from './contexts/PermissionContext';
import { Layout } from './components/Layout';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import FirstLoginPage from './pages/FirstLoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import CreateContactPage from './pages/CreateContactPage';
import { Toaster } from 'react-hot-toast';

// Agent
import AgentDashboard from './pages/agent/AgentDashboard';

import ContactPage from './pages/agent/ContactPage';
import PerformancePage from './pages/agent/PerformancePage';
import AgendaPage from './pages/agent/AgendaPage';
import ContactsListPage from './pages/agent/ContactsListPage';
import AgentMessagesPage from './pages/agent/MessagesPage';
import CallLogPage from './pages/agent/CallLogPage';
import DialerPage from './pages/agent/DialerPage';
import HistoryPage from './pages/agent/HistoryPage';
import MonPointagePage from './pages/agent/MonPointagePage';
import MesRdvPage from './pages/agent/MesRdvPage';
import PerformanceCrmPage from './pages/agent/PerformanceCrmPage';

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
import PointageRapportPage from './pages/admin/PointageRapportPage';
import AdminPointageHistoriquePage from './pages/admin/AdminPointageHistoriquePage';
import AIDashboardPage from './pages/admin/AIDashboardPage';
import ConfirmatricesAgendasPage from './pages/admin/ConfirmatricesAgendasPage';
import InjectionPage from './pages/admin/InjectionPage';
import FichiersEnAttentePage from './pages/admin/FichiersEnAttentePage';
import PermissionPage from './pages/admin/PermissionPage';
import ClientsPage from './pages/admin/ClientsPage';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';

// Shared (all roles)
import MonHistoriquePointagePage from './pages/shared/MonHistoriquePointagePage';
import ConfContactsListPage from './pages/shared/ConfContactsListPage';
import TeamChatPage from './pages/shared/TeamChatPage';

// Confirmatrices
import Confirmation1Dashboard from './pages/confirmation/Confirmation1Dashboard';
import AgendaEBI from './pages/confirmation/confirmation1/AgendaEBI';
import AgendaClient1 from './pages/confirmation/confirmation1/AgendaClient1';
import AgendaClient2 from './pages/confirmation/confirmation1/AgendaClient2';
import AgendaRefus from './pages/confirmation/confirmation1/AgendaRefus';
import EvaluationAgents from './pages/confirmation/confirmation1/EvaluationAgents';
import StatistiquesGlobales from './pages/confirmation/confirmation1/StatistiquesGlobales';
import FichiersContacts from './pages/confirmation/confirmation1/FichiersContacts';
import Confirmation2Dashboard from './pages/confirmation/Confirmation2Dashboard';
import AgendaEBI2 from './pages/confirmation/confirmation2/AgendaEBI2';
import AgendaClient1Conf2 from './pages/confirmation/confirmation2/Agendaclient1';
import EvaluationAgents2 from './pages/confirmation/confirmation2/EvaluationAgents2';
import StatistiquesGlobales2 from './pages/confirmation/confirmation2/StatistiquesGlobales2';
import FichiersContacts2 from './pages/confirmation/confirmation2/FichiersContacts2';
import ConfirmationClientDashboard from './pages/confirmation/ConfirmationClientDashboard';
import AgendaClient from './pages/confirmation/confirmation-client/AgendaClient';
import AgendaClientDeux from './pages/confirmation/confirmation-client/AgendaClient2';
import AgendaRefusClient from './pages/confirmation/confirmation-client/AgendaRefusClient';
import AgendaEBIClient from './pages/confirmation/confirmation-client/AgendaEBIClient';
import SuiviCommerciaux from './pages/confirmation/confirmation-client/SuiviCommerciaux';
import AttributionRDV from './pages/confirmation/confirmation-client/AttributionRDV';
import CommentaireBanque from './pages/confirmation/confirmation-client/CommentaireBanque';

// Commercial
import CommercialDashboard from './pages/commercial/CommercialDashboard';
import CommercialAgenda from './pages/commercial/CommercialAgenda';

// Service technique
import TechniqueDashboard from './pages/technique/TechniqueDashboard';
import ListeAgents from './pages/technique/ListeAgents';
import FichierContacts from './pages/technique/FichierContacts';
import PointageTech from './pages/technique/Pointage';
import GererAcces from './pages/technique/GererAcces';
import CompteCalendrier from './pages/technique/CompteCalendrier';
import EvaluationTech from './pages/technique/EvaluationTech';


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
import RdvCalendarPage from './pages/quality/RdvCalendarPage';
import AgendaRefusEquipe from './pages/quality/AgendaRefusEquipe';
import StatsAppelsPage from './pages/quality/StatsAppelsPage';
import QualityAnalyticsPage from './pages/quality/QualityAnalyticsPage';
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to={homePathFor(user)} />;
  return <>{children}</>;
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSuperAdmin, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isSuperAdmin) return <Navigate to={homePathFor(user)} />;
  return <>{children}</>;
}

/** Allows the listed roles (plus admin / superadmin, who can open every service's pages). */
function RoleRoute({ roles, confType, children }: { roles: string[]; confType?: string; children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  const allowed = isAdmin || (roles.includes(user?.role ?? '') &&
    (!confType || user?.role !== 'confirmatrice' || (user?.typeConfirmatrice ?? 'CONF1') === confType));
  if (!allowed) return <Navigate to={homePathFor(user)} />;
  return <>{children}</>;
}

function ManagementRoute({ children }: { children: React.ReactNode }) {
  return <RoleRoute roles={['qualite']}>{children}</RoleRoute>;
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
      <Route path="/first-login" element={<FirstLoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />

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
        <Route path="/agent/call-log" element={<CallLogPage />} />
        <Route path="/agent/dialer" element={<DialerPage />} />
        <Route path="/agent/history" element={<HistoryPage />} />
        <Route path="/agent/pointage" element={<MonPointagePage />} />
        <Route path="/agent/mes-rdv" element={<MesRdvPage />} />
        <Route path="/agent/performance-crm" element={<PerformanceCrmPage />} />

        {/* Shared (every role) */}
        <Route path="/chat" element={<TeamChatPage />} />
        <Route path="/create-contact" element={<CreateContactPage />} />

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
      <Route path="/admin/pointage/rapport" element={<PointageRapportPage />} />
      <Route path="/admin/pointage-historique" element={<AdminPointageHistoriquePage />} />
      <Route path="/admin/mon-historique-pointage" element={<MonHistoriquePointagePage />} />
      <Route path="/admin/ai-dashboard" element={<AIDashboardPage />} />
      <Route path="/admin/confirmatrices-agendas" element={<ConfirmatricesAgendasPage />} />
      <Route path="/admin/injection" element={<InjectionPage />} />
      <Route path="/admin/fichiers-en-attente" element={<FichiersEnAttentePage />} />
      <Route path="/admin/permissions" element={<PermissionPage />} />
      <Route path="/admin/clients" element={<ClientsPage />} />

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
        <Route path="/qualite/calendrier" element={<RdvCalendarPage />} />
        <Route path="/qualite/agenda-refus" element={<AgendaRefusEquipe />} />
        <Route path="/qualite/stats-appels" element={<StatsAppelsPage />} />
        <Route path="/qualite/analytics-qualite" element={<QualityAnalyticsPage />} />
        <Route path="/qualite/mon-historique-pointage" element={<MonHistoriquePointagePage />} />
      </Route>

      {/* 👑 SUPER ADMIN */}
      <Route element={<SuperAdminRoute><Layout /></SuperAdminRoute>}>
        <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
      </Route>

      {/* 📞 CONFIRMATRICE 1 */}
      <Route path="/confirmation1" element={<RoleRoute roles={['confirmatrice']} confType="CONF1"><Layout /></RoleRoute>}>
        <Route path="dashboard" element={<Confirmation1Dashboard />} />
        <Route path="agenda-ebi" element={<AgendaEBI />} />
        <Route path="agenda-client1" element={<AgendaClient1 />} />
        <Route path="agenda-client2" element={<AgendaClient2 />} />
        <Route path="agenda-refus" element={<AgendaRefus />} />
        <Route path="evaluation" element={<EvaluationAgents />} />
        <Route path="statistiques" element={<StatistiquesGlobales />} />
        <Route path="fichiers" element={<FichiersContacts />} />
        <Route path="contacts" element={<ConfContactsListPage />} />
        <Route path="mon-historique-pointage" element={<MonHistoriquePointagePage />} />
      </Route>

      {/* 📞 CONFIRMATRICE 2 */}
      <Route path="/confirmation2" element={<RoleRoute roles={['confirmatrice']} confType="CONF2"><Layout /></RoleRoute>}>
        <Route path="dashboard" element={<Confirmation2Dashboard />} />
        <Route path="agenda-ebi" element={<AgendaEBI2 />} />
        <Route path="agenda-client1" element={<AgendaClient1Conf2 />} />
        <Route path="evaluation" element={<EvaluationAgents2 />} />
        <Route path="statistiques" element={<StatistiquesGlobales2 />} />
        <Route path="fichiers" element={<FichiersContacts2 />} />
        <Route path="contacts" element={<ConfContactsListPage />} />
        <Route path="mon-historique-pointage" element={<MonHistoriquePointagePage />} />
      </Route>

      {/* 📞 CONFIRMATRICE CLIENT */}
      <Route path="/confirmation-client" element={<RoleRoute roles={['confirmatrice']} confType="CONFCLIENT"><Layout /></RoleRoute>}>
        <Route path="dashboard" element={<ConfirmationClientDashboard />} />
        <Route path="agenda" element={<AgendaClient />} />
        <Route path="agenda-client2" element={<AgendaClientDeux />} />
        <Route path="agenda-refus" element={<AgendaRefusClient />} />
        <Route path="agenda-ebi" element={<AgendaEBIClient />} />
        <Route path="commerciaux" element={<SuiviCommerciaux />} />
        <Route path="attribution" element={<AttributionRDV />} />
        <Route path="banque" element={<CommentaireBanque />} />
        <Route path="contacts" element={<ConfContactsListPage />} />
        <Route path="mon-historique-pointage" element={<MonHistoriquePointagePage />} />
      </Route>

      {/* 💼 COMMERCIAL */}
      <Route path="/commercial" element={<RoleRoute roles={['commercial']}><Layout /></RoleRoute>}>
        <Route path="dashboard" element={<CommercialDashboard />} />
        <Route path="agenda" element={<CommercialAgenda />} />
        <Route path="mon-historique-pointage" element={<MonHistoriquePointagePage />} />
      </Route>

      {/* 🛠️ SERVICE TECHNIQUE */}
      <Route path="/technique" element={<RoleRoute roles={['tech']}><Layout /></RoleRoute>}>
        <Route index element={<TechniqueDashboard />} />
        <Route path="dashboard" element={<TechniqueDashboard />} />
        <Route path="agents" element={<ListeAgents />} />
        <Route path="fichiers" element={<FichierContacts />} />
        <Route path="pointage" element={<PointageTech />} />
        <Route path="monpointage" element={<MonHistoriquePointagePage />} />
        <Route path="acces" element={<GererAcces />} />
        <Route path="calendrier" element={<CompteCalendrier />} />
        <Route path="evaluation" element={<EvaluationTech />} />
      </Route>

      {/* Redirect */}
      <Route path="/" element={<Navigate to={homePathFor(user)} />} />
      <Route path="*" element={<Navigate to={user ? homePathFor(user) : '/login'} />} />

    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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