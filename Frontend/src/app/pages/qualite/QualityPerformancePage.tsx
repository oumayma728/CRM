import React, { useEffect, useState } from 'react';
import { TrendingUp, Phone, CalendarCheck, Target, ShieldCheck, Timer, ChevronDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../../services/api';

export default function QualityPerformancePage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [agentId, setAgentId] = useState<number | null>(null);
  const [perf, setPerf] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/qualite/agents')
      .then(r => {
        setAgents(r.data || []);
        if (r.data?.length > 0) setAgentId(r.data[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!agentId) return;
    api.get(`/performance/agent/${agentId}`)
      .then(r => setPerf(r.data))
      .catch(() => setPerf(null));
  }, [agentId]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const cm = perf?.current_month;
  const dailyData = cm?.daily_performance?.length
    ? cm.daily_performance.map((v: number, i: number) => ({ jour: `J${i+1}`, rdv: v }))
    : [];

  const kpis = cm ? [
    { label: 'Appels', value: cm.calls, icon: Phone, color: 'primary' },
    { label: 'Rendez-vous', value: cm.appointments, icon: CalendarCheck, color: 'success' },
    { label: 'Taux conversion', value: `${cm.conversion_rate}%`, icon: Target, color: 'warning' },
    { label: 'Score qualité', value: `${cm.quality_score}%`, icon: ShieldCheck, color: 'info' },
    { label: 'Durée moy.', value: `${cm.avg_call_duration}s`, icon: Timer, color: 'destructive' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-emerald-500 pl-6">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
            Performance <span className="text-emerald-500">Qualité</span>
          </h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1 opacity-70">Comparaison mois par mois</p>
        </div>
        <div className="relative">
          <select value={agentId ?? ''} onChange={e => setAgentId(Number(e.target.value))}
            className="px-4 py-2 pr-8 bg-card border border-border rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer">
            {agents.map((a: any) => (
              <option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {cm && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {kpis.map((kpi, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{kpi.label}</span>
                  <div className={`p-2 rounded-xl ${
                    kpi.color === 'primary' ? 'bg-indigo-500/10 text-indigo-500' :
                    kpi.color === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                    kpi.color === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                    kpi.color === 'info' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-rose-500/10 text-rose-500'
                  }`}>
                    <kpi.icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black tracking-tighter">{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Évolution journalière (mois courant)
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="rdvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="jour" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="rdv" stroke="#10b981" fill="url(#rdvGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
