import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Phone,
  History,
  TrendingUp,
  Calendar,
  Users,
  ClipboardCheck,
  Clock,
  BarChart3,
  Map,
  Settings,
  Plug,
  FileText,
  Download,
  Upload,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  // Icônes pour confirmatrices
  CheckSquare,
  XCircle,
  Star,
  Building2,
  UserCheck,
  Briefcase,
  Banknote,
  Database,
  Shield,
  // Qualité + Commercial
  ShieldCheck,
  BadgeCheck,
  // Modules Khaled
  Brain,
  Bell,
  Euro
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:5241') + '/api';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const confType = user?.typeConfirmatrice?.toUpperCase();

  // État pour gérer l'ouverture/fermeture du sous-menu
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  // Agendas accessibles pour les confirmatrices
  const [myAgendas, setMyAgendas] = useState<string[]>([]);

  useEffect(() => {
    if (user?.role?.toLowerCase() === 'confirmatrice') {
      const token = localStorage.getItem('token');
      fetch(`${API_URL}/confirmatrice/my-agendas`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : [])
        .then((list: string[]) => setMyAgendas(list))
        .catch(() => setMyAgendas([]));
    }
  }, [user]);

  const toggleSubmenu = (menu: string) => {
    setOpenSubmenu(openSubmenu === menu ? null : menu);
  };
  
  // Récupérer le rôle (en minuscules pour la comparaison)
  const userRole = user?.role?.toLowerCase() || 'agent';

  // ==================== MENU AGENT ====================
  const agentMenuItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/agent/dashboard' },
    { icon: Phone, label: 'Appel en direct', path: '/agent/contact' },
    { icon: Users, label: 'Liste contacts', path: '/agent/contacts' },
    { icon: History, label: 'Historique', path: '/agent/history' },
    { icon: TrendingUp, label: 'Performance', path: '/agent/performance' },
    { icon: Calendar, label: 'Agenda', path: '/agent/agenda' },
    { icon: Clock, label: 'Mon Pointage', path: '/agent/pointage' },
    { icon: FileText, label: 'Créer une fiche contact', path: '/create-contact' }
  ];

  // ==================== MENU ADMIN ====================
  // Identique au superadmin sauf : sans Permissions, routes /admin/...
  const adminMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard Live',           path: '/admin/dashboard' },
    { icon: ClipboardCheck,  label: 'Scorecards Agents',        path: '/admin/scorecards' },
    { icon: Clock,           label: 'Pointage',                 path: '/admin/pointage' },
    { icon: BarChart3,       label: 'Analytique Appels',        path: '/admin/analytics' },
    { icon: Map,             label: 'Carte Géographique',       path: '/admin/map' },
    { icon: Users,           label: 'Utilisateurs',             path: '/admin/users' },
    { icon: Database,        label: 'Gestion Fichiers',         path: '/admin/injection' },
    { icon: Settings,        label: 'Configuration IA',         path: '/admin/ai-config' },
    { icon: Plug,            label: 'Intégrations',             path: '/admin/integrations' },
    { icon: FileText,        label: 'Stats Agents',             path: '/admin/agent-stats' },
    { icon: Download,        label: 'Rapports',                 path: '/admin/reports' },
    { icon: Download,        label: 'Export',                   path: '/admin/export' },
    { icon: TrendingUp,      label: 'Performance',              path: '/admin/performance' },
    { icon: BarChart3,       label: 'Comparaison Qualité',      path: '/admin/quality-comparison' },
    { icon: Upload,          label: 'Import Leads',             path: '/admin/import-leads' },
    { icon: Upload,          label: 'Fichier à charger',        path: '/admin/leads' },
    { icon: Banknote,        label: 'Salaires',                 path: '/admin/salary' },
    { icon: Brain,           label: 'Scoring IA',               path: '/admin/ai-scoring' },
    { icon: BarChart3,       label: 'Analytics Avancé',         path: '/admin/analytics-advanced' },
    { icon: Bell,            label: 'Alertes',                  path: '/admin/alerts-manage' },
    { icon: Euro,            label: 'Leads Import',             path: '/admin/leads-khaled' },
    { icon: FileText,        label: 'Créer une fiche contact',  path: '/create-contact' },
  ];

  // ==================== MENU SUPERADMIN ====================
  // Identique à admin + Permissions (superadmin uniquement), routes /superadmin/...
  const superAdminMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard Live',           path: '/superadmin/dashboard' },
    { icon: ClipboardCheck,  label: 'Scorecards Agents',        path: '/superadmin/scorecards' },
    { icon: Shield,          label: 'Permissions',              path: '/superadmin/permissions' },
    { icon: Clock,           label: 'Pointage',                 path: '/superadmin/pointage' },
    { icon: BarChart3,       label: 'Analytique Appels',        path: '/superadmin/analytics' },
    { icon: Map,             label: 'Carte Géographique',       path: '/superadmin/map' },
    { icon: Users,           label: 'Utilisateurs',             path: '/superadmin/users' },
    { icon: MessageSquare,   label: 'Messages',                 path: '/superadmin/messages' },
    { icon: Database,        label: 'Gestion Fichiers',         path: '/superadmin/injection' },
    { icon: Settings,        label: 'Configuration IA',         path: '/superadmin/ai-config' },
    { icon: Plug,            label: 'Intégrations',             path: '/superadmin/integrations' },
    { icon: FileText,        label: 'Stats Agents',             path: '/superadmin/agent-stats' },
    { icon: Download,        label: 'Rapports',                 path: '/superadmin/reports' },
    { icon: Download,        label: 'Export',                   path: '/superadmin/export' },
    { icon: TrendingUp,      label: 'Performance',              path: '/superadmin/performance' },
    { icon: BarChart3,       label: 'Comparaison Qualité',      path: '/admin/quality-comparison' },
    { icon: Upload,          label: 'Import Leads',             path: '/superadmin/import-leads' },
    { icon: Upload,          label: 'Fichier à charger',        path: '/superadmin/leads' },
    { icon: Banknote,        label: 'Salaires',                 path: '/superadmin/salary' },
    { icon: Brain,           label: 'Scoring IA',               path: '/superadmin/ai-scoring' },
    { icon: BarChart3,       label: 'Analytics Avancé',         path: '/superadmin/analytics-advanced' },
    { icon: Bell,            label: 'Alertes',                  path: '/superadmin/alerts-manage' },
    { icon: Euro,            label: 'Leads Import',             path: '/superadmin/leads-khaled' },
    { icon: FileText,        label: 'Créer une fiche contact',  path: '/create-contact' },
  ];

  // ==================== MENU CONFIRMATRICE 1 (Call Client 1) ====================
  const confirmation1MenuItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/confirmation1/dashboard' },
    { icon: Building2, label: 'Agenda EBI', path: '/confirmation1/agenda-ebi', agendaId: 'EBI' },
    {
      icon: Calendar,
      label: 'Agenda Client',
      isSubmenu: true,
      children: [
        { icon: UserCheck, label: 'Agenda Client 1', path: '/confirmation1/agenda-client1', agendaId: 'CLIENT1' },
        { icon: Users,     label: 'Agenda Client 2', path: '/confirmation1/agenda-client2', agendaId: 'CLIENT2' }
      ]
    },
    { icon: XCircle, label: 'Agenda Refus', path: '/confirmation1/agenda-refus', agendaId: 'REFUS' },
    { icon: Star, label: 'Évaluation Agents', path: '/confirmation1/evaluation' },
    { icon: BarChart3, label: 'Statistiques Globales', path: '/confirmation1/statistiques' },
    { icon: FileText, label: 'Créer une fiche contact', path: '/create-contact' }
  ];

  // ==================== MENU CONFIRMATRICE 2 (Call Client 2) ====================
  const confirmation2MenuItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/confirmation2/dashboard' },
    { icon: Building2, label: 'Agenda EBI',      path: '/confirmation2/agenda-ebi', agendaId: 'EBI' },
    { icon: UserCheck, label: 'Agenda Client 1', path: '/confirmation2/agenda-client1', agendaId: 'CLIENT1' },
    { icon: Star, label: 'Évaluation Agents', path: '/confirmation2/evaluation' },
    { icon: BarChart3, label: 'Statistiques Globales', path: '/confirmation2/statistiques' },
    { icon: FileText, label: 'Créer une fiche contact', path: '/create-contact' }
  ];

  // ==================== MENU CONFIRMATRICE CLIENT ====================
  const confirmationClientMenuItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord',  path: '/confirmation-client/dashboard' },
    { icon: Calendar,        label: 'Agenda Client 1',  path: '/confirmation-client/agenda',          agendaId: 'CLIENT1' },
    { icon: Users,           label: 'Agenda Client 2',  path: '/confirmation-client/agenda-client2',  agendaId: 'CLIENT2' },
    { icon: XCircle,         label: 'Agenda Refus',     path: '/confirmation-client/agenda-refus',    agendaId: 'REFUS' },
    { icon: Building2,       label: 'Agenda EBI',       path: '/confirmation-client/agenda-ebi',      agendaId: 'EBI' },
    { icon: Briefcase,       label: 'Suivi Commerciaux', path: '/confirmation-client/commerciaux' },
    { icon: CheckSquare,     label: 'Attribution RDV',  path: '/confirmation-client/attribution' },
    { icon: FileText,        label: 'Créer une fiche contact', path: '/create-contact' },
  ];

  // ==================== MENU QUALITE ====================
  const qualiteMenuItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/qualite/dashboard' },
    { icon: XCircle, label: 'Agenda Refus Équipe', path: '/qualite/agenda-refus' },
    { icon: BarChart3, label: 'Stats Appels', path: '/qualite/stats-appels' },
    { icon: ClipboardCheck, label: 'Éval. Manuelle', path: '/qualite/evaluation-manuelle' },
    { icon: TrendingUp, label: 'Analytique Qualité', path: '/qualite/analytics-qualite' },
  ];

  // ==================== MENU COMMERCIAL ====================
  const commercialMenuItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/commercial/dashboard' },
    { icon: Calendar, label: 'Mon Agenda', path: '/commercial/agenda' },
  ];

  // ==================== MENU SERVICE TECHNIQUE ====================
  const techniqueMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard',           path: '/technique/dashboard' },
    { icon: Users,           label: 'Liste des Agents',    path: '/technique/agents' },
    { icon: FileText,        label: 'Fichier des contacts', path: '/technique/fichiers' },
    { icon: Clock,           label: 'Pointage équipe',     path: '/technique/pointage' },
    { icon: UserCheck,       label: 'Mon Pointage',        path: '/technique/monpointage' },
    { icon: Shield,          label: 'Gérer accès',         path: '/technique/acces' },
    { icon: Calendar,        label: 'Compte calendrier',   path: '/technique/calendrier' },
    { icon: Star,            label: 'Évaluation',          path: '/technique/evaluation' },
  ];

  // Filtre les items selon les agendas accessibles (ne filtre pas si myAgendas est vide)
  const filterByAgenda = (items: any[]): any[] => {
    if (myAgendas.length === 0) return items;
    return items
      .map(item => {
        if (item.isSubmenu) {
          const filteredChildren = (item.children || []).filter(
            (child: any) => !child.agendaId || myAgendas.includes(child.agendaId)
          );
          if (filteredChildren.length === 0) return null;
          return { ...item, children: filteredChildren };
        }
        if (item.agendaId && !myAgendas.includes(item.agendaId)) return null;
        return item;
      })
      .filter(Boolean);
  };

  // ==================== SÉLECTION DES MENUS SELON LE RÔLE ====================
  let menuItems;
  if (userRole === 'superadmin') {
    menuItems = superAdminMenuItems;
  } else if (userRole === 'admin') {
    menuItems = adminMenuItems;
  } else if (userRole === 'confirmatrice') {
    if (confType === 'CONF1') menuItems = filterByAgenda(confirmation1MenuItems);
    else if (confType === 'CONF2') menuItems = filterByAgenda(confirmation2MenuItems);
    else if (confType === 'CONFCLIENT') menuItems = filterByAgenda(confirmationClientMenuItems);
    else menuItems = filterByAgenda(confirmation1MenuItems); // fallback
  } else if (userRole === 'qualite') {
    menuItems = qualiteMenuItems;
  } else if (userRole === 'commercial') {
    menuItems = commercialMenuItems;
  } else if (userRole === 'tech') {
    menuItems = techniqueMenuItems;
  } else {
    menuItems = agentMenuItems;
  }

  // Fonction pour render un élément de menu (normal ou avec sous-menu)
  const renderMenuItem = (item: any) => {
    const Icon = item.icon;
    const isActive = item.path && location.pathname === item.path;

    // Si c'est un sous-menu
    if (item.isSubmenu) {
      const isOpen = openSubmenu === item.label;
      
      if (collapsed) {
        return (
          <div className="relative group">
            <div className="flex items-center justify-center px-3 py-2.5 rounded-lg text-sidebar-foreground">
              <Icon className="w-5 h-5" />
            </div>
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {item.label}
            </div>
          </div>
        );
      }

      return (
        <div>
          <button
            onClick={() => toggleSubmenu(item.label)}
            className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </div>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {isOpen && (
            <div className="ml-6 mt-1 space-y-1 border-l border-sidebar-border pl-2">
              {item.children.map((child: any) => {
                const ChildIcon = child.icon;
                const isChildActive = location.pathname === child.path;
                return (
                  <Link
                    key={child.path}
                    to={child.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isChildActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent'
                    }`}
                  >
                    <ChildIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate text-sm">{child.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Menu item normal
    return (
      <li>
        <Link
          to={item.path}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            isActive
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent'
          }`}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </Link>
      </li>
    );
  };

  // Libellés du service pour l'affichage
  const getServiceLabel = () => {
    if (userRole === 'superadmin') return 'Super Administration';
    if (userRole === 'admin') return 'Administration';
    if (userRole === 'confirmatrice') {
      if (confType === 'CONF1') return 'Call Client Niveau 1';
      if (confType === 'CONF2') return 'Call Client Niveau 2';
      if (confType === 'CONFCLIENT') return 'Confirmation Client';
    }
    if (userRole === 'agent') return 'Téléprospection';
    if (userRole === 'qualite') return 'Service Qualité';
    if (userRole === 'commercial') return 'Commercial';
    if (userRole === 'tech') return 'Service Technique';
    return '';
  };

  return (
    <div
      className={`h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-bold text-sm">EBI</span>
            </div>
            <div>
              <p className="text-sm font-bold text-sidebar-foreground leading-tight">EBI Call</p>
              <p className="text-xs text-sidebar-foreground/60 leading-tight">Center CRM</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-bold text-xs">EBI</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-sidebar-foreground" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-sidebar-foreground" />
          )}
        </button>
      </div>

      {/* Affichage du rôle dans la sidebar */}
      {!collapsed && userRole && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/60 uppercase font-semibold">Service</p>
          <p className="text-sm font-medium text-sidebar-foreground">
            {getServiceLabel()}
          </p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {menuItems.map((item, index) => (
            <React.Fragment key={item.agendaId || item.label || index}>
              {renderMenuItem(item)}
            </React.Fragment>
          ))}
        </ul>
      </nav>
    </div>
  );
}