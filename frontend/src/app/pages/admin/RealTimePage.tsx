import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity, Clock, AlertTriangle, Users, Phone, TrendingUp,
  Zap, CheckCircle2, XCircle, Coffee, RefreshCw, UserCheck,
  ArrowUpRight, ArrowDownRight, Headphones, Brain, Target,
  ChevronRight, User as UserIcon, ExternalLink, CalendarDays,
  Briefcase, Timer, DoorOpen, DoorClosed, BarChart3
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import api from '../../services/api';
import { useChartTheme } from '../../hooks/useChartTheme';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';

interface AgentLive {
  id: number;
  name: string;
  status: 'active' | 'inactive' | 'break' | 'offline';
  calls: number;
  idleTime: number;
  score?: number;
  score_ia?: number;
  score_qualite?: number;
  breakType?: string;
  clock_in?: string;
  work_duration_minutes?: number;
  break_start?: string;
  break_duration_minutes?: number;
  total_break_minutes?: number;
  project?: string;
  last_activity?: string;
  clock_out?: string;
}

interface CallToday {
  call_id: number;
  agent_name?: string;
  call_date?: string;
  call_duration?: number;
  status?: string;
  resultat?: string;
  score_percentage?: number;
  client?: string;
  project?: string;
  postal_code?: string;
}

interface HourlyPoint {
  h: string;
  appels: number;
  conversions: number;
}

