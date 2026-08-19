import React, { useEffect, useState } from 'react';
import { TrendingUp, ChevronDown, ArrowUp, ArrowDown, Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
} from 'recharts';
import api from '../../../services/api';

interface Agent { id: number; nom: string; prenom: string; }
interface MonthStats {
  calls: number; appointments: number; conversion_rate: number;
  quality_score: number; attendance_rate: number; avg_call_duration: number;
  daily_performance: number[];
}
interface AgentPerformance {
  agent_name: string;
  current_month: MonthStats;
  previous_month: MonthStats;
}

const tooltipStyle = { backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' };
const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const fmt = (n: number) => n.toLocaleString();

export default function AgentTrendPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | undefined>(undefined);
  const [performance, setPerformance] = useState<AgentPerformance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/qualite/agents').then(res => {
      setAgents(res.data);
      if (res.data.length > 0) setSelectedAgentId(res.data[0].id);
    }).catch(err => console.error('Erreur chargement agents:', err)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedAgentId) return;
    setLoading(true);
    api.get(`/qualite/agent-performance/${selectedAgentId}`)
      .then(res => setPerformance(res.data))
      .catch(err => { console.error('Erreur chargement performance:', err); setPerformance(null); })
      .finally(() => setLoading(false));
  }, [selectedAgentId]);

  const variation = (current: number, previous: number) => {
    const diff = current - previous;
    const percent = previous === 0 ? (current > 0 ? 100 : 0) : (diff / previous) * 100;
    return { diff, percent };
  };

  const generateSummary = () => {
    if (!performance) return '';
    const { current_month: c, previous_month: p, agent_name } = performance;
    const callsVar = variation(c.calls, p.calls);
    const convVar = variation(c.conversion_rate, p.conversion_rate);
    const scoreVar = variation(c.quality_score, p.quality_score);
    const rdvVar = variation(c.appointments, p.appointments);
    return `${agent_name} : le volume d'appels a ${callsVar.percent >= 0 ? 'augmenté' : 'diminué'} de ${Math.abs(Math.round(callsVar.percent))}% (${fmt(p.calls)} → ${fmt(c.calls)}). Les rendez-vous sont ${rdvVar.percent >= 0 ? 'en hausse' : 'en baisse'} de ${Math.abs(Math.round(rdvVar.percent))}%. Le taux de conversion est passé de ${p.conversion_rate}% à ${c.conversion_rate}% (${convVar.percent >= 0 ? '+' : ''}${Math.round(convVar.percent)}%). Le score qualité ${scoreVar.percent >= 0 ? 'progresse' : 'recule'} de ${Math.abs(Math.round(scoreVar.percent))}%.`;
  };

  if (loading && !performance) {
    return <div className="p-6 flex items-center justify-center h-64 text-muted-foreground">Chargement...</div>;
  }

  const current = performance?.current_month;
  const previous = performance?.previous_month;

  const kpiCards = current && previous ? [
    { label: 'Appels', curr: current.calls, prev: previous.calls },
    { label: 'Rendez-vous', curr: current.appointments, prev: previous.appointments },
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

  const trendScoreData = current && previous ? [
    { periode: 'Mois précédent', 'Score qualité': previous.quality_score, Conversion: previous.conversion_rate, Présence: previous.attendance_rate },
    { periode: 'Mois actuel', 'Score qualité': current.quality_score, Conversion: current.conversion_rate, Présence: current.attendance_rate },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-amber-500" />
        <h1 className="text-xl font-bold text-foreground">Rendement mensuel</h1>
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
        {performance && (
          <span className="text-sm text-muted-foreground ml-2 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {MONTH_NAMES[new Date().getMonth()]} vs {MONTH_NAMES[new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1]}
          </span>
        )}
      </div>

      {current && previous && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kpiCards.map(item => {
            const { percent } = variation(item.curr, item.prev);
            const positive = percent >= 0;
            const displayVal = item.isPct ? `${item.curr}%` : `${fmt(item.curr)}${item.suffix ?? ''}`;
            const prevVal = item.isPct ? `${item.prev}%` : `${fmt(item.prev)}${item.suffix ?? ''}`;
            return (
              <div key={item.label} className="bg-card border border-border p-4 rounded-xl shadow-sm">
                <h3 className="text-xs font-bold uppercase text-muted-foreground mb-1">{item.label}</h3>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-black text-foreground">{displayVal}</p>
                    <p className="text-xs text-muted-foreground mt-1">Précédent : {prevVal}</p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted border border-border">
                    {positive ? <ArrowUp className="w-4 h-4 text-emerald-500" /> : <ArrowDown className="w-4 h-4 text-red-500" />}
                    <span className={`text-sm font-bold ${positive ? 'text-emerald-500' : 'text-red-500'}`}>
                      {positive ? '+' : ''}{percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {monthlyBarData.length > 0 && (
        <div className="bg-card border border-border p-6 rounded-xl">
          <h3 className="mb-4 text-sm font-bold uppercase text-muted-foreground">Comparaison mensuelle</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyBarData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Bar dataKey="Mois précédent" fill="#64748b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Mois actuel" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {dailyData.length > 0 && (
        <div className="bg-card border border-border p-6 rounded-xl">
          <h3 className="mb-4 text-sm font-bold uppercase text-muted-foreground">Rendez-vous journaliers</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gradCurrentTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="jour" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Area type="monotone" dataKey="Mois actuel" stroke="#06b6d4" fill="url(#gradCurrentTrend)" strokeWidth={2} />
              <Area type="monotone" dataKey="Mois précédent" stroke="#64748b" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {trendScoreData.length > 0 && (
        <div className="bg-card border border-border p-6 rounded-xl">
          <h3 className="mb-4 text-sm font-bold uppercase text-muted-foreground">Évolution des scores</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendScoreData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="periode" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Line type="monotone" dataKey="Score qualité" stroke="#06b6d4" strokeWidth={3} dot={{ r: 5 }} />
              <Line type="monotone" dataKey="Conversion" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
              <Line type="monotone" dataKey="Présence" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {performance && (
        <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
          <h3 className="mb-2 text-sm font-bold uppercase text-muted-foreground">Résumé</h3>
          <p className="text-sm text-foreground/85">{generateSummary()}</p>
        </div>
      )}
    </div>
  );
}
