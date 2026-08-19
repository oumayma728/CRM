import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, LogOut, User, Coffee, ChevronDown, Play, Clock, Users, Award } from 'lucide-react';
import { toast } from 'react-toastify';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { agentService } from '../../services/agentService';

type PauseType = 'cafe' | 'dejeuner' | 'permission' | 'reunion' | 'personnelle' | 'formation';
type AgentStatus = 'offline' | 'active' | 'break';

interface PauseOption {
  id: PauseType;
  label: string;
  icon: React.ReactNode;
  duration: number;
  color: string;
}

const PAUSE_OPTIONS: PauseOption[] = [
  { id: 'cafe', label: 'Café', icon: <Coffee size={14} />, duration: 15, color: 'amber' },
  { id: 'dejeuner', label: 'Déjeuner', icon: <Coffee size={14} />, duration: 60, color: 'orange' },
  { id: 'permission', label: 'Permission', icon: <Coffee size={14} />, duration: 20, color: 'emerald' },
  { id: 'reunion', label: 'Réunion', icon: <Users size={14} />, duration: 45, color: 'indigo' },
  { id: 'personnelle', label: 'Personnelle', icon: <Coffee size={14} />, duration: 15, color: 'purple' },
  { id: 'formation', label: 'Formation', icon: <Award size={14} />, duration: 60, color: 'teal' },
];

const PAUSE_ICON_BG: Record<string, string> = {
  amber: 'bg-amber-500/10', orange: 'bg-orange-500/10', emerald: 'bg-emerald-500/10',
  indigo: 'bg-indigo-500/10', purple: 'bg-purple-500/10', teal: 'bg-teal-500/10',
};
const PAUSE_ICON_TEXT: Record<string, string> = {
  amber: 'text-amber-500', orange: 'text-orange-500', emerald: 'text-emerald-500',
  indigo: 'text-indigo-500', purple: 'text-purple-500', teal: 'text-teal-500',
};

