import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bell, LogOut, User, Mail, Shield, CheckCircle, Settings, X,
  Coffee, ChevronDown, Play, Activity, Users,
  Clock, Award, PhoneCall, Menu
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../contexts/AlertContext';
import { useNavigate } from 'react-router-dom';
import { CallButton } from '../components/call/CallButton';
import api from '../services/api';
import toast from 'react-hot-toast';

type PauseType = 'cafe' | 'dejeuner' | 'priere' | 'technique' | 'personnelle' | 'reunion' | 'formation';
type AgentStatus = 'online' | 'break' | 'offline';

interface PauseOption {
  id: PauseType;
  label: string;
  icon: React.ReactNode;
  duration?: number;
  color: string;
}

interface AlertItem {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'critical' | 'warning' | 'info';
  read?: boolean;
}
const BREAK_MAPPING: Record<PauseType, string> = {
  cafe: "Café",
  dejeuner: "Déjeuner",
  priere: "Permission",
  technique: "Réunion",
  personnelle: "Perso",
  reunion: "Réunion",
  formation: "Formation"
};

const PAUSE_OPTIONS: PauseOption[] = [
  { id: 'cafe', label: 'Cafe', icon: <Coffee size={14} />, duration: 15, color: 'amber' },
  { id: 'dejeuner', label: 'Dejeuner', icon: <Coffee size={14} />, duration: 60, color: 'orange' },
  { id: 'priere', label: 'Priere', icon: <Coffee size={14} />, duration: 20, color: 'emerald' },
  { id: 'technique', label: 'Technique', icon: <Coffee size={14} />, duration: 30, color: 'blue' },
  { id: 'personnelle', label: 'Personnelle', icon: <Coffee size={14} />, duration: 15, color: 'purple' },
  { id: 'reunion', label: 'Reunion', icon: <Users size={14} />, duration: 45, color: 'indigo' },
  { id: 'formation', label: 'Formation', icon: <Award size={14} />, duration: 60, color: 'teal' },
];

const PAUSE_ICON_BG: Record<string, string> = {
  amber: 'bg-amber-500/10',
  orange: 'bg-orange-500/10',
  emerald: 'bg-emerald-500/10',
  blue: 'bg-blue-500/10',
  purple: 'bg-purple-500/10',
  indigo: 'bg-indigo-500/10',
  teal: 'bg-teal-500/10',
};

const PAUSE_ICON_TEXT: Record<string, string> = {
  amber: 'text-amber-400',
  orange: 'text-orange-400',
  emerald: 'text-emerald-400',
  blue: 'text-blue-400',
  purple: 'text-purple-400',
  indigo: 'text-indigo-400',
  teal: 'text-teal-400',
};

const PAUSE_LABELS: Record<string, string> = {
  cafe: 'Cafe',
  dejeuner: 'Dejeuner',
  priere: 'Priere',
  technique: 'Technique',
  personnelle: 'Personnelle',
  reunion: 'Reunion',
  formation: 'Formation',
  'Cafe': 'Cafe',
  'Dejeuner': 'Dejeuner',
  'Permission': 'Permission',
};

const formatElapsed = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatTimeOfDay = (isoStr: string): string => {
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
};

