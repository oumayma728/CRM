import React, { useState, useEffect, useCallback } from 'react';
import { Phone, PhoneOff, Search, History, TrendingUp, Users, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import api from '../../../services/api';

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function formatCallDate(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateGroup(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function CallWorkspace() {
  const [calls, setCalls] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/calls', { params: { limit: 100 } }),
      api.get('/calls/stats'),
    ]).then(([callsRes, statsRes]) => {
      setCalls(callsRes.data.calls || []);
      setStats(statsRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filteredCalls = calls.filter((call: any) => {
    const q = searchQuery.toLowerCase();
    return !q || call.agentName?.toLowerCase().includes(q) || call.clientName?.toLowerCase().includes(q);
  });

  const groupedCalls: Record<string, any[]> = {};
  filteredCalls.forEach((call: any) => {
    const key = new Date(call.dateHeure).toDateString();
    if (!groupedCalls[key]) groupedCalls[key] = [];
    groupedCalls[key].push(call);
  });

  const sortedGroups = Object.entries(groupedCalls).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-primary pl-6">
        <h1 className="text-2xl font-bold">Centre d'appels</h1>
        <p className="text-muted-foreground text-sm mt-1">Historique des appels des agents</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total appels', value: stats?.totalCalls || 0, icon: Phone, color: 'text-primary' },
          { label: 'Durée moyenne', value: stats?.avgDuration ? formatDuration(stats.avgDuration) : '--', icon: Clock, color: 'text-emerald-500' },
          { label: 'Agents actifs', value: new Set(calls.map((c: any) => c.agentName)).size, icon: Users, color: 'text-blue-500' },
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
        <div className="p-4 border-b border-border flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Rechercher par agent, client..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>

        <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Chargement...</div>
          ) : sortedGroups.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <History className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Aucun appel trouvé</p>
            </div>
          ) : sortedGroups.map(([dateKey, groupCalls]) => (
            <div key={dateKey}>
              <div className="sticky top-0 px-4 py-2 bg-card/95 backdrop-blur-sm border-b border-border">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {formatDateGroup(dateKey)} ({groupCalls.length})
                </span>
              </div>
              {groupCalls.map((call: any) => (
                <div key={call.id} className="px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10 border border-blue-500/30">
                      <ArrowUpRight className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{call.clientName || call.agentName || 'Inconnu'}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatCallDate(call.dateHeure)}</span>
                        <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40" />
                        <span>{formatDuration(call.dureeSecondes)}</span>
                        <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40" />
                        <span>{call.agentName}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      call.qualification?.includes('RENDEZ_VOUS') ? 'bg-emerald-500/10 text-emerald-500' :
                      call.qualification?.includes('REFUS') ? 'bg-red-500/10 text-red-500' :
                      'bg-muted text-muted-foreground'
                    }`}>{call.qualification || '--'}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
