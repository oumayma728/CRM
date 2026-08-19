import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, ChevronDown, Phone, CalendarCheck, Target, ShieldCheck, Clock, Timer } from 'lucide-react';
import api from '../../../services/api';

interface Agent { id: number; nom: string; prenom: string; }
interface MonthStats {
  calls: number; appointments: number; conversion_rate: number;
  quality_score: number; attendance_rate: number; avg_call_duration: number;
  daily_performance: number[];
}
interface AgentPerformance { current_month: MonthStats; }

const tooltipStyle = { backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' };

export default function QualityPerformance() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | undefined>(undefined);
  const [performance, setPerformance] = useState<AgentPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    api.get('/qualite/agents').then(res => {
      setAgents(res.data);
      if (res.data.length > 0) setSelectedAgentId(res.data[0].id);
    }).catch(err => console.error('Erreur chargement agents:', err)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedAgentId) return;
    setFetching(true);
    api.get(`/qualite/agent-performance/${selectedAgentId}`)
      .then(res => setPerformance(res.data))
      .catch(err => { console.error('Erreur chargement performance:', err); setPerformance(null); })
      .finally(() => setFetching(false));
  }, [selectedAgentId]);

  if (loading) return <div className="p-6 flex items-center justify-center h-64 text-muted-foreground">Chargement...</div>;

  const cm = performance?.current_month;
  const dailyData = cm ? cm.daily_performance.map((value, index) => ({ jour: `J${index + 1}`, rdv: value })) : [];

  const kpis = cm ? [
    { label: 'Appels', value: cm.calls.toLocaleString(), icon: Phone, grad: 'from-blue-500 to-blue-700', shadow: 'shadow-blue-500/20' },
    { label: 'Rendez-vous', value: cm.appointments.toLocaleString(), icon: CalendarCheck, grad: 'from-emerald-500 to-emerald-700', shadow: 'shadow-emerald-500/20' },
    { label: 'Taux de conversion', value: `${cm.conversion_rate}%`, icon: Target, grad: 'from-amber-500 to-amber-700', shadow: 'shadow-amber-500/20' },
    { label: 'Score qualité', value: `${cm.quality_score}%`, icon: ShieldCheck, grad: 'from-indigo-500 to-indigo-700', shadow: 'shadow-indigo-500/20' },
    { label: "Taux d'assiduité", value: `${cm.attendance_rate}%`, icon: Clock, grad: 'from-purple-500 to-purple-700', shadow: 'shadow-purple-500/20' },
    { label: 'Durée moy. appels', value: `${cm.avg_call_duration}s`, icon: Timer, grad: 'from-rose-500 to-rose-700', shadow: 'shadow-rose-500/20' },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-emerald-500" />
        <h1 className="text-xl font-bold text-foreground">Performance Mensuelle</h1>
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm font-bold uppercase text-muted-foreground whitespace-nowrap">Agent</label>
        <div className="relative w-64">
          <select
            value={selectedAgentId ?? ''}
            onChange={e => setSelectedAgentId(Number(e.target.value))}
            className="w-full bg-background border border-border rounded-xl p-3 text-sm font-medium text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            {agents.map(a => <option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {fetching && <div className="py-8 text-center text-muted-foreground text-sm">Chargement des données...</div>}

      {cm && !fetching && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {kpis.map(kpi => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className={`bg-gradient-to-br ${kpi.grad} rounded-2xl p-5 text-white shadow-lg ${kpi.shadow}`}>
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md w-fit mb-3">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest opacity-80">{kpi.label}</h3>
                  <p className="text-3xl font-black mt-1">{kpi.value}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-card border border-border p-6 rounded-xl">
            <h3 className="font-bold text-sm text-foreground mb-6 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-500" /> Évolution journalière — Mois courant
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRdvPerf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="jour" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="rdv" stroke="#10b981" strokeWidth={3} fill="url(#colorRdvPerf)" name="RDV" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
