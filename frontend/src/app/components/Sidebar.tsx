import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Phone,
  Calendar,
  TrendingUp,
  MessageCircle,
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
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionContext';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  accent?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  requiredPermission?: string;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();

  const filterByPermission = (sections: NavSection[]): NavSection[] =>
    sections
      .map(section => ({
        ...section,
        items: section.items.filter(item =>
          !item.requiredPermission || hasPermission(item.requiredPermission)
        ),
      }))
      .filter(section => section.items.length > 0);

  const accentColors: Record<string, string> = {
    blue: 'from-blue-500/15 to-blue-600/5 text-blue-400 border-blue-500/25',
    green: 'from-emerald-500/15 to-emerald-600/5 text-emerald-400 border-emerald-500/25',
    orange: 'from-orange-500/15 to-orange-600/5 text-orange-400 border-orange-500/25',
    red: 'from-red-500/15 to-red-600/5 text-red-400 border-red-500/25',
    purple: 'from-purple-500/15 to-purple-600/5 text-purple-400 border-purple-500/25',
  };
  const normalizedRole = user?.role?.toLowerCase().replace(/[\s\_\-]/g, '');

  const agentSections: NavSection[] = [
    {
      label: 'PRINCIPAL',
      items: [
        { icon: LayoutDashboard, label: 'Tableau de bord', path: '/agent/dashboard', accent: 'blue' },
        { icon: TrendingUp, label: 'Performance', path: '/agent/performance', accent: 'green' },
        { icon: MessageCircle, label: 'Messages', path: '/agent/messages', accent: 'purple' },
      ],
    },
    {
      label: 'ACTIVITÉ',
      items: [
        { icon: Phone, label: 'Appel en direct', path: '/agent/contact', accent: 'orange' },
        { icon: Users, label: 'Contacts', path: '/agent/contacts' },
        { icon: Calendar, label: 'Agenda', path: '/agent/agenda' },
      ],
    },
    {
      label: 'IA',
      items: [
        { icon: Mic, label: 'Analyse Audio', path: '/agent/audio-analysis', accent: 'blue' },
        { icon: MessageCircle, label: 'Chatbot IA', path: '/chatbot', accent: 'blue' },
      ],
    },
  ];

  const adminSections: NavSection[] = [
    {
      label: 'PRINCIPAL',
      items: [
        { icon: Activity, label: 'Supervision Live', path: '/admin/realtime', accent: 'green' },
        { icon: Clock, label: 'Pointage', path: '/admin/pointage', accent: 'orange' },
      ],
    },
    {
      label: 'OPÉRATIONS',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard', accent: 'blue' },
        { icon: Users, label: 'Gestion des agents', path: '/admin/agents', accent: 'blue' },
        { icon: Target, label: 'Leads & CRM', path: '/admin/leads', accent: 'orange' },
        { icon: Calendar, label: 'Agenda', path: '/admin/agenda', accent: 'green' },
        { icon: Banknote, label: 'Salaires', path: '/admin/salaries', accent: 'purple' },
      ],
    },
    {
      label: 'IA & QUALITÉ',
      items: [
        { icon: Bell, label: 'Alertes & Scoring', path: '/admin/scoring', accent: 'orange' },
        { icon: Mic, label: 'Analyse Audio', path: '/admin/analysis', accent: 'blue' },
        { icon: MessageCircle, label: 'Chatbot IA', path: '/chatbot', accent: 'purple' },
      ],
    },
    {
      label: 'COMMUNICATION',
      items: [
        { icon: Phone, label: "Centre d'appels", path: '/admin/calls', accent: 'green' },
        { icon: Mail, label: 'Messages', path: '/admin/messages', accent: 'blue' },
      ],
    },
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
        { icon: BarChart3, label: 'Comparaison de rendement', path: '/qualite/comparison', accent: 'orange' },
        { icon: Calendar, label: 'Calendrier', path: '/qualite/calendar', accent: 'green' },
        { icon: Mic, label: 'Analyse', path: '/qualite/analysis', accent: 'blue' }
      ],
    },
    {
      label: 'COMMUNICATION',
      items: [
        { icon: Phone, label: "Centre d'appels", path: '/qualite/calls', accent: 'green' },
        { icon: Mail, label: 'Messages', path: '/qualite/messages', accent: 'blue' },
      ],
    },
    {
      label: 'ÉVALUATION',
      items: [
        { icon: ClipboardCheck, label: "Fiche d'Évaluation", path: '/qualite/evaluation', accent: 'orange' },
        { icon: MessageCircle, label: 'Chatbot IA', path: '/qualite/chatbot', accent: 'blue' },
      ],
    },
  ];

  const sections = filterByPermission(
    normalizedRole === 'admin' ? adminSections : normalizedRole === 'qualite' ? qualitySections : agentSections
  );
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
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 ring-1 ring-white/20 animate-float">
              <Sparkles className="w-5 h-5 text-white drop-shadow-md" />
            </div>
            <div className="leading-none">
              <div className="flex items-baseline gap-1">
                <span className="font-black text-[17px] tracking-tight text-white drop-shadow-sm">AI</span>
                <span className="font-black text-[17px] tracking-tight text-gradient-primary">CRM</span>
              </div>
              <span className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30 text-[8px] font-black uppercase tracking-widest">
                ★ Pro v2.0
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 mx-auto animate-float">
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
                  <li key={item.path}>
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
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[11px] font-black shadow-md ring-2 ring-white/10 shrink-0">
              {user?.name?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0 leading-tight">
              <p className="text-[13px] font-bold text-sidebar-foreground truncate drop-shadow-sm">
                {user?.name || user?.username}
              </p>
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                {user?.role === 'admin'
                  ? 'Administrateur'
                  : user?.role === 'qualite'
                    ? 'Superviseur'
                    : 'Agent'}
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
