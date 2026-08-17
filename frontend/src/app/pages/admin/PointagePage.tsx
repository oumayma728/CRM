import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Clock, UserCheck, UserX, Coffee, Search, RefreshCw,
  ChevronLeft, ChevronRight, PlayCircle, WifiOff,
  Timer, DoorOpen, DoorClosed, CalendarDays, History
} from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';

interface TeamAgent {
  user_id: number;
  user_name: string;
  user_role: string;
  status: string;
  clock_in?: string;
  work_duration_minutes?: number;
  current_break_type?: string;
  current_break_start?: string;
  total_break_minutes?: number;
}

interface HistoryRecord {
  id: number;
  user_id: number;
  user_name: string;
  date: string;
  clock_in: string;
  clock_out?: string;
  status: string;
  breaks?: { type: string; start_time: string; end_time?: string; duration_minutes: number }[];
}

const PAGE_SIZE = 10;

const formatTime = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (minutes?: number) => {
  if (minutes == null || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}` : `${m} min`;
};

const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'active')
    return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"><PlayCircle className="w-3 h-3 mr-1" /> EN POSTE</Badge>;
  if (status === 'break')
    return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30"><Coffee className="w-3 h-3 mr-1" /> PAUSE</Badge>;
  return <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/30"><WifiOff className="w-3 h-3 mr-1" /> HORS LIGNE</Badge>;
};

export default function PointagePage() {
  const [liveAgents, setLiveAgents] = useState<TeamAgent[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Recherche & filtres
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [detailRes, reportRes] = await Promise.allSettled([
        api.getAttendanceTeamDetail(),
        api.getAttendanceReport(),
      ]);
      if (detailRes.status === 'fulfilled') setLiveAgents(Array.isArray(detailRes.value) ? detailRes.value : []);
      if (reportRes.status === 'fulfilled') setHistory(Array.isArray(reportRes.value) ? reportRes.value : []);
    } catch (err) {
      console.error('Pointage fetch error:', err);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const present = liveAgents.filter(a => a.status === 'active' || a.status === 'break');
  const onBreak = liveAgents.filter(a => a.status === 'break');
  const absent = liveAgents.filter(a => a.status !== 'active' && a.status !== 'break');

  const filteredHistory = useMemo(() => {
    return history
      .filter(h => {
        if (search && !h.user_name?.toLowerCase().includes(search.toLowerCase())) return false;
        if (statusFilter !== 'all' && h.status !== statusFilter) return false;
        if (dateFilter) {
          const d = new Date(h.date);
          const f = new Date(dateFilter);
          if (d.toDateString() !== f.toDateString()) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.clock_in).getTime() - new Date(a.clock_in).getTime());
  }, [history, search, statusFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredHistory.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, statusFilter, dateFilter]);

  const kpis = [
    {
      icon: UserCheck, label: 'Agents Présents', value: present.length,
      color: 'from-emerald-500/20 to-emerald-600/5', iconColor: 'text-emerald-400', border: 'border-emerald-500/20',
    },
    {
      icon: Coffee, label: 'Agents en Pause', value: onBreak.length,
      color: 'from-yellow-500/20 to-yellow-600/5', iconColor: 'text-yellow-400', border: 'border-yellow-500/20',
    },
    {
      icon: UserX, label: 'Agents Absents', value: absent.length,
      color: 'from-red-500/20 to-red-600/5', iconColor: 'text-red-400', border: 'border-red-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">En direct</span>
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter text-foreground">
            Pointage
          </h2>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Suivi des présences · Mis à jour à {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className={`relative overflow-hidden bg-gradient-to-br ${kpi.color} border ${kpi.border} rounded-2xl p-5 shadow-sm`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-card/60 flex items-center justify-center shadow-inner ${kpi.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-foreground">{kpi.value}</div>
              <div className="text-xs font-bold text-muted-foreground mt-0.5">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* Pointage en direct */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-foreground">Pointage en Direct</h3>
          <span className="ml-auto text-xs font-bold text-muted-foreground">
            {present.length} présents · {onBreak.length} en pause · {absent.length} absents
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-6 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Agent</th>
                <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Arrivée</th>
                <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Sortie</th>
                <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Durée</th>
                <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Pause</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && liveAgents.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : liveAgents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aucune donnée de pointage disponible</p>
                  </td>
                </tr>
              ) : liveAgents.map((agent) => (
                <tr key={agent.user_id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-indigo-600/40 flex items-center justify-center text-xs font-black">
                        {agent.user_name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-foreground">{agent.user_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={agent.status} /></td>
                  <td className="px-4 py-4 text-xs font-semibold text-muted-foreground tabular-nums">
                    <span className="inline-flex items-center gap-1.5"><DoorOpen className="w-3.5 h-3.5" />{formatTime(agent.clock_in)}</span>
                  </td>
                  <td className="px-4 py-4 text-xs font-semibold text-muted-foreground tabular-nums">
                    <span className="inline-flex items-center gap-1.5"><DoorClosed className="w-3.5 h-3.5" />—</span>
                  </td>
                  <td className="px-4 py-4 text-xs font-mono font-bold text-foreground tabular-nums">
                    <span className="inline-flex items-center gap-1.5"><Timer className="w-3.5 h-3.5" />{formatDuration(agent.work_duration_minutes)}</span>
                  </td>
                  <td className="px-4 py-4 text-xs font-mono text-amber-400/80 tabular-nums">
                    {agent.total_break_minutes != null ? `${Math.floor(agent.total_break_minutes)} min` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historique du pointage */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-foreground">Historique du Pointage</h3>
        </div>

        {/* Filtres */}
        <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un agent..."
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">En poste</option>
            <option value="break">En pause</option>
            <option value="offline">Hors ligne</option>
          </select>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-6 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Agent</th>
                <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Date</th>
                <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Arrivée</th>
                <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Sortie</th>
                <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Pause</th>
                <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Statut</th>
                <th className="text-right px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && filteredHistory.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Aucun enregistrement trouvé{search || statusFilter !== 'all' || dateFilter ? ' pour ces filtres' : ''}
                    </p>
                  </td>
                </tr>
              ) : pageItems.map((h) => (
                <tr key={h.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-indigo-600/40 flex items-center justify-center text-xs font-black">
                        {h.user_name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-foreground">{h.user_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs font-semibold text-muted-foreground">
                    {new Date(h.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-4 text-xs font-semibold text-foreground tabular-nums">{formatTime(h.clock_in)}</td>
                  <td className="px-4 py-4 text-xs font-semibold text-foreground tabular-nums">{formatTime(h.clock_out)}</td>
                  <td className="px-4 py-4 text-xs font-mono text-amber-400/80 tabular-nums">
                    {h.breaks && h.breaks.length > 0
                      ? h.breaks.map(b => `${b.type} ${b.duration_minutes}min`).join(' · ')
                      : '—'}
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={h.status} /></td>
                  <td className="px-4 py-4 text-right">
                    <button className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg text-xs font-bold transition-all shadow-sm">
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs font-semibold text-muted-foreground">
            {filteredHistory.length} enregistrement(s) — page {safePage}/{totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, safePage - 1))}
              disabled={safePage <= 1}
              className="inline-flex items-center gap-1 px-3 py-2 bg-muted/40 hover:bg-muted/70 border border-border rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Précédent
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, safePage + 1))}
              disabled={safePage >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-2 bg-muted/40 hover:bg-muted/70 border border-border rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Suivant <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
