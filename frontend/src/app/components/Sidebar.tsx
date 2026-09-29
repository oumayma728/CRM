import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Phone,
  PhoneCall,
  Calendar,
  CalendarDays,
  TrendingUp,
  MessageCircle,
  MessagesSquare,
  Sparkles,
  LogOut,
  Bell,
  Mic,
  Activity,
  Target,
  Mail,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Banknote,
  ClipboardCheck,
  Clock,
  History,
  Shield,
  Database,
  Upload,
  FileText,
  Map as MapIcon,
  Settings,
  Plug,
  Lock,
  Building2,
  Briefcase,
  CheckSquare,
  XCircle,
  Star,
  UserCheck,
  Brain,
  Inbox,
  GitBranch,
  RotateCcw,
  FileBarChart,
  Crown,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionContext';
import { API_BASE, getAuthHeaders } from '../services/api';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  accent?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  requiredPermission?: string;
  /** Confirmatrice agenda id: hidden unless assigned to the user (admin → agendas confirmatrices) */
  agendaId?: string;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Administrateur',
  qualite: 'Service Qualité',
  agent: 'Agent',
  commercial: 'Commercial',
  tech: 'Service Technique',
  CONF1: 'Confirmatrice 1',
  CONF2: 'Confirmatrice 2',
  CONFCLIENT: 'Confirmatrice Client',
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const [myAgendas, setMyAgendas] = useState<string[]>([]);

  useEffect(() => {
    if (user?.role !== 'confirmatrice') return;
    fetch(`${API_BASE}/confirmatrice/my-agendas`, { headers: getAuthHeaders() })
      .then(r => (r.ok ? r.json() : []))
      .then((list: string[]) => setMyAgendas(Array.isArray(list) ? list : []))
      .catch(() => setMyAgendas([]));
  }, [user]);

  const filterByPermission = (sections: NavSection[]): NavSection[] =>
    sections
      .map(section => ({
        ...section,
        items: section.items.filter(item =>
          (!item.requiredPermission || hasPermission(item.requiredPermission)) &&
          (!item.agendaId || myAgendas.length === 0 || myAgendas.includes(item.agendaId))
        ),
      }))
      .filter(section => section.items.length > 0);

  const accentColors: Record<string, string> = {
    blue: 'from-primary/15 to-primary/5 text-primary border-primary/25',
    green: 'from-success/15 to-success/5 text-success border-success/25',
    orange: 'from-warning/15 to-warning/5 text-warning border-warning/25',
    red: 'from-destructive/15 to-destructive/5 text-destructive border-destructive/25',
    purple: 'from-secondary/15 to-secondary/5 text-secondary border-secondary/25',
  };
  const normalizedRole = user?.role?.toLowerCase().replace(/[\s\_\-]/g, '');
  const confType = user?.typeConfirmatrice?.toUpperCase();

  const teamChat: NavItem = { icon: MessagesSquare, label: 'Chat Équipe', path: '/chat', accent: 'purple' };
  const chatbot: NavItem = { icon: Brain, label: 'Chatbot IA', path: '/chatbot', accent: 'blue' };
  const createContact: NavItem = { icon: FileText, label: 'Créer une fiche contact', path: '/create-contact' };

  const agentSections: NavSection[] = [
    {
      label: 'PRINCIPAL',
      items: [
        { icon: LayoutDashboard, label: 'Tableau de bord', path: '/agent/dashboard', accent: 'blue' },
        { icon: TrendingUp, label: 'Performance', path: '/agent/performance', accent: 'green' },
        { icon: BarChart3, label: 'Performance CRM', path: '/agent/performance-crm' },
        { icon: Clock, label: 'Mon Pointage', path: '/agent/pointage', accent: 'orange' },
      ],
    },
    {
      label: 'APPELS',
      items: [
        { icon: PhoneCall, label: 'Dialer campagne', path: '/agent/dialer', accent: 'green' },
        { icon: Phone, label: 'Appel en direct', path: '/agent/contact', accent: 'orange' },
        { icon: ClipboardCheck, label: "Journal d'appel IA", path: '/agent/call-log' },
        { icon: History, label: 'Historique', path: '/agent/history' },
      ],
    },
    {
      label: 'ACTIVITÉ',
      items: [
        { icon: Users, label: 'Contacts', path: '/agent/contacts' },
        { icon: Calendar, label: 'Agenda', path: '/agent/agenda' },
        { icon: CalendarDays, label: 'Mes RDV (pipeline)', path: '/agent/mes-rdv' },
        createContact,
      ],
    },
    {
      label: 'COMMUNICATION',
      items: [
        { icon: MessageCircle, label: 'Messages', path: '/agent/messages', accent: 'purple' },
        teamChat,
      ],
    },
    {
      label: 'IA',
      items: [
        { icon: Mic, label: 'Analyse Audio', path: '/agent/audio-analysis', accent: 'blue' },
        chatbot,
      ],
    },
  ];

  const adminSections: NavSection[] = [
    {
      label: 'PRINCIPAL',
      items: [
        { icon: Activity, label: 'Supervision Live', path: '/admin/realtime', accent: 'green' },
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard', accent: 'blue' },
        { icon: Clock, label: 'Pointage', path: '/admin/pointage', accent: 'orange' },
        { icon: FileBarChart, label: 'Rapport de pointage', path: '/admin/pointage/rapport' },
        { icon: History, label: 'Historique pointage', path: '/admin/pointage-historique' },
        { icon: Clock, label: 'Mon pointage', path: '/admin/mon-historique-pointage' },
      ],
    },
    {
      label: 'ÉQUIPES',
      items: [
        { icon: Users, label: 'Utilisateurs', path: '/admin/users', accent: 'blue' },
        { icon: UserCheck, label: 'Gestion des agents', path: '/admin/agents' },
        { icon: ClipboardCheck, label: 'Scorecards agents', path: '/admin/scorecards' },
        { icon: BarChart3, label: 'Stats agents', path: '/admin/agent-stats' },
        { icon: TrendingUp, label: 'Performance', path: '/admin/performance' },
        { icon: CalendarDays, label: 'Agendas confirmatrices', path: '/admin/confirmatrices-agendas' },
        { icon: Shield, label: 'Permissions', path: '/admin/permissions' },
      ],
    },
    {
      label: 'DONNÉES & LEADS',
      items: [
        { icon: Database, label: 'Gestion fichiers', path: '/admin/injection', accent: 'orange' },
        { icon: Inbox, label: 'Fichiers en attente', path: '/admin/fichiers-en-attente' },
        { icon: Upload, label: 'Import leads', path: '/admin/import-leads' },
        { icon: Target, label: 'Leads & CRM', path: '/admin/leads' },
        { icon: Building2, label: 'Clients', path: '/admin/clients' },
        { icon: GitBranch, label: 'Pipeline', path: '/admin/pipeline' },
        { icon: RotateCcw, label: 'Relances', path: '/admin/followups' },
        { icon: Calendar, label: 'Agenda', path: '/admin/agenda', accent: 'green' },
        { icon: CalendarDays, label: 'Planning', path: '/admin/planning' },
        createContact,
      ],
    },
    {
      label: 'ANALYTIQUE',
      items: [
        { icon: BarChart3, label: 'Analytique', path: '/admin/analytics', accent: 'blue' },
        { icon: MapIcon, label: 'Carte géographique', path: '/admin/map' },
        { icon: FileText, label: 'Rapports', path: '/admin/reports' },
      ],
    },
    {
      label: 'IA & QUALITÉ',
      items: [
        { icon: Sparkles, label: 'Scoring IA', path: '/admin/scoring', accent: 'orange' },
        { icon: Bell, label: 'Alertes', path: '/admin/alerts' },
        { icon: Brain, label: 'Dashboard IA', path: '/admin/ai-dashboard' },
        { icon: Settings, label: 'Configuration IA', path: '/admin/ai-config' },
        { icon: Mic, label: 'Analyse Audio', path: '/admin/analysis', accent: 'blue' },
        chatbot,
      ],
    },
    {
      label: 'FINANCE',
      items: [{ icon: Banknote, label: 'Salaires', path: '/admin/salaries', accent: 'purple' }],
    },
    {
      label: 'COMMUNICATION',
      items: [
        { icon: Phone, label: "Centre d'appels", path: '/admin/calls', accent: 'green' },
        { icon: Mail, label: 'Messages', path: '/admin/messages', accent: 'blue' },
        teamChat,
      ],
    },
    {
      label: 'PARAMÈTRES',
      items: [
        { icon: Plug, label: 'Intégrations', path: '/admin/integrations' },
        { icon: Lock, label: 'RGPD', path: '/admin/gdpr' },
      ],
    },
  ];

  const superAdminSections: NavSection[] = [
    {
      label: 'SUPER ADMIN',
      items: [{ icon: Crown, label: 'Dashboard Super Admin', path: '/superadmin/dashboard', accent: 'purple' }],
    },
    ...adminSections,
  ];

  const qualitySections: NavSection[] = [
    {
      label: 'TABLEAU DE BORD',
      items: [{ icon: LayoutDashboard, label: 'Dashboard', path: '/qualite/dashboard', accent: 'blue' }],
    },
    {
      label: 'AGENTS',
      items: [
        { icon: Users, label: 'Détails Agents', path: '/qualite/agents', accent: 'blue' },
        { icon: TrendingUp, label: 'Performance Mensuelle', path: '/qualite/performance', accent: 'green' },
        { icon: Activity, label: 'Tendances', path: '/qualite/trends' },
        { icon: BarChart3, label: 'Comparaison de rendement', path: '/qualite/comparison', accent: 'orange' },
      ],
    },
    {
      label: 'ÉVALUATION',
      items: [
        { icon: ClipboardCheck, label: "Fiche d'Évaluation", path: '/qualite/evaluation', accent: 'orange' },
        { icon: XCircle, label: 'Agenda refus équipe', path: '/qualite/agenda-refus' },
        { icon: PhoneCall, label: 'Stats appels', path: '/qualite/stats-appels' },
        { icon: FileBarChart, label: 'Analytique qualité', path: '/qualite/analytics-qualite' },
      ],
    },
    {
      label: 'CALENDRIERS',
      items: [
        { icon: Calendar, label: 'Calendrier RDV IA', path: '/qualite/calendar', accent: 'green' },
        { icon: CalendarDays, label: 'Calendrier RDV pipeline', path: '/qualite/calendrier' },
      ],
    },
    {
      label: 'COMMUNICATION',
      items: [
        { icon: Phone, label: "Centre d'appels", path: '/qualite/calls', accent: 'green' },
        { icon: Mail, label: 'Messages', path: '/qualite/messages', accent: 'blue' },
        teamChat,
      ],
    },
    {
      label: 'IA & PRÉSENCE',
      items: [
        { icon: Mic, label: 'Analyse', path: '/qualite/analysis', accent: 'blue' },
        { icon: Brain, label: 'Chatbot IA', path: '/qualite/chatbot', accent: 'blue' },
        { icon: History, label: 'Mon pointage', path: '/qualite/mon-historique-pointage' },
      ],
    },
  ];

  const confirmation1Sections: NavSection[] = [
    {
      label: 'MON TRAVAIL',
      items: [
        { icon: LayoutDashboard, label: 'Tableau de bord', path: '/confirmation1/dashboard', accent: 'blue' },
        { icon: History, label: 'Mon pointage', path: '/confirmation1/mon-historique-pointage' },
      ],
    },
    {
      label: 'AGENDAS',
      items: [
        { icon: Building2, label: 'Agenda EBI', path: '/confirmation1/agenda-ebi', agendaId: 'EBI', accent: 'green' },
        { icon: UserCheck, label: 'Agenda Client 1', path: '/confirmation1/agenda-client1', agendaId: 'CLIENT1' },
        { icon: Users, label: 'Agenda Client 2', path: '/confirmation1/agenda-client2', agendaId: 'CLIENT2' },
        { icon: XCircle, label: 'Agenda Refus', path: '/confirmation1/agenda-refus', agendaId: 'REFUS', accent: 'red' },
      ],
    },
    {
      label: 'ÉVALUATION',
      items: [
        { icon: Star, label: 'Évaluation agents', path: '/confirmation1/evaluation' },
        { icon: BarChart3, label: 'Statistiques globales', path: '/confirmation1/statistiques' },
        { icon: FileText, label: 'Fichiers contacts', path: '/confirmation1/fichiers' },
      ],
    },
    {
      label: 'CRM',
      items: [createContact, { icon: Users, label: 'Mes contacts', path: '/confirmation1/contacts' }, teamChat, chatbot],
    },
  ];

  const confirmation2Sections: NavSection[] = [
    {
      label: 'MON TRAVAIL',
      items: [
        { icon: LayoutDashboard, label: 'Tableau de bord', path: '/confirmation2/dashboard', accent: 'blue' },
        { icon: History, label: 'Mon pointage', path: '/confirmation2/mon-historique-pointage' },
      ],
    },
    {
      label: 'AGENDAS',
      items: [
        { icon: Building2, label: 'Agenda EBI', path: '/confirmation2/agenda-ebi', agendaId: 'EBI', accent: 'green' },
        { icon: UserCheck, label: 'Agenda Client 1', path: '/confirmation2/agenda-client1', agendaId: 'CLIENT1' },
      ],
    },
    {
      label: 'ÉVALUATION',
      items: [
        { icon: Star, label: 'Évaluation agents', path: '/confirmation2/evaluation' },
        { icon: BarChart3, label: 'Statistiques globales', path: '/confirmation2/statistiques' },
        { icon: FileText, label: 'Fichiers contacts', path: '/confirmation2/fichiers' },
      ],
    },
    {
      label: 'CRM',
      items: [createContact, { icon: Users, label: 'Mes contacts', path: '/confirmation2/contacts' }, teamChat, chatbot],
    },
  ];

  const confirmationClientSections: NavSection[] = [
    {
      label: 'MON TRAVAIL',
      items: [
        { icon: LayoutDashboard, label: 'Tableau de bord', path: '/confirmation-client/dashboard', accent: 'blue' },
        { icon: History, label: 'Mon pointage', path: '/confirmation-client/mon-historique-pointage' },
      ],
    },
    {
      label: 'AGENDAS',
      items: [
        { icon: Calendar, label: 'Agenda Client 1', path: '/confirmation-client/agenda', agendaId: 'CLIENT1', accent: 'green' },
        { icon: Users, label: 'Agenda Client 2', path: '/confirmation-client/agenda-client2', agendaId: 'CLIENT2' },
        { icon: XCircle, label: 'Agenda Refus', path: '/confirmation-client/agenda-refus', agendaId: 'REFUS', accent: 'red' },
        { icon: Building2, label: 'Agenda EBI', path: '/confirmation-client/agenda-ebi', agendaId: 'EBI' },
      ],
    },
    {
      label: 'GESTION',
      items: [
        { icon: Briefcase, label: 'Suivi commerciaux', path: '/confirmation-client/commerciaux' },
        { icon: CheckSquare, label: 'Attribution RDV', path: '/confirmation-client/attribution' },
        { icon: Banknote, label: 'Commentaire banque', path: '/confirmation-client/banque' },
      ],
    },
    {
      label: 'CRM',
      items: [createContact, { icon: Users, label: 'Mes contacts', path: '/confirmation-client/contacts' }, teamChat, chatbot],
    },
  ];

  const commercialSections: NavSection[] = [
    {
      label: 'MON TRAVAIL',
      items: [
        { icon: LayoutDashboard, label: 'Tableau de bord', path: '/commercial/dashboard', accent: 'blue' },
        { icon: Calendar, label: 'Mon agenda', path: '/commercial/agenda', accent: 'green' },
        { icon: History, label: 'Mon pointage', path: '/commercial/mon-historique-pointage' },
      ],
    },
    { label: 'COMMUNICATION', items: [teamChat, chatbot] },
  ];

  const techniqueSections: NavSection[] = [
    {
      label: 'MON TRAVAIL',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/technique/dashboard', accent: 'blue' },
        { icon: History, label: 'Mon pointage', path: '/technique/monpointage' },
      ],
    },
    {
      label: 'GESTION',
      items: [
        { icon: Users, label: 'Liste des agents', path: '/technique/agents' },
        { icon: FileText, label: 'Fichier des contacts', path: '/technique/fichiers' },
        { icon: Clock, label: 'Pointage équipe', path: '/technique/pointage', accent: 'orange' },
      ],
    },
    {
      label: 'ACCÈS & OUTILS',
      items: [
        { icon: Shield, label: 'Gérer accès', path: '/technique/acces' },
        { icon: Calendar, label: 'Compte calendrier', path: '/technique/calendrier' },
        { icon: Star, label: 'Évaluation', path: '/technique/evaluation' },
        teamChat,
        chatbot,
      ],
    },
  ];

  const sectionsByRole = (): NavSection[] => {
    switch (normalizedRole) {
      case 'superadmin': return superAdminSections;
      case 'admin': return adminSections;
      case 'qualite': return qualitySections;
      case 'commercial': return commercialSections;
      case 'tech': return techniqueSections;
      case 'confirmatrice':
        return confType === 'CONF2' ? confirmation2Sections
          : confType === 'CONFCLIENT' ? confirmationClientSections
          : confirmation1Sections;
      default: return agentSections;
    }
  };

  const sections = filterByPermission(sectionsByRole());
  const isActive = (path: string) => location.pathname === path;

  return (
    <div
      className={`h-screen flex flex-col transition-all duration-300 ease-in-out ${collapsed ? 'w-[68px]' : 'w-[248px]'
        } glass-sidebar`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 ring-1 ring-white/20 animate-float">
              <Sparkles className="w-5 h-5 text-primary-foreground drop-shadow-md" />
            </div>
            <div className="leading-none">
              <div className="flex items-baseline gap-1">
                <span className="font-black text-[17px] tracking-tight text-sidebar-foreground drop-shadow-sm">AI</span>
                <span className="font-black text-[17px] tracking-tight text-gradient-primary">CRM</span>
              </div>
              <span className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-success/15 text-success ring-1 ring-success/30 text-[8px] font-black uppercase tracking-widest">
                ★ Pro v2.0
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 mx-auto animate-float">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-sidebar-foreground cursor-pointer"
            aria-label="Réduire la barre latérale"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Toggle button when collapsed */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="p-2 mx-auto mt-2 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-sidebar-foreground cursor-pointer"
          aria-label="Développer la barre latérale"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-crm">
        {sections.map((section, sectionIdx) => (
          <div key={section.label} className={`mb-3 ${sectionIdx > 0 ? 'pt-3 mt-1 border-t border-sidebar-border/70' : ''}`}>
            {!collapsed && section.label && (
              <h3 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                {section.label}
              </h3>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                const accentClass = item.accent ? accentColors[item.accent] : '';
                return (
                  <li key={item.path + item.label}>
                    <Link
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-3 rounded-xl transition-all duration-200 relative group cursor-pointer ${collapsed ? 'px-0 py-2 justify-center' : 'px-3 py-2.5'
                        } ${active
                          ? item.accent
                            ? `bg-gradient-to-r ${accentClass} border font-semibold shadow-sm`
                            : 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-md shadow-primary/20'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }`}
                    >
                      {active && !collapsed && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
                      )}
                      <Icon
                        className={`w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${active && item.accent ? accentColors[item.accent].split(' ')[2] : ''
                          }`}
                      />
                      {!collapsed && <span className="text-[13px] font-medium truncate">{item.label}</span>}
                      {collapsed && (
                        <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-popover text-popover-foreground text-xs font-semibold rounded-lg shadow-xl border border-border opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                          {item.label}
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer – User profile & logout */}
      <div className="border-t border-sidebar-border px-2 py-3 shrink-0">
{!collapsed ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sidebar-accent/50 ring-1 ring-sidebar-border hover:bg-sidebar-accent transition-colors group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-success to-info flex items-center justify-center text-success-foreground text-[11px] font-black shadow-md ring-2 ring-white/10 shrink-0">
              {user?.name?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0 leading-tight">
              <p className="text-[13px] font-bold text-sidebar-foreground truncate drop-shadow-sm">
                {user?.name || user?.username}
              </p>
              <p className="text-[9px] font-black uppercase tracking-widest text-success">
                {ROLE_LABELS[confType && user?.role === 'confirmatrice' ? confType : user?.role ?? ''] ?? 'Agent'}
              </p>
            </div>
            <button
              onClick={logout}
              title="Se déconnecter"
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            title="Se déconnecter"
            className="w-full p-2 flex justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