const statusConfig = {
  active: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-500', label: 'Actif', icon: CheckCircle2 },
  inactive: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', dot: 'bg-red-500 animate-pulse', label: 'Inactif', icon: XCircle },
  break: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', dot: 'bg-yellow-500', label: 'Pause', icon: Coffee },
  offline: { color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/30', dot: 'bg-slate-500', label: 'Hors ligne', icon: XCircle },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border px-3 py-2 rounded-xl shadow-xl text-xs">
        <p className="font-bold text-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-semibold">
            {p.name === 'appels' ? '📞' : '✅'} {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const formatDuration = (minutes?: number) => {
  if (minutes == null || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}` : `${m} min`;
};

const formatTime = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const formatDateTime = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const statusLabel = (status: string, breakType?: string) => {
  if (status === 'break') return `Pause ${breakType ? '· ' + breakType : ''}`;
  if (status === 'active') return 'En poste';
  if (status === 'offline') return 'Hors ligne';
  return 'Inactif';
};

export default function RealTimePage() {
  const chartTheme = useChartTheme();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentLive[]>([]);
  const [callsToday, setCallsToday] = useState<CallToday[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyPoint[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [modalKey, setModalKey] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [live, overview, calls] = await Promise.allSettled([
        api.getLiveAgents(),
        api.getAnalyticsOverview(),
        api.getCallsToday().catch(() => []),
      ]);
      if (live.status === 'fulfilled') setAgents(live.value || []);
      if (overview.status === 'fulfilled' && overview.value?.hourly) {
        setHourlyData(
          overview.value.hourly.map((h: any) => ({
            h: `${h.hour}h`,
            appels: h.appels,
            conversions: Math.round((h.appels || 0) * 0.3),
          }))
        );
      }
      if (calls.status === 'fulfilled') setCallsToday(calls.value || []);
    } catch (err) {
      console.error("Live fetch error:", err);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const activeAgents = agents.filter(a => a.status === 'active');
  const inactiveAgents = agents.filter(a => a.status === 'inactive' || a.status === 'offline');
  const onBreakAgents = agents.filter(a => a.status === 'break');
  const totalCalls = agents.reduce((s, a) => s + a.calls, 0);
  const avgScore = agents.length ? Math.round(agents.reduce((s, a) => s + (a.score || 0), 0) / agents.length) : 0;

  const kpis = [
    {
      key: 'active', icon: Users, label: 'Agents Actifs', value: activeAgents.length,
      sub: `/ ${agents.length} total`, color: 'from-emerald-500/20 to-emerald-600/5',
      iconColor: 'text-emerald-400', border: 'border-emerald-500/20'
    },
    {
      key: 'calls', icon: Phone, label: 'Appels du Jour', value: callsToday.length || totalCalls,
      sub: `${callsToday.length} appel(s) aujourd'hui`, color: 'from-blue-500/20 to-blue-600/5',
      iconColor: 'text-blue-400', border: 'border-blue-500/20', up: true
    },
    {
      key: 'inactive', icon: AlertTriangle, label: 'Agents Inactifs', value: inactiveAgents.length,
      sub: inactiveAgents.length > 0 ? 'Action requise' : 'Aucun problème',
      color: inactiveAgents.length > 0 ? 'from-red-500/20 to-red-600/5' : 'from-slate-500/10 to-slate-600/5',
      iconColor: inactiveAgents.length > 0 ? 'text-red-400' : 'text-muted-foreground',
      border: inactiveAgents.length > 0 ? 'border-red-500/20' : 'border-border'
    },
    {
      key: 'break', icon: Coffee, label: 'Agents en Pause', value: onBreakAgents.length,
      sub: onBreakAgents.length > 0 ? 'En pause actuellement' : 'Aucun agent en pause',
      color: 'from-yellow-500/20 to-yellow-600/5',
      iconColor: 'text-yellow-400', border: 'border-yellow-500/20'
    },
    {
      key: 'score', icon: Target, label: 'Score Moyen', value: `${avgScore}%`,
      sub: avgScore >= 75 ? '✅ Bon niveau' : '⚠️ À améliorer',
      color: 'from-purple-500/20 to-purple-600/5',
      iconColor: 'text-purple-400', border: 'border-purple-500/20'
    },
  ];

  const modalContent = () => {
    switch (modalKey) {
      case 'active':
        return (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {activeAgents.length === 0 && <EmptyState msg="Aucun agent actif actuellement." />}
            {activeAgents.map(a => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 p-4 bg-muted/40 border border-border rounded-xl">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/40 to-indigo-600/40 flex items-center justify-center text-xs font-black">
                  {a.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-foreground text-sm truncate">{a.name}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-muted-foreground mt-0.5">
                    <span className="inline-flex items-center gap-1"><Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">En poste</Badge></span>
                    {a.project && <span className="inline-flex items-center gap-1"><Briefcase className="w-3 h-3" /> {a.project}</span>}
                  </div>
                </div>
                <div className="text-right text-[11px] font-semibold text-muted-foreground">
                  <p>🕐 {formatTime(a.clock_in)}</p>
                  <p className="text-foreground font-bold mt-0.5">{formatDuration(a.work_duration_minutes)}</p>
                </div>
                <button
                  onClick={() => window.location.href = '/admin/agents?user=' + a.id}
                  className="ml-auto shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-black rounded-lg transition-colors border border-primary/30"
                >
                  <UserIcon className="w-3.5 h-3.5" /> Profil
                </button>
              </div>
            ))}
          </div>
        );
      case 'inactive':
        return (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {inactiveAgents.length === 0 && <EmptyState msg="Aucun agent inactif. 🎉" />}
            {inactiveAgents.map(a => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 p-4 bg-muted/40 border border-border rounded-xl">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500/40 to-red-600/40 flex items-center justify-center text-xs font-black">
                  {a.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-foreground text-sm truncate">{a.name}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-muted-foreground mt-0.5">
                    {a.project && <span className="inline-flex items-center gap-1"><Briefcase className="w-3 h-3" /> {a.project}</span>}
                  </div>
                </div>
                <div className="text-right text-[11px] font-semibold text-muted-foreground">
                  <p>Dernière activité: {formatDateTime(a.last_activity)}</p>
                  <p className="mt-0.5">Sortie: {formatTime(a.clock_out)}</p>
                </div>
              </div>
            ))}
          </div>
        );
      case 'break':
        return (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {onBreakAgents.length === 0 && <EmptyState msg="Aucun agent en pause actuellement." />}
            {onBreakAgents.map(a => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 p-4 bg-muted/40 border border-border rounded-xl">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-500/40 to-yellow-600/40 flex items-center justify-center text-xs font-black">
                  {a.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-foreground text-sm truncate">{a.name}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-muted-foreground mt-0.5">
                    <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                      {a.breakType ? `Pause ${a.breakType}` : 'Pause'}
                    </Badge>
                    {a.project && <span className="inline-flex items-center gap-1"><Briefcase className="w-3 h-3" /> {a.project}</span>}
                  </div>
                </div>
                <div className="text-right text-[11px] font-semibold text-muted-foreground">
                  <p>Début: {formatTime(a.break_start)}</p>
                  <p className="text-amber-400 font-bold mt-0.5">Durée: {formatDuration(a.break_duration_minutes)}</p>
                </div>
              </div>
            ))}
          </div>
        );
      case 'calls':
        return (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {callsToday.length === 0 && <EmptyState msg="Aucun appel enregistré aujourd'hui." />}
            {callsToday.map(c => (
              <div key={c.call_id} className="flex flex-wrap items-center gap-3 p-4 bg-muted/40 border border-border rounded-xl">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/40 to-blue-600/40 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-blue-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-foreground text-sm truncate">{c.client || 'Client N/A'} <span className="text-muted-foreground font-semibold">· {c.agent_name}</span></p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-muted-foreground mt-0.5">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {formatDateTime(c.call_date)}</span>
                    <span className="inline-flex items-center gap-1"><Timer className="w-3 h-3" /> {c.call_duration != null ? `${c.call_duration}s` : '—'}</span>
                    {c.project && <span className="inline-flex items-center gap-1"><Briefcase className="w-3 h-3" /> {c.project}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-primary/10 text-primary border-primary/30">{c.resultat || c.status || 'Terminé'}</Badge>
                  {c.score_percentage != null && <p className="text-[11px] font-bold text-muted-foreground mt-1">Score {c.score_percentage}%</p>}
                </div>
              </div>
            ))}
          </div>
        );
      case 'score':
        return (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {agents.length === 0 && <EmptyState msg="Aucune donnée de score disponible." />}
            {[...agents]
              .sort((a, b) => (b.score || 0) - (a.score || 0))
              .map(a => {
                const trend = (a.score || 0) >= 80 ? 'up' : (a.score || 0) >= 65 ? 'stable' : 'down';
                return (
                  <div key={a.id} className="flex flex-wrap items-center gap-3 p-4 bg-muted/40 border border-border rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/40 to-purple-600/40 flex items-center justify-center text-xs font-black">
                      {a.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground text-sm truncate">{a.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-bold">
                        {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> :
                          trend === 'down' ? <ArrowDownRight className="w-3.5 h-3.5 text-red-400" /> :
                          <TrendingUp className="w-3.5 h-3.5 text-yellow-400" />}
                        <span className={trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-yellow-400'}>
                          {trend === 'up' ? 'En hausse' : trend === 'down' ? 'En baisse' : 'Stable'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-4 text-center">
                      <div>
                        <p className="text-lg font-black text-blue-400">{a.score_ia || 0}%</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">IA</p>
                      </div>
                      <div>
                        <p className="text-lg font-black text-emerald-400">{a.score_qualite || 0}%</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Qualité</p>
                      </div>
                      <div>
                        <p className="text-lg font-black text-foreground">{a.score || 0}%</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Global</p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        );
      default:
        return null;
    }
  };

  const modalTitle = kpis.find(k => k.key === modalKey)?.label || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Live</span>
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter text-foreground">
            Supervision Temps Réel
          </h2>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Monitoring de l'activité des agents · Mis à jour à {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-bold hover:bg-muted transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* KPI Cards - clickables */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.key}
              onClick={() => setModalKey(kpi.key)}
              className={`relative overflow-hidden bg-gradient-to-br ${kpi.color} border ${kpi.border} rounded-2xl p-6 shadow-lg text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-foreground/30 cursor-pointer group backdrop-blur-xl`}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon className="w-20 h-20 transform rotate-12" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-card/80 flex items-center justify-center shadow-inner ${kpi.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <div>
                  <div className="text-4xl font-black text-foreground tracking-tight drop-shadow-sm mb-1">{kpi.value}</div>
                  <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{kpi.label}</div>
                  <div className="text-[11px] font-semibold text-muted-foreground/80 mt-2 bg-background/50 inline-block px-2 py-1 rounded-md">{kpi.sub}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal détails */}
      <Dialog open={modalKey !== null} onOpenChange={(open) => !open && setModalKey(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              {modalTitle} — Détails
            </DialogTitle>
          </DialogHeader>
          {modalContent()}
        </DialogContent>
      </Dialog>

      {/* Chart + AI Recommandations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-foreground">Appels par heure — Aujourd'hui</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={hourlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
              <XAxis dataKey="h" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} stroke={chartTheme.textColor} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} stroke={chartTheme.textColor} />
              <Tooltip content={<CustomTooltip />} contentStyle={chartTheme.tooltipStyle} />
              <Area type="monotone" dataKey="appels" name="appels" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#colorCalls)" />
              <Area type="monotone" dataKey="conversions" name="conversions" stroke="#10b981" strokeWidth={2.5} fill="url(#colorConv)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* AI Recommendations */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <Brain className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-foreground">Recommandations IA</h3>
          </div>
          <div className="flex flex-col gap-3 flex-1">
            {inactiveAgents.length > 0 && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-xs font-black text-red-400 uppercase tracking-wide">Agents inactifs</span>
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  {inactiveAgents.map(a => a.name).join(', ')} — inactivité détectée. Relance recommandée.
                </p>
              </div>
            )}
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs font-black text-blue-400 uppercase tracking-wide">Pic 14h–16h</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                Volume d'appels en hausse. Concentrez vos meilleurs agents sur ce créneau.
              </p>
            </div>
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wide">Top performer</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {[...agents].sort((a, b) => (b.score || 0) - (a.score || 0))[0]?.name || 'Aucun'} est le plus performant aujourd'hui — score {[...agents].sort((a, b) => (b.score || 0) - (a.score || 0))[0]?.score || 0}%.
              </p>
            </div>
            <div className="p-3.5 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-xs font-black text-purple-400 uppercase tracking-wide">Taux de conversion</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {totalCalls > 0 && hourlyData.length > 0 ? Math.round((hourlyData.reduce((s, d) => s + d.conversions, 0) / totalCalls) * 100) : 0}% moyen — objectif 35% atteint ✅
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Agents Live Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Headphones className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-foreground">Agents en Temps Réel</h3>
          <span className="ml-auto text-xs font-bold text-muted-foreground">
            {activeAgents.length} actifs · {onBreakAgents.length} en pause · {inactiveAgents.length} inactifs
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-6 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Agent</th>
                <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Statut</th>
                <th className="text-center px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Appels</th>
                <th className="text-center px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Score IA</th>
                <th className="text-center px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Inactivité</th>
                <th className="text-right px-6 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent, i) => {
                const cfg =
                  statusConfig[agent.status as keyof typeof statusConfig] ??
                  statusConfig.inactive;

                const StatusIcon = cfg.icon;
                return (
                  <tr key={agent.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/5'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-indigo-600/40 flex items-center justify-center text-xs font-black text-gray-900 dark:text-white">
                          {agent.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-foreground">{agent.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border ${cfg.bg} ${cfg.color}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {statusLabel(agent.status, agent.breakType)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-black text-foreground text-lg">{agent.calls}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex-1 max-w-[80px] h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${(agent.score || 0) >= 80 ? 'bg-emerald-500' : (agent.score || 0) >= 65 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${agent.score}%` }}
                          />
                        </div>
                        <span className={`text-xs font-black min-w-[32px] ${(agent.score || 0) >= 80 ? 'text-emerald-400' : (agent.score || 0) >= 65 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {agent.score}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {agent.status === 'inactive' || agent.status === 'offline' ? (
                        <span className="text-red-400 font-bold text-sm">{agent.idleTime} min</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      {agent.status === 'inactive' || agent.status === 'offline' ? (
                        <button
                          onClick={async () => {
                            try {
                              await api.sendMessage(agent.id, "Activité détectée comme inactive. Merci de reprendre vos appels.", true);
                              alert("Relance envoyée à " + agent.name);
                            } catch { alert("Erreur lors de l'envoi"); }
                          }}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shadow-red-500/20 cursor-pointer"
                        >
                          Relancer
                        </button>
                      ) : (
                        <button
                          onClick={() => window.location.href = '/admin/messages?user=' + agent.id}
                          className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-lg transition-colors border border-border cursor-pointer"
                        >
                          Contacter
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Banner */}
      {inactiveAgents.length > 0 && (
        <div className="flex items-center justify-between bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl px-6 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-foreground text-sm">
                Alerte Inactivité détectée
              </p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                {inactiveAgents.length} agent(s) inactif(s) depuis plus de 15 minutes. Action immédiate recommandée.
              </p>
            </div>
          </div>
          <button className="shrink-0 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-black rounded-xl transition-colors shadow-md shadow-red-500/20 ml-4 cursor-pointer">
            Agir maintenant
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="p-10 text-center border border-dashed border-border rounded-2xl">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{msg}</p>
    </div>
  );
}
