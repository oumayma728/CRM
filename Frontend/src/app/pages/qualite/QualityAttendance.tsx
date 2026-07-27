import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Users, Search, RefreshCw, UserCheck, UserX, AlertCircle } from 'lucide-react';
import api from '../../../services/api';

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function QualityAttendance() {
  const [report, setReport] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'arrivee' | 'retard'>('status');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await api.get('/admin/pointage', { params: { date: new Date().toISOString().split('T')[0] } });
      const data = res.data;
      if (data) {
        setSummary({ presents: data.presents, total: data.totalAgents, retards: data.retards });
        setReport(data.details || []);
      }
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Attendance fetch error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const onlineCount = report.filter(r => r.statut === "À l'heure" || r.statut === "Présent").length;
  const breakCount = report.filter(r => r.statut === "En pause" || r.pauses?.includes('pause')).length;
  const offlineCount = report.filter(r => r.depart !== 'En cours' && r.arrivee === '--').length;

  const filtered = report
    .filter(r => (r.agentNom || '').toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'name') return dir * (a.agentNom || '').localeCompare(b.agentNom || '');
      if (sortBy === 'arrivee') return dir * (a.arrivee || '').localeCompare(b.arrivee || '');
      if (sortBy === 'retard') return dir * ((a.retardMinutes || 0) - (b.retardMinutes || 0));
      return dir * ((a.statut || '').localeCompare(b.statut || ''));
    });

  const toggleSort = (col: 'name' | 'status' | 'arrivee' | 'retard') => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-primary pl-6">
        <div className="flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Supervision Pointage</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          Dernière MAJ: {lastRefresh.toLocaleTimeString('fr-FR')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Présents', value: summary?.presents ?? 0, icon: UserCheck, color: 'text-emerald-500' },
          { label: 'Retards', value: summary?.retards ?? 0, icon: AlertCircle, color: 'text-amber-500' },
          { label: 'Hors ligne', value: offlineCount, icon: UserX, color: 'text-slate-400' },
          { label: 'Total agents', value: summary?.total ?? 0, icon: Users, color: 'text-primary' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-card rounded-lg border border-border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                <p className="text-2xl font-bold">{kpi.value}</p>
              </div>
              <kpi.icon className={`w-6 h-6 opacity-40 ${kpi.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> État des Agents
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text" placeholder="Rechercher..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-48 pl-9 pr-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <button onClick={fetchAttendance} className="p-2 bg-muted border border-border rounded-lg hover:bg-accent">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                {[
                  { key: 'name', label: 'Agent' },
                  { key: 'arrivee', label: 'Arrivée' },
                  { key: 'status', label: 'Statut' },
                  { label: 'Prises' },
                  { key: 'retard', label: 'Temps productif' },
                  { label: 'Départ' },
                  { label: 'Retard' },
                ].map(col => (
                  <th
                    key={col.key || col.label}
                    onClick={col.key ? () => toggleSort(col.key as any) : undefined}
                    className={`text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${col.key ? 'cursor-pointer hover:text-foreground' : ''}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((agent, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${agent.estEnRetard ? 'bg-red-500' : agent.arrivee !== '--' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      <span className="font-medium">{agent.agentNom}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{agent.arrivee}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      agent.estEnRetard ? 'bg-red-500/10 text-red-500' :
                      agent.statut === 'Présent' || agent.statut === "À l'heure" ? 'bg-emerald-500/10 text-emerald-500' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {agent.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{agent.pauses}</td>
                  <td className="px-4 py-3 text-sm font-mono">{agent.tempsProductif}</td>
                  <td className="px-4 py-3 text-sm">{agent.depart}</td>
                  <td className="px-4 py-3">
                    {agent.retardMinutes > 0 ? (
                      <span className="text-amber-500 text-sm font-medium">{agent.retardMinutes} min</span>
                    ) : <span className="text-muted-foreground text-sm">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && !loading && (
            <div className="p-12 text-center text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Aucun agent trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