const formatElapsed = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [agentStatus, setAgentStatus] = useState<AgentStatus>('offline');
  const [activePause, setActivePause] = useState<string | null>(null);
  const [pauseSeconds, setPauseSeconds] = useState(0);
  const [showPauseMenu, setShowPauseMenu] = useState(false);

  const pauseRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setPauseSeconds(prev => prev + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setPauseSeconds(0);
  }, []);

  const applyServerStatus = useCallback((data: { status: AgentStatus; breakType?: string; startTime?: string }) => {
    setAgentStatus(data.status);
    if (data.status === 'break') {
      setActivePause(data.breakType || null);
      if (data.startTime) {
        setPauseSeconds(Math.max(0, Math.floor((Date.now() - new Date(data.startTime).getTime()) / 1000)));
      }
      if (!timerRef.current) startTimer();
    } else {
      setActivePause(null);
      stopTimer();
    }
  }, [startTimer, stopTimer]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await agentService.getAttendanceStatus();
        applyServerStatus(data);
      } catch { /* backend unreachable — keep current status */ }
    };
    fetchStatus();
    pollingRef.current = setInterval(fetchStatus, 10000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [applyServerStatus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pauseRef.current && !pauseRef.current.contains(event.target as Node)) setShowPauseMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleClockIn = async () => {
    try {
      const res = await agentService.clockIn();
      if (res.success === false) { toast.error(res.message || 'Erreur pointage entrée'); return; }
      setAgentStatus('active');
      toast.success('Pointage entrée réussi');
    } catch { toast.error('Erreur lors du pointage entrée'); }
  };

  const handleClockOut = async () => {
    try {
      const res = await agentService.clockOut();
      if (res.success === false) { toast.error(res.message || 'Erreur pointage sortie'); return; }
      setAgentStatus('offline');
      toast.success('Pointage sortie réussi');
    } catch { toast.error('Erreur lors du pointage sortie'); }
  };

  const startPause = async (pauseType: PauseType, label: string) => {
    const prevStatus = agentStatus, prevPause = activePause;
    setAgentStatus('break');
    setActivePause(label);
    setPauseSeconds(0);
    setShowPauseMenu(false);
    startTimer();
    try {
      const res = await agentService.startBreak(label);
      if (res.success === false) {
        setAgentStatus(prevStatus);
        setActivePause(prevPause);
        stopTimer();
        toast.error(res.message || 'Impossible de démarrer la pause');
      }
    } catch {
      toast.error('Erreur réseau lors du démarrage de la pause');
    }
  };

  const endPause = async () => {
    try { await agentService.endBreak(); } catch { /* already ended server-side */ }
    setAgentStatus('active');
    setActivePause(null);
    setShowPauseMenu(false);
    stopTimer();
  };

  const roleLabels: Record<string, string> = {
    agent: 'Agent Commercial',
    conf1: 'Confirmatrice Niveau 1',
    confirmatrice1: 'Confirmatrice Niveau 1',
    conf2: 'Confirmatrice Niveau 2',
    confirmatrice2: 'Confirmatrice Niveau 2',
    admin: 'Administrateur',
    qualite: 'Service Qualité',
    technique: 'Service Technique'
  };
  const userRole = user?.role?.toLowerCase() || '';
  const roleLabel = roleLabels[userRole] || user?.role || 'Utilisateur';

  const isOnBreak = agentStatus === 'break';
  const statusDot = agentStatus === 'active' ? 'bg-emerald-500' : agentStatus === 'break' ? 'bg-amber-500' : 'bg-muted-foreground';

  return (
    <nav className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div>
        <h1 className="font-medium text-foreground">Bienvenue, {user?.name || 'Utilisateur'}</h1>
        <p className="text-sm text-muted-foreground">{roleLabel}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Pointage */}
        {agentStatus === 'offline' && (
          <button
            onClick={handleClockIn}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all"
          >
            <Clock size={14} />
            <span className="text-xs font-medium">Pointer entrée</span>
          </button>
        )}
        {agentStatus === 'active' && (
          <button
            onClick={handleClockOut}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all"
          >
            <LogOut size={14} />
            <span className="text-xs font-medium">Pointer sortie</span>
          </button>
        )}

        {/* Pause */}
        {agentStatus !== 'offline' && (
          <div className="relative" ref={pauseRef}>
            <button
              onClick={() => isOnBreak ? endPause() : setShowPauseMenu(!showPauseMenu)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all ${
                isOnBreak ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'border-border bg-card hover:bg-accent text-foreground'
              }`}
            >
              {isOnBreak ? (
                <>
                  <Play size={14} />
                  <span className="text-xs font-medium">Reprendre · {formatElapsed(pauseSeconds)}</span>
                </>
              ) : (
                <>
                  <Coffee size={14} />
                  <span className="text-xs font-medium">Pause</span>
                  <ChevronDown size={12} />
                </>
              )}
            </button>

            {showPauseMenu && !isOnBreak && (
              <div className="absolute right-0 mt-3 w-72 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-border bg-muted/30">
                  <h3 className="font-bold uppercase tracking-tight text-xs text-foreground">Prendre une pause</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Sélectionnez le motif de votre absence</p>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3">
                  {PAUSE_OPTIONS.map(option => (
                    <button
                      key={option.id}
                      onClick={() => startPause(option.id, option.label)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-all text-left"
                    >
                      <div className={`p-2 rounded-lg ${PAUSE_ICON_BG[option.color]} ${PAUSE_ICON_TEXT[option.color]}`}>
                        {option.icon}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{option.label}</p>
                        <p className="text-[9px] text-muted-foreground">{option.duration} min</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {agentStatus !== 'offline' && (
          <span className="hidden md:flex items-center gap-1.5 pl-1">
            <span className={`w-2 h-2 rounded-full ${statusDot} ${agentStatus === 'active' ? 'animate-pulse' : ''}`} />
          </span>
        )}

        <ThemeToggle />

        <button className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-card hover:bg-accent transition-colors">
          <Bell className="w-4 h-4 text-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
            <User className="w-5 h-5 text-primary-foreground" />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-card hover:bg-destructive hover:text-destructive-foreground transition-colors"
            aria-label="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
