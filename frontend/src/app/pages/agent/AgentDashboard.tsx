import React from 'react';
import { Phone, CheckCircle, Clock, TrendingUp, Save } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useChartTheme } from '../../hooks/useChartTheme';
import api from '../../services/api';
import toast from 'react-hot-toast';

const BREAK_OPTIONS = [
  { id: 'cafe', label: 'Pause Café', color: 'amber' },
  { id: 'dejeuner', label: 'Pause Déj (1h)', color: 'amber' },
  { id: 'reunion', label: 'Réunion', color: 'blue' },
  { id: 'personnelle', label: 'Permission', color: 'rose' },
] as const;

const BREAK_LABELS: Record<string, string> = {
  cafe: 'Café',
  dejeuner: 'Déjeuner',
  priere: 'Prière',
  technique: 'Technique',
  personnelle: 'Personnelle',
  reunion: 'Réunion',
  formation: 'Formation',
  Permission: 'Permission',
};

const PAUSE_BG: Record<string, string> = {
  amber: 'bg-amber-500/10',
  orange: 'bg-orange-500/10',
  emerald: 'bg-emerald-500/10',
  blue: 'bg-blue-500/10',
  purple: 'bg-purple-500/10',
  indigo: 'bg-indigo-500/10',
  teal: 'bg-teal-500/10',
  rose: 'bg-rose-500/10',
};

const PAUSE_TEXT: Record<string, string> = {
  amber: 'text-amber-400',
  orange: 'text-orange-400',
  emerald: 'text-emerald-400',
  blue: 'text-blue-400',
  purple: 'text-purple-400',
  indigo: 'text-indigo-400',
  teal: 'text-teal-400',
  rose: 'text-rose-400',
};

const PAUSE_HOVER_BG: Record<string, string> = {
  amber: 'hover:bg-amber-500',
  orange: 'hover:bg-orange-500',
  emerald: 'hover:bg-emerald-500',
  blue: 'hover:bg-blue-500',
  purple: 'hover:bg-purple-500',
  indigo: 'hover:bg-indigo-500',
  teal: 'hover:bg-teal-500',
  rose: 'hover:bg-rose-500',
};

const formatElapsed = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

