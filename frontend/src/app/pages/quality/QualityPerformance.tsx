import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, ChevronDown, Phone, CalendarCheck, Target, ShieldCheck, Clock, Timer } from 'lucide-react';
import { useChartTheme } from '../../hooks/useChartTheme';
import { fetchAgents, fetchAgentPerformance, Agent, AgentPerformance } from '../../services/quality';

export default function QualityPerformance() {
  const chartTheme = useChartTheme();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | undefined>(undefined);
  const [performance, setPerformance] = useState<AgentPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const data = await fetchAgents();
        setAgents(data);
        if (data.length > 0) setSelectedAgentId(data[0].id);
      } catch (e) {
        console.error('Failed to fetch agents', e);
      } finally {
        setLoading(false);
      }
    };
    loadAgents();
  }, []);

  useEffect(() => {
    if (!selectedAgentId) return;
    const loadPerf = async () => {
      setFetching(true);
      try {
        const data = await fetchAgentPerformance(selectedAgentId);
        setPerformance(data);
      } catch (e) {
        console.error('Failed to fetch performance', e);
        setPerformance(null);
      } finally {
        setFetching(false);
      }
    };
    loadPerf();
  }, [selectedAgentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const cm = performance?.current_month;
  const dailyData = cm
    ? cm.daily_performance.map((value, index) => ({
        jour: `J${index + 1}`,
        rdv: value,
      }))
    : [];

  const kpis = cm
    ? [
        { label: 'Appels', value: cm.calls.toLocaleString(), icon: Phone, from: 'from-blue-500', to: 'to-blue-700', shadow: 'shadow-blue-500/20' },
        { label: 'Rendez-vous', value: cm.appointments.toLocaleString(), icon: CalendarCheck, from: 'from-emerald-500', to: 'to-emerald-700', shadow: 'shadow-emerald-500/20' },
        { label: 'Taux de conversion', value: `${cm.conversion_rate}%`, icon: Target, from: 'from-amber-500', to: 'to-amber-700', shadow: 'shadow-amber-500/20' },
        { label: 'Score qualité', value: `${cm.quality_score}%`, icon: ShieldCheck, from: 'from-indigo-500', to: 'to-indigo-700', shadow: 'shadow-indigo-500/20' },
        { label: "Taux d'assiduité", value: `${cm.attendance_rate}%`, icon: Clock, from: 'from-purple-500', to: 'to-purple-700', shadow: 'shadow-purple-500/20' },
        { label: 'Durée moy. appels', value: `${cm.avg_call_duration}s`, icon: Timer, from: 'from-rose-500', to: 'to-rose-700', shadow: 'shadow-rose-500/20' },
      ]
    : [];

  return (
    <div className="space-y-8 p-6 animate-in fade-in duration-700">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-emerald-400" />
        <h2 className="text-xl font-bold text-foreground">Performance Mensuelle</h2>
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm font-bold uppercase text-muted-foreground whitespace-nowrap">Agent</label>
        <div className="relative w-64">
          <select
            value={selectedAgentId ?? ''}
            onChange={(e) => setSelectedAgentId(Number(e.target.value))}
            className="w-full bg-background/50 border border-border rounded-2xl p-3 text-sm font-medium text-foreground appearance-none focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
          >
            <option value="" disabled>
              Choisir un agent...
            </option>
            {agents.map((agent, idx) => (
              <option key={`agent-${agent.id}-${idx}`} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {fetching && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Chargement des données...</p>
          </div>
        </div>
      )}

      {cm && !fetching && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {kpis.map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={kpi.label}
                  className={`bg-gradient-to-br ${kpi.from} ${kpi.to} rounded-3xl p-5 text-white shadow-xl ${kpi.shadow} border-b-4 border-black/10`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h3 className="text-[9px] font-black uppercase tracking-widest opacity-80 italic">{kpi.label}</h3>
                  <p className="text-3xl font-black italic tracking-tighter mt-1">{kpi.value}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-card border border-border p-6 rounded-3xl">
            <div className="flex items-center gap-3 mb-6">
              <CalendarCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-black text-[10px] uppercase tracking-widest text-foreground">
                Évolution journalière — Mois courant
              </h3>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRdv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                  <XAxis dataKey="jour" stroke={chartTheme.textColor} fontSize={9} axisLine={false} tickLine={false} />
                  <YAxis stroke={chartTheme.textColor} fontSize={9} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTheme.tooltipStyle} />
                  <Area type="monotone" dataKey="rdv" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRdv)" name="RDV" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