export function Navbar({ onMobileMenuToggle, mobileMenuOpen }: { onMobileMenuToggle?: () => void; mobileMenuOpen?: boolean }) {
  const { user, logout } = useAuth();
  const { alerts, removeAlert } = useAlerts();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('offline');
  const [activePause, setActivePause] = useState<PauseType | null>(null);
  const [pauseSeconds, setPauseSeconds] = useState<number>(0);
  const [breakStartTime, setBreakStartTime] = useState<string | null>(null);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const pauseRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    timerRef.current = setInterval(() => {
      setPauseSeconds(prev => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPauseSeconds(0);
  }, []);

  const applyServerStatus = useCallback((data: any) => {
    if (!data) return;
    const serverStatus = data.status;
    if (serverStatus === 'break') {
      setAgentStatus('break');
      setActivePause((data.break_type as PauseType) || null);
      setBreakStartTime(data.start_time || null);
      if (data.start_time) {
        const startMs = new Date(data.start_time).getTime();
        const nowMs = Date.now();
        const elapsed = Math.max(0, Math.floor((nowMs - startMs) / 1000));
        setPauseSeconds(elapsed);
      }
      if (!timerRef.current) startTimer();
    } else if (serverStatus === 'online' ||
      serverStatus === 'active') {
      setAgentStatus('online');
      setActivePause(null);
      setBreakStartTime(null);
      stopTimer();
    } else {
      setAgentStatus('offline');
      setActivePause(null);
      setBreakStartTime(null);
      stopTimer();
    }
  }, [startTimer, stopTimer]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await api.getAttendanceStatus();
        applyServerStatus(data);
      } catch (e) {
        // offline backend — keep current status
      }
    };
    fetchStatus();
    pollingRef.current = setInterval(fetchStatus, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [applyServerStatus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setShowProfile(false);
      if (pauseRef.current && !pauseRef.current.contains(event.target as Node)) setShowPauseMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const startPause = async (pauseType: PauseType) => {
    const prevStatus = agentStatus;
    const prevPause = activePause;
    setAgentStatus('break');
    setActivePause(pauseType);
    setBreakStartTime(new Date().toISOString());
    setPauseSeconds(0);
    setShowPauseMenu(false);
    startTimer();
    try {
      const res = await api.startBreak(BREAK_MAPPING[pauseType]);
      if (res?.success === false) {
        setAgentStatus(prevStatus);
        setActivePause(prevPause);
        setBreakStartTime(null);
        stopTimer();
        toast.error(res?.message || 'Impossible de démarrer la pause');
        return;
      }
    } catch (e) {
      toast.error('Erreur réseau lors du démarrage de la pause');
    }
  };

  const endPause = async () => {
    try {
      await api.endBreak();
    } catch {
      // break already ended on server — proceed to online anyway
    }
    setAgentStatus("online");
    setActivePause(null);
    setBreakStartTime(null);
    setShowPauseMenu(false);
    stopTimer();
  };

  const handleClockIn = async () => {
    try {
      await api.clockIn();
      setAgentStatus('online');
      toast.success('Pointage entrée réussi');
    } catch (e) {
      toast.error('Erreur lors du pointage entrée');
    }
  };

  const handleClockOut = async () => {
    try {
      await api.clockOut();
      toast.success('Pointage sortie réussi');
      setAgentStatus('offline');
    } catch (e) {
      toast.error('Erreur lors du pointage sortie');
    }
  };

  const roleLabels: Record<string, string> = {
    agent: 'Agent',
    confirmatrice1: 'Confirmatrice 1',
    confirmatrice2: 'Confirmatrice 2',
    admin: 'Administrateur',
    qualite: 'Superviseur Qualite',
    technique: 'Service Technique'
  };

  const userRole = user ? (roleLabels[user.role] || 'Agent') : 'Agent';
  const isOnBreak = agentStatus === 'break';
  const selectedPause = PAUSE_OPTIONS.find(p => p.id === activePause);
  const pauseLabel = selectedPause?.label || PAUSE_LABELS[activePause || ''] || activePause || '';
  const unreadCount = alerts.filter((a: AlertItem) => !a.read).length;

  const statusText = agentStatus === 'online' ? 'EN LIGNE' : agentStatus === 'break' ? 'EN PAUSE' : 'HORS LIGNE';
  const statusDot = agentStatus === 'online' ? 'bg-emerald-500' : agentStatus === 'break' ? 'bg-amber-500' : 'bg-slate-500';
  const statusDotPing = agentStatus === 'online' ? 'bg-emerald-400' : agentStatus === 'break' ? 'bg-amber-400' : 'bg-slate-400';
  const statusBadge = agentStatus === 'online' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' :
    agentStatus === 'break' ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' :
      'bg-slate-500/10 text-slate-400 border-slate-500/25';

  return (
    <nav className="h-16 glass-nav px-3 sm:px-6 flex items-center justify-between relative z-50">
      {/* LEFT SECTION */}
      <div className="flex items-center gap-2 sm:gap-3.5 select-none min-w-0">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-card hover:bg-accent transition-all cursor-pointer shrink-0"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>
        {user?.role === 'qualite' && (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-primary-foreground text-[10px] font-black shadow-lg shadow-primary/20">
            {(user?.name || user?.username || 'SQ').substring(0, 2).toUpperCase()}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusDotPing}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusDot}`} />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-foreground">
            {userRole.toUpperCase()} {statusText}
          </span>
        </div>

        <div className="h-3.5 w-[1px] bg-border opacity-50" />

        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border transition-colors duration-300 ${statusBadge}`}>
          {agentStatus === 'online' ? 'Disponible' :
            agentStatus === 'break' ? `Pause ${pauseLabel} · ${formatElapsed(pauseSeconds)}` : 'Hors ligne'}
        </span>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-2">
        {/* APPEL EN DIRECT — CallButton 3 états */}
        <CallButton />

        {/* POINTAGE — change entre entrée et sortie selon le statut */}
        {agentStatus === 'offline' && (
          <button
            onClick={handleClockIn}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer"
          >
            <Clock size={14} />
            <span className="text-xs font-medium">Pointer entrée</span>
          </button>
        )}
        {agentStatus === 'online' && (
          <button
            onClick={handleClockOut}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span className="text-xs font-medium">Pointer sortie</span>
          </button>
        )}
        {/* PAUSE BUTTON */}
        <div className="relative" ref={pauseRef}>
          <button
            onClick={() => {
              if (isOnBreak) {
                endPause();
              } else {
                setShowPauseMenu(!showPauseMenu);
              }
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
              isOnBreak
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'border-border bg-card hover:bg-accent hover:border-primary/30 text-foreground'
            }`}
          >
            {isOnBreak ? (
              <>
                <Play size={14} />
                <span className="text-xs font-medium">Reprendre</span>
              </>
            ) : (
              <>
                <Coffee size={14} />
                <span className="text-xs font-medium">Pause</span>
                <ChevronDown size={12} />
              </>
            )}
          </button>

          {/* Pause Menu Dropdown */}
          {showPauseMenu && !isOnBreak && (
            <div className="absolute right-0 mt-3 w-72 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-black uppercase tracking-tight text-xs">Prendre une pause</h3>
                <p className="text-[10px] text-muted-foreground mt-1">Selectionnez le motif de votre absence</p>
              </div>
              <div className="grid grid-cols-2 gap-2 p-3 max-h-80 overflow-y-auto">
                {PAUSE_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    onClick={() => startPause(option.id)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-all group text-left cursor-pointer"
                  >
                    <div className={`p-2 rounded-lg ${PAUSE_ICON_BG[option.color] || 'bg-slate-500/10'} ${PAUSE_ICON_TEXT[option.color] || 'text-slate-400'}`}>
                      {option.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold">{option.label}</p>
                      <p className="text-[9px] text-muted-foreground">{option.duration} min</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Pause Controls */}
          {isOnBreak && (
            <div className="absolute right-0 mt-3 w-72 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in-scale duration-200 z-50">
              <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="font-black text-sm uppercase">Pause en cours</h3>
                <p className="text-2xl font-mono font-bold mt-2 text-amber-400">{formatElapsed(pauseSeconds)}</p>
                <div className="mt-3 space-y-1">
                  <p className="text-[10px] text-muted-foreground">
                    Type : <span className="text-amber-400 font-bold">{pauseLabel}</span>
                  </p>
                  {breakStartTime && (
                    <p className="text-[10px] text-muted-foreground">
                      Debut : <span className="text-foreground font-bold">{formatTimeOfDay(breakStartTime)}</span>
                    </p>
                  )}
                </div>
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-[9px] font-black uppercase">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                    En pause
                  </span>
                </div>
              </div>
              <div className="p-4">
                <button
                  onClick={endPause}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                >
                  <Play size={14} /> Reprendre le travail
                </button>
              </div>
            </div>
          )}
        </div>

        {/* NOTIFICATIONS */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); setShowPauseMenu(false); }}
            className={`relative flex items-center justify-center w-10 h-10 rounded-xl border transition-all cursor-pointer ${
              showNotifications ? 'bg-primary/10 border-primary text-primary' : 'border-border bg-card hover:bg-accent hover:border-primary/30 text-foreground'
            }`}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-card">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in-scale duration-200">
              <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <h3 className="font-black uppercase tracking-tight text-xs">Notifications</h3>
                {alerts.length > 0 && (
                  <span className="bg-destructive/10 text-destructive text-[9px] px-2 py-0.5 rounded-full font-black">
                    {alerts.length} ALERTES
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {alerts.length > 0 ? (
                  alerts.map((n: AlertItem) => (
                    <div key={n.id} className="p-4 border-b border-border last:border-0 hover:bg-muted/10 transition-colors group relative">
                      <div className="flex justify-between items-start mb-1 pr-6">
                        <span className={`font-bold text-xs ${n.type === 'critical' ? 'text-destructive' : 'text-foreground'}`}>{n.title}</span>
                        <span className="text-[10px] text-muted-foreground">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{n.message}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeAlert(n.id); }}
                        className="absolute top-4 right-4 p-1 hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        aria-label="Fermer la notification"
                      >
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-muted-foreground">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Tout est sous controle</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <ThemeToggle />

        {/* PROFILE */}
        <div className="relative pl-2 ml-2 border-l border-border" ref={profileRef}>
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); setShowPauseMenu(false); }}
            className={`flex items-center gap-2 p-1 pr-3 rounded-xl transition-all cursor-pointer ${
              showProfile ? 'bg-primary/10' : 'hover:bg-muted/50'
            }`}
            aria-label="Profil utilisateur"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-black tracking-tight text-foreground uppercase">{user?.username || 'Agent'}</p>
              <p className="text-[9px] text-muted-foreground">{userRole}</p>
            </div>
            <ChevronDown size={12} className="text-muted-foreground" />
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-3 w-72 bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-fade-in-scale duration-200">
              <div className="p-6 bg-gradient-to-br from-primary/10 to-transparent text-center border-b border-border">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25 ring-4 ring-card">
                  <User className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-black tracking-tight text-lg uppercase text-foreground">{user?.name || user?.username}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{userRole}</p>

                <div className="mt-3 flex items-center justify-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${statusDot} ${agentStatus === 'online' ? 'animate-pulse' : ''}`} />
                  <span className="text-[9px] font-medium text-muted-foreground">
                    {agentStatus === 'online' ? 'Disponible' :
                      agentStatus === 'break' ? `En pause (${pauseLabel})` : 'Hors ligne'}
                  </span>
                </div>
              </div>

              <div className="p-3 space-y-1">
                <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted transition-colors group cursor-pointer">
                  <div className="p-2 bg-muted rounded-xl group-hover:bg-card transition-colors">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">E-mail</p>
                    <p className="text-xs font-bold truncate">{user?.username}@crm-ai.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted transition-colors group cursor-pointer">
                  <div className="p-2 bg-muted rounded-xl group-hover:bg-card transition-colors">
                    <Shield className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Niveau d'acces</p>
                    <p className="text-xs font-bold">Privileges {user?.role}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="p-2 bg-muted/30 rounded-xl text-center">
                    <PhoneCall className="w-3 h-3 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-[9px] font-bold">Appels</p>
                    <p className="text-xs font-mono">0</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded-xl text-center">
                    <Activity className="w-3 h-3 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-[9px] font-bold">Score</p>
                    <p className="text-xs font-mono">0%</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-muted/20 flex flex-col gap-2">
                <button className="flex items-center justify-center gap-2 w-full py-3 bg-card border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all cursor-pointer">
                  <Settings className="w-3.5 h-3.5" /> Parametres
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-destructive hover:text-white transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Deconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}