function AttendanceManager() {
  const [status, setStatus] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [pauseSeconds, setPauseSeconds] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPauseSeconds(0);
  };

  const startTimer = (startMs: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
    setPauseSeconds(elapsed);
    timerRef.current = setInterval(() => {
      setPauseSeconds(prev => prev + 1);
    }, 1000);
  };

  const applyServerStatus = (data: any) => {
  if (!data) return;

  // Convert active -> online
  if (data.status === "active") {
    data.status = "online";
  }

  setStatus(data);

  if (data.status === "break" && data.start_time) {
    startTimer(new Date(data.start_time).getTime());
  } else {
    stopTimer();
  }
};

  const fetchStatus = async () => {
    try {
      const data = await api.getAttendanceStatus();
      applyServerStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStatus();
    pollingRef.current = setInterval(fetchStatus, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleClockIn = async () => {
    try {
      await api.clockIn();
      toast.success('Pointage Entrée réussi !');
      fetchStatus();
    } catch (e) {
      toast.error('Erreur de pointage');
    }
  };

  const handleClockOut = async () => {
    try {
      await api.clockOut();
      toast.success('Pointage Sortie réussi !');
      fetchStatus();
    } catch (e) {
      toast.error('Erreur de pointage');
    }
  };

  const handleStartBreak = async (type: string) => {
    const prevStatus = status;
    setStatus({ ...status, status: 'break', break_type: type });
    startTimer(Date.now());
    try {
      const res = await api.startBreak(type);
      if (res?.success === false) {
        setStatus(prevStatus);
        stopTimer();
        toast.error(res?.message || 'Erreur pause');
        return;
      }
      toast.success(`Pause ${BREAK_LABELS[type] || type} démarrée`);
      fetchStatus();
    } catch (e) {
      setStatus(prevStatus);
      stopTimer();
      toast.error('Erreur pause');
    }
  };

  const handleEndBreak = async () => {
    try {
      await api.endBreak();
    } catch (e) {
      // proceed anyway — API may have already ended break
    }
    toast.success('Fin de pause — Reprise du poste');
    stopTimer();
    setStatus({ ...status, status: 'online', break_type: null });
    try {
      const data = await api.getAttendanceStatus();
      applyServerStatus(data);
    } catch (_) {}
  };

  if (loading) return null;

  const breakLabel = BREAK_LABELS[status?.break_type] || status?.break_type || '';

  return (
    <div className="glass-card p-6 mb-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
            status?.status === 'online' || status?.status === 'active' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
            status?.status === 'break' ? 'bg-amber-500 text-white shadow-amber-500/20' :
            'bg-muted-foreground text-background shadow-muted-foreground/20'
          }`}>
            <Clock className={`w-7 h-7 ${status?.status === 'online' || status?.status === 'active'? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight">Mon <span className="text-gradient-primary">Pointage</span></h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Statut : <span className={status?.status === 'online' || status?.status === 'active' ? 'text-emerald-500' : status?.status === 'break' ? 'text-amber-500' : 'text-muted-foreground'}>
                {status?.status === 'online' || status?.status === 'active' ? 'EN POSTE' : status?.status === 'break' ? `EN PAUSE (${breakLabel})` : 'HORS LIGNE'}
              </span>
            </p>
            {status?.status === 'break' && (
              <p className="text-lg font-mono font-bold text-amber-400 mt-1 tabular-nums">
                {formatElapsed(pauseSeconds)}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!status || status?.status === 'offline' ? (
            <button onClick={handleClockIn} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all">
              Pointer Entrée
            </button>
          ) : (
            <>
              {status?.status === 'online' || status?.status === 'active' ? (
                <div className="flex flex-wrap gap-2">
                  {BREAK_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleStartBreak(opt.id)}
                      className={`px-4 py-3 ${PAUSE_BG[opt.color]} border border-transparent ${PAUSE_TEXT[opt.color]} rounded-2xl font-black text-[10px] uppercase tracking-widest ${PAUSE_HOVER_BG[opt.color]} hover:text-white transition-all`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button onClick={handleClockOut} className="px-6 py-3 bg-muted-foreground text-background rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:opacity-90 transition-all">Terminer Journée</button>
                </div>
              ) : (
                <button onClick={handleEndBreak} className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                  Reprendre le poste
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AgentDashboard() {
  const chartTheme = useChartTheme();
  const [saving, setSaving] = React.useState(false);
  const [stats, setStats] = React.useState<any>(null);
  const [recentCalls, setRecentCalls] = React.useState<any[]>([]);
  const [savedData, setSavedData] = React.useState<any>(null);

  React.useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAll = async () => {
    try {
      const [statsRes, callsRes, savedRes] = await Promise.allSettled([
        api.getStats(),
        api.getCalls({ limit: 5, offset: 0 }),
        api.getAgentSavedData(),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (callsRes.status === 'fulfilled') setRecentCalls(callsRes.value.calls || []);
      if (savedRes.status === 'fulfilled') setSavedData(savedRes.value);
    } catch (e) {
      console.error('Error loading agent dashboard:', e);
    }
  };

  const totalCalls = stats?.total_calls || 0;
  const avgScore = stats?.avg_score || 0;
  const positiveCalls = stats?.sentiment_distribution?.positive || 0;
  const conversionRate = totalCalls > 0 ? ((positiveCalls / totalCalls) * 100).toFixed(1) : '0.0';
  const workDuration = savedData?.calls_count
    ? `${Math.floor((savedData.calls_count * 6.4) / 60)}H ${Math.round((savedData.calls_count * 6.4) % 60)}M`
    : '0H 0M';

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveAgentData({
        notes: '',
        calls_count: totalCalls,
        conversions_count: positiveCalls,
        rdv_count: 0,
      });
      toast.success('Données sauvegardées !');
      loadAll();
    } catch (e) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const hourlyData = React.useMemo(() => {
    if (!recentCalls.length) return [];
    const buckets: Record<string, { appels: number; conversions: number }> = {};
    for (let h = 8; h <= 18; h++) {
      const key = `${h.toString().padStart(2, '0')}:00`;
      buckets[key] = { appels: 0, conversions: 0 };
    }
    recentCalls.forEach((c: any) => {
      const d = c.call_date ? new Date(c.call_date) : null;
      if (d) {
        const key = `${d.getHours().toString().padStart(2, '0')}:00`;
        if (buckets[key]) {
          buckets[key].appels++;
          if (c.sentiment === 'positive' || c.performance === 'bon') buckets[key].conversions++;
        }
      }
    });
    return Object.entries(buckets).map(([hour, data]) => ({ hour, ...data }));
  }, [recentCalls]);

  const callStatusMap: Record<string, { bg: string; text: string }> = {
    Converti: { bg: 'bg-success/10', text: 'text-success' },
    'Refusé': { bg: 'bg-destructive/10', text: 'text-destructive' },
    Rappel: { bg: 'bg-warning/10', text: 'text-warning' },
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground">Mon <span className="text-gradient-primary">Dashboard</span></h2>
          <p className="text-sm text-muted-foreground mt-1">Votre activité du jour en un coup d'œil</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/25 hover:-translate-y-[1px] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

        <AttendanceManager />

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
          <div className="relative overflow-hidden rounded-3xl p-6 group bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white shadow-xl shadow-indigo-600/30 ring-1 ring-white/15 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-600/40 hover:brightness-110 cursor-default animate-fade-in-up">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-cyan-300/30 to-transparent opacity-70 group-hover:scale-150 transition-transform duration-700 blur-2xl" />
            <div className="relative flex items-center justify-between mb-5">
              <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl ring-1 ring-white/20 shadow-inner shadow-lg shadow-white/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Phone className="w-5 h-5 text-white drop-shadow-md" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Quotidien</span>
            </div>
            <h3 className="text-sm font-black uppercase tracking-tighter text-white/90">Appels du jour</h3>
            <p className="text-4xl font-black tracking-tighter mt-1.5 text-white drop-shadow-md tabular-nums">{totalCalls}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 ring-1 ring-white/20 text-[10px] font-black text-white">
              <TrendingUp className="w-3 h-3" /> Film direct
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl p-6 group bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30 ring-1 ring-white/15 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-emerald-500/40 cursor-pointer animate-fade-in-up">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-teal-300/30 to-transparent opacity-70 group-hover:scale-150 transition-transform duration-700 blur-2xl" />
            <div className="relative flex items-center justify-between mb-4">
              <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl ring-1 ring-white/20 shadow-inner transition-transform duration-300 group-hover:scale-110">
                <CheckCircle className="w-5 h-5 text-white drop-shadow-md" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-white/70">Réussite</span>
            </div>
            <h3 className="text-sm font-black uppercase tracking-tighter text-white/90">Conversions</h3>
            <p className="text-4xl font-black tracking-tight mt-1 text-white drop-shadow-md tabular-nums">{positiveCalls}</p>
            <p className="text-[10px] font-black uppercase mt-3 inline-flex items-center gap-1 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full ring-1 ring-white/20 text-white">
              TAUX: {conversionRate}%
            </p>
          </div>

          <div className="relative overflow-hidden rounded-3xl p-6 group bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 text-white shadow-xl shadow-amber-500/30 ring-1 ring-white/15 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-amber-500/40 cursor-pointer animate-fade-in-up">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-orange-300/30 to-transparent opacity-70 group-hover:scale-150 transition-transform duration-700 blur-2xl" />
            <div className="relative flex items-center justify-between mb-4">
              <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl ring-1 ring-white/20 shadow-inner transition-transform duration-300 group-hover:scale-110">
                <Clock className="w-5 h-5 text-white drop-shadow-md" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-white/70">Actif</span>
            </div>
            <h3 className="text-sm font-black uppercase tracking-tighter text-white/90">Temps productif</h3>
            <p className="text-3xl font-black tracking-tight mt-1.5 text-white drop-shadow-md tabular-nums">{workDuration}</p>
          </div>

          <div className="relative overflow-hidden rounded-3xl p-6 group bg-gradient-to-br from-rose-400 via-rose-500 to-pink-600 text-white shadow-xl shadow-rose-500/30 ring-1 ring-white/15 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-rose-500/40 cursor-pointer animate-fade-in-up">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-pink-300/30 to-transparent opacity-70 group-hover:scale-150 transition-transform duration-700 blur-2xl" />
            <div className="relative flex items-center justify-between mb-4">
              <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl ring-1 ring-white/20 shadow-inner transition-transform duration-300 group-hover:scale-110">
                <TrendingUp className="w-5 h-5 text-white drop-shadow-md" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-white/70">Niveau</span>
            </div>
            <h3 className="text-sm font-black uppercase tracking-tighter text-white/90">Score Qualité</h3>
            <p className="text-4xl font-black tracking-tighter mt-1.5 text-white drop-shadow-md tabular-nums">{avgScore > 0 ? `${Math.round(avgScore)}/100` : '—'}</p>
          </div>
        </div>

        {hourlyData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-foreground">Performance du jour</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="colorAppels" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                  <XAxis dataKey="hour" stroke={chartTheme.textColor} tick={{ fontSize: 10, fontWeight: 700, fill: chartTheme.textColor }} />
                  <YAxis stroke={chartTheme.textColor} tick={{ fontSize: 10, fontWeight: 700, fill: chartTheme.textColor }} />
                  <Tooltip contentStyle={chartTheme.tooltipStyle} />
                  <Legend iconType="circle" />
                  <Area type="monotone" dataKey="appels" stroke="#6366f1" strokeWidth={3} fill="url(#colorAppels)" name="Appels" />
                  <Area type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={3} fill="url(#colorConversions)" name="Conversions" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-6">
              <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-foreground">Taux de conversion par heure</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                  <XAxis dataKey="hour" stroke={chartTheme.textColor} tick={{ fontSize: 10, fontWeight: 700, fill: chartTheme.textColor }} />
                  <YAxis stroke={chartTheme.textColor} tick={{ fontSize: 10, fontWeight: 700, fill: chartTheme.textColor }} />
                  <Tooltip contentStyle={chartTheme.tooltipStyle} />
                  <Legend />
                  <Bar dataKey="appels" fill="var(--color-chart-1)" name="Appels" />
                  <Bar dataKey="conversions" fill="var(--color-chart-4)" name="Conversions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Appels récents</h3>
            {recentCalls.length > 0 && (
              <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black tabular-nums">
                {recentCalls.length}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Agent</th>
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sentiment</th>
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Score</th>
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Performance</th>
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentCalls.length > 0 ? recentCalls.map((call: any) => {
                  const sentimentCfg = callStatusMap[call.sentiment] || callStatusMap['Rappel'];
                  return (
                    <tr key={call.call_id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-foreground">{call.agent_name || '—'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${sentimentCfg.bg} ${sentimentCfg.text}`}>
                          {call.sentiment || '—'}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">{call.score_percentage != null ? `${call.score_percentage}%` : '—'}</td>
                      <td className="p-4">{call.performance || '—'}</td>
                      <td className="p-4 text-muted-foreground">
                        {call.call_date ? new Date(call.call_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr key="empty-state">
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Aucun appel récent
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
