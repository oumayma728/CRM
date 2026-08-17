import React, { useEffect, useState } from 'react';
import { TrendingUp, ChevronDown, ArrowUp, ArrowDown, Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
} from 'recharts';
import { useChartTheme } from '../../hooks/useChartTheme';
import { fetchAgents, fetchAgentPerformance, Agent, AgentPerformance } from '../../services/quality';

const fmt = (n: number) => n.toLocaleString();

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export default function AgentTrendPage() {
  const chartTheme = useChartTheme();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | undefined>(undefined);
  const [performance, setPerformance] = useState<AgentPerformance | null>(null);
  const [loading, setLoading] = useState(true);

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
      setLoading(true);
      try {
        const data = await fetchAgentPerformance(selectedAgentId);
        setPerformance(data);
      } catch (e) {
        console.error('Failed to fetch performance', e);
        setPerformance(null);
      } finally {
        setLoading(false);
      }
    };
    loadPerf();
  }, [selectedAgentId]);



  const variation = (current: number, previous: number) => {
    const diff = current - previous;
    const percent = previous === 0 ? 0 : (diff / previous) * 100;
    return { diff, percent };
  };

  const generateSummary = () => {
    if (!performance) return '';
    const { current_month, previous_month, agent_name } = performance;
    if (!current_month || !previous_month) return '';
    const callsVar = variation(current_month.calls, previous_month.calls);
    const convVar = variation(current_month.conversion_rate, previous_month.conversion_rate);
    const scoreVar = variation(current_month.quality_score, previous_month.quality_score);
    const rdvVar = variation(current_month.appointments, previous_month.appointments);

    return `${agent_name} : le volume d'appels a ${callsVar.percent >= 0 ? 'augmenté' : 'diminué'} de ${Math.abs(Math.round(callsVar.percent))}% (${fmt(previous_month.calls)} → ${fmt(current_month.calls)}). Les rendez-vous sont ${rdvVar.percent >= 0 ? 'en hausse' : 'en baisse'} de ${Math.abs(Math.round(rdvVar.percent))}%. Le taux de conversion est passé de ${previous_month.conversion_rate}% à ${current_month.conversion_rate}% (${convVar.percent >= 0 ? '+' : ''}${Math.round(convVar.percent)}%). Le score qualité ${scoreVar.percent >= 0 ? 'progression' : 'recule'} de ${Math.abs(Math.round(scoreVar.percent))}%.`;
  };

  if (loading && !performance) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">Chargement...</div>
    );
  }

  const current = performance?.current_month;
  const previous = performance?.previous_month;

  const kpiCards = current && previous ? [
    { label: 'Appels', curr: current.calls, prev: previous.calls },
    { label: 'Rendez‑vous', curr: current.appointments, prev: previous.appointments },
    { label: 'Taux de conversion', curr: current.conversion_rate, prev: previous.conversion_rate, isPct: true },
    { label: 'Durée moyenne', curr: current.avg_call_duration, prev: previous.avg_call_duration, suffix: 's' },
    { label: 'Score qualité', curr: current.quality_score, prev: previous.quality_score, isPct: true },
    { label: 'Présence', curr: current.attendance_rate, prev: previous.attendance_rate, isPct: true },
  ] : [];

  const monthlyBarData = current && previous ? [
    { name: 'Appels', 'Mois précédent': previous.calls, 'Mois actuel': current.calls },
    { name: 'Rdv', 'Mois précédent': previous.appointments, 'Mois actuel': current.appointments },
    { name: 'Conversion %', 'Mois précédent': previous.conversion_rate, 'Mois actuel': current.conversion_rate },
    { name: 'Qualité %', 'Mois précédent': previous.quality_score, 'Mois actuel': current.quality_score },
    { name: 'Présence %', 'Mois précédent': previous.attendance_rate, 'Mois actuel': current.attendance_rate },
  ] : [];

  const dailyData = current && previous
    ? current.daily_performance.map((val, idx) => ({
        jour: `J${idx + 1}`,
        'Mois actuel': val,
        'Mois précédent': previous.daily_performance[idx] ?? 0,
      }))
    : [];

  const trendScoreData = current && previous
    ? [
        { periode: 'Mois précédent', 'Score qualité': previous.quality_score, 'Conversion': previous.conversion_rate, 'Présence': previous.attendance_rate },
        { periode: 'Mois actuel', 'Score qualité': current.quality_score, 'Conversion': current.conversion_rate, 'Présence': current.attendance_rate },
      ]
    : [];

  return (
    <div className="space-y-8 p-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-amber-400" />
        <h2 className="text-xl font-bold text-foreground">Rendement mensuel</h2>
      </div>

      {/* Agent selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-bold uppercase text-muted-foreground whitespace-nowrap">Agent</label>
        <div className="relative w-64">
          <select
            value={selectedAgentId ?? ''}
            onChange={e => setSelectedAgentId(Number(e.target.value))}
            className="w-full bg-background/50 border border-border rounded-2xl p-3 text-sm font-medium text-foreground appearance-none focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
          >
            <option value="" disabled>Choisir un agent...</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
        {performance && (
          <span className="text-sm text-muted-foreground ml-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            {MONTH_NAMES[new Date().getMonth()]} vs {MONTH_NAMES[new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1]}
          </span>
        )}
      </div>

      {/* KPI cards with variation */}
      {current && previous && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kpiCards.map(item => {
            const { percent } = variation(item.curr, item.prev);
            const positive = percent >= 0;
            const displayVal = item.isPct ? `${item.curr}%` : `${fmt(item.curr)}${item.suffix ?? ''}`;
            const prevVal = item.isPct ? `${item.prev}%` : `${fmt(item.prev)}${item.suffix ?? ''}`;
            return (
              <div key={item.label} className="bg-card border border-border p-4 rounded-2xl shadow-lg">
                <h3 className="text-xs font-bold uppercase text-muted-foreground mb-1">{item.label}</h3>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-black text-foreground">{displayVal}</p>
                    <p className="text-xs text-muted-foreground mt-1">Précédent : {prevVal}</p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-background/50 border border-border">
                    {positive ? (
                      <ArrowUp className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`text-sm font-bold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {positive ? '+' : ''}{percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bar chart: mois précédent vs mois actuel */}
      {monthlyBarData.length > 0 && (
        <div className="bg-card border border-border p-6 rounded-3xl">
          <h3 className="mb-4 text-sm font-bold uppercase text-muted-foreground">Comparaison mensuelle</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyBarData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
              <XAxis dataKey="name" stroke={chartTheme.axisColor} />
              <YAxis stroke={chartTheme.axisColor} />
              <Tooltip contentStyle={chartTheme.tooltipStyle} />
              <Legend />
              <Bar dataKey="Mois précédent" fill="#64748B" />
              <Bar dataKey="Mois actuel" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Area chart: RDV journaliers */}
      {dailyData.length > 0 && (
        <div className="bg-card border border-border p-6 rounded-3xl">
          <h3 className="mb-4 text-sm font-bold uppercase text-muted-foreground">Rendez‑vous journaliers</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gradCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPrevious" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#64748B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
              <XAxis dataKey="jour" stroke={chartTheme.axisColor} />
              <YAxis stroke={chartTheme.axisColor} />
              <Tooltip contentStyle={chartTheme.tooltipStyle} />
              <Legend />
              <Area type="monotone" dataKey="Mois actuel" stroke="#06b6d4" fill="url(#gradCurrent)" strokeWidth={2} />
              <Area type="monotone" dataKey="Mois précédent" stroke="#64748B" fill="url(#gradPrevious)" strokeWidth={2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Line chart: quality / conversion / attendance trend */}
      {trendScoreData.length > 0 && (
        <div className="bg-card border border-border p-6 rounded-3xl">
          <h3 className="mb-4 text-sm font-bold uppercase text-muted-foreground">Évolution des scores</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendScoreData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
              <XAxis dataKey="periode" stroke={chartTheme.axisColor} />
              <YAxis domain={[0, 100]} stroke={chartTheme.axisColor} />
              <Tooltip contentStyle={chartTheme.tooltipStyle} />
              <Legend />
              <Line type="monotone" dataKey="Score qualité" stroke="#06b6d4" strokeWidth={3} dot={{ r: 6 }} />
              <Line type="monotone" dataKey="Conversion" stroke="#10B981" strokeWidth={3} dot={{ r: 6 }} />
              <Line type="monotone" dataKey="Présence" stroke="#3B82F6" strokeWidth={3} dot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* AI Summary */}
      {performance && (
        <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 rounded-xl shadow-sm">
          <h3 className="mb-2 text-sm font-bold uppercase text-muted-foreground">Résumé IA — Rendement</h3>
          <p className="text-sm text-foreground/85">{generateSummary()}</p>
        </div>
      )}
    </div>
  );
}
