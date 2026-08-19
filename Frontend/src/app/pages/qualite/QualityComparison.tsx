import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeftRight, ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import api from '../../../services/api';

interface Agent { id: number; nom: string; prenom: string; }
interface MonthStats {
  calls: number; appointments: number; conversion_rate: number;
  quality_score: number; attendance_rate: number;
}
interface AgentPerformance { current_month: MonthStats; previous_month: MonthStats; }

const tooltipStyle = { backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' };

function EvolutionBadge({ value }: { value: number }) {
  if (value === 0) {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-muted-foreground rounded-lg text-xs font-black"><Minus className="w-3 h-3" /> 0%</span>;
  }
  const isPositive = value > 0;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-black ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isPositive ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

export default function QualityComparison() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | undefined>(undefined);
  const [performance, setPerformance] = useState<AgentPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    api.get('/qualite/agents').then(res => {
      setAgents(res.data);
      if (res.data.length > 0) setSelectedAgentId(res.data[0].id);
    }).catch(err => console.error('Erreur chargement agents:', err)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedAgentId) return;
    setComparing(true);
    api.get(`/qualite/agent-performance/${selectedAgentId}`)
      .then(res => setPerformance(res.data))
      .catch(err => { console.error('Erreur chargement performance:', err); setPerformance(null); })
      .finally(() => setComparing(false));
  }, [selectedAgentId]);

  const rows = useMemo(() => {
    if (!performance) return [];
    const c = performance.current_month, p = performance.previous_month;
    const calc = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
    return [
      { kpi: 'Appels', previous: p.calls, current: c.calls, unit: '', evolution: calc(c.calls, p.calls) },
      { kpi: 'Rendez-vous', previous: p.appointments, current: c.appointments, unit: '', evolution: calc(c.appointments, p.appointments) },
      { kpi: 'Taux de conversion', previous: p.conversion_rate, current: c.conversion_rate, unit: '%', evolution: calc(c.conversion_rate, p.conversion_rate) },
      { kpi: 'Score qualité', previous: p.quality_score, current: c.quality_score, unit: '%', evolution: calc(c.quality_score, p.quality_score) },
      { kpi: "Taux d'assiduité", previous: p.attendance_rate, current: c.attendance_rate, unit: '%', evolution: calc(c.attendance_rate, p.attendance_rate) },
    ];
  }, [performance]);

  const chartData = useMemo(() => {
    if (!performance) return [];
    const c = performance.current_month, p = performance.previous_month;
    return [
      { name: 'Appels', previous: p.calls, current: c.calls },
      { name: 'RDV', previous: p.appointments, current: c.appointments },
      { name: 'Conversion', previous: p.conversion_rate, current: c.conversion_rate },
      { name: 'Qualité', previous: p.quality_score, current: c.quality_score },
      { name: 'Assiduité', previous: p.attendance_rate, current: c.attendance_rate },
    ];
  }, [performance]);

  if (loading) return <div className="p-6 flex items-center justify-center h-64 text-muted-foreground">Chargement...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ArrowLeftRight className="w-6 h-6 text-amber-500" />
        <h1 className="text-xl font-bold text-foreground">Comparaison de rendement</h1>
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

      {comparing && <div className="py-8 text-center text-muted-foreground text-sm">Comparaison en cours...</div>}

      {performance && !comparing && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {rows.map(row => (
              <div key={row.kpi} className={`bg-card border border-border rounded-xl p-4 border-l-4 ${row.evolution > 0 ? 'border-l-emerald-500' : row.evolution < 0 ? 'border-l-red-500' : 'border-l-muted-foreground'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">{row.kpi}</p>
                <p className={`text-2xl font-black ${row.evolution > 0 ? 'text-emerald-500' : row.evolution < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {row.evolution > 0 ? '+' : ''}{row.evolution.toFixed(1)}%
                </p>
                <div className="mt-2"><EvolutionBadge value={row.evolution} /></div>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-bold text-sm text-foreground">Tableau comparatif — Mois précédent vs Mois actuel</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">KPI</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Mois précédent</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Mois actuel</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Évolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map(row => (
                    <tr key={row.kpi} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{row.kpi}</td>
                      <td className="px-6 py-4 text-right text-muted-foreground">{row.previous.toLocaleString()}{row.unit}</td>
                      <td className="px-6 py-4 text-right font-semibold text-foreground">{row.current.toLocaleString()}{row.unit}</td>
                      <td className="px-6 py-4 text-right"><EvolutionBadge value={row.evolution} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-xl">
            <h3 className="font-bold text-sm text-foreground mb-6">Graphique comparatif</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="previous" fill="#64748b" name="Mois précédent" radius={[4, 4, 0, 0]} />
                <Bar dataKey="current" fill="#06b6d4" name="Mois actuel" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
