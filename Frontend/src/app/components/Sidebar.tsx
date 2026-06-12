import React, { useState } from 'react';
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
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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
    { icon: Calendar, label: 'Agenda', path: '/agent/agenda' }
  ];

  // ==================== MENU ADMIN ====================
  const adminMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard Live', path: '/admin/dashboard' },
    { icon: ClipboardCheck, label: 'Scorecards Agents', path: '/admin/scorecards' },
    { icon: Clock, label: 'Pointage', path: '/admin/pointage' },
    { icon: BarChart3, label: 'Analytique Appels', path: '/admin/analytics' },
    { icon: Map, label: 'Carte Géographique', path: '/admin/map' },
    { icon: Users, label: 'Utilisateurs', path: '/admin/users' },
    { icon: Database, label: 'Gestion Fichiers', path: '/admin/injection' },
    { icon: Shield, label: 'Permissions', path: '/admin/permissions' },
    { icon: Settings, label: 'Configuration IA', path: '/admin/ai-config' },
    { icon: Plug, label: 'Intégrations', path: '/admin/integrations' },
    { icon: FileText, label: 'Stats Agents', path: '/admin/agent-stats' },
    { icon: Download, label: 'Rapports', path: '/admin/reports' },
    { icon: Upload, label: 'Import Leads', path: '/admin/import-leads' },
    { icon: Upload, label: 'Fichier à charger', path: '/admin/leads' },
    { icon: UserCheck, label: 'Agendas Confirmatrices', path: '/admin/confirmatrices-agendas' }
  ];

  // ==================== MENU CONFIRMATRICE 1 (Call Client 1) ====================
  const confirmation1MenuItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/confirmation1/dashboard' },
    { icon: Building2, label: 'Agenda EBI', path: '/confirmation1/agenda-ebi' },
    { 
      icon: Calendar, 
      label: 'Agenda Client', 
      isSubmenu: true,
      children: [
        { icon: UserCheck, label: 'Agenda Client 1', path: '/confirmation1/agenda-client1' },
        { icon: Users, label: 'Agenda Client 2', path: '/confirmation1/agenda-client2' }
      ]
    },
    { icon: XCircle, label: 'Agenda Refus', path: '/confirmation1/agenda-refus' },
    { icon: Star, label: 'Évaluation Agents', path: '/confirmation1/evaluation' },
    { icon: BarChart3, label: 'Statistiques Globales', path: '/confirmation1/statistiques' },
    { icon: FileText, label: 'Créer une fiche contact', path: '/create-contact' }
  ];

  // ==================== MENU CONFIRMATRICE 2 (Call Client 2) ====================
  const confirmation2MenuItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/confirmation2/dashboard' },
    { icon: Building2, label: 'Agenda Client 1', path: '/confirmation2/agenda-client1' },
    { icon: Star, label: 'Évaluation Agents', path: '/confirmation2/evaluation' },
    { icon: BarChart3, label: 'Statistiques Globales', path: '/confirmation2/statistiques' },
    { icon: FileText, label: 'Créer une fiche contact', path: '/create-contact' }
  ];

  // ==================== MENU CONFIRMATRICE CLIENT ====================
  const confirmationClientMenuItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/confirmation-client/dashboard' },
    { icon: Calendar, label: 'Agenda Client', path: '/confirmation-client/agenda' },
    { icon: Briefcase, label: 'Suivi Commerciaux', path: '/confirmation-client/commerciaux' },
    { icon: CheckSquare, label: 'Attribution RDV', path: '/confirmation-client/attribution' },
    
  ];

  // ==================== SÉLECTION DES MENUS SELON LE RÔLE ====================
  let menuItems;
  if (userRole === 'admin') {
    menuItems = adminMenuItems;
  } else if (userRole === 'confirmatrice') {
    if (confType === 'CONF1') menuItems = confirmation1MenuItems;
    else if (confType === 'CONF2') menuItems = confirmation2MenuItems;
    else if (confType === 'CONFCLIENT') menuItems = confirmationClientMenuItems;
    else menuItems = confirmation1MenuItems; // fallback
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
    if (userRole === 'admin') return 'Administration';
    if (userRole === 'confirmatrice') {
      if (confType === 'CONF1') return 'Call Client Niveau 1';
      if (confType === 'CONF2') return 'Call Client Niveau 2';
      if (confType === 'CONFCLIENT') return 'Confirmation Client';
    }
    if (userRole === 'agent') return 'Commercial';
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
          <img
            src="figma:asset/1f68a91521dcb3acfdd2e96b2d386548db63be5d.png"
            alt="EBI Call Center"
            className="h-10"
          />
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
            <li key={item.path || item.label || index}>
              {renderMenuItem(item)}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}