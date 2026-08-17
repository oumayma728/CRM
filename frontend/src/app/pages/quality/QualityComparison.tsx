import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ArrowLeftRight, ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useChartTheme } from '../../hooks/useChartTheme';
import { fetchAgents, fetchAgentPerformance, Agent, AgentPerformance } from '../../services/quality';

interface ComparisonRow {
  kpi: string;
  previous: number;
  current: number;
  unit: string;
  evolution: number;
}

function EvolutionBadge({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-500/10 text-slate-400 rounded-lg text-xs font-black">
        <Minus className="w-3 h-3" /> 0%
      </span>
    );
  }
  const isPositive = value > 0;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-black ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isPositive ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

export default function QualityComparison() {
  const chartTheme = useChartTheme();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | undefined>(undefined);
  const [performance, setPerformance] = useState<AgentPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

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
      setComparing(true);
      try {
        const data = await fetchAgentPerformance(selectedAgentId);
        setPerformance(data);
      } catch (e) {
        console.error('Failed to fetch performance', e);
        setPerformance(null);
      } finally {
        setComparing(false);
      }
    };
    loadPerf();
  }, [selectedAgentId]);

  const rows: ComparisonRow[] = useMemo(() => {
    if (!performance) return [];
    const c = performance.current_month;
    const p = performance.previous_month;
    if (!c || !p) return [];
    const calc = (curr: number, prev: number) => prev === 0 ? 0 : ((curr - prev) / prev) * 100;
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
    const c = performance.current_month;
    const p = performance.previous_month;
    if (!c || !p) return [];
    return [
      { name: 'Appels', previous: p.calls, current: c.calls },
      { name: 'RDV', previous: p.appointments, current: c.appointments },
      { name: 'Conversion', previous: p.conversion_rate, current: c.conversion_rate },
      { name: 'Qualité', previous: p.quality_score, current: c.quality_score },
      { name: 'Assiduité', previous: p.attendance_rate, current: c.attendance_rate },
    ];
  }, [performance]);

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

  return (
    <div className="space-y-8 p-6 animate-in fade-in duration-700">
      <div className="flex items-center gap-3">
        <ArrowLeftRight className="w-6 h-6 text-amber-400" />
        <h2 className="text-xl font-bold text-foreground">Comparaison de rendement</h2>
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

      {comparing && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Comparaison en cours...</p>
          </div>
        </div>
      )}

      {performance && !comparing && (
        <>
          {/* KPI Evolution Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {rows.map((row, i) => (
              <div
                key={row.kpi}
                className={`bg-card border border-border rounded-2xl p-4 ${
                  row.evolution > 0
                    ? 'border-l-4 border-l-emerald-500'
                    : row.evolution < 0
                    ? 'border-l-4 border-l-rose-500'
                    : 'border-l-4 border-l-slate-500'
                }`}
              >
                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-2">{row.kpi}</p>
                <p
                  className={`text-2xl font-black italic tracking-tighter ${
                    row.evolution > 0
                      ? 'text-emerald-400'
                      : row.evolution < 0
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {row.evolution > 0 ? '+' : ''}
                  {row.evolution.toFixed(1)}%
                </p>
                <div className="mt-2">
                  <EvolutionBadge value={row.evolution} />
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <ArrowLeftRight className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-[10px] uppercase tracking-widest text-foreground">
                  Tableau comparatif — Mois précédent vs Mois actuel
                </h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-primary/5">
                    <th className="px-6 py-4 text-[8px] font-black text-muted-foreground uppercase tracking-widest">KPI</th>
                    <th className="px-6 py-4 text-[8px] font-black text-muted-foreground uppercase tracking-widest text-right">Mois précédent</th>
                    <th className="px-6 py-4 text-[8px] font-black text-muted-foreground uppercase tracking-widest text-right">Mois actuel</th>
                    <th className="px-6 py-4 text-[8px] font-black text-muted-foreground uppercase tracking-widest text-right">Évolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row) => (
                    <tr key={row.kpi} className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black text-foreground uppercase">{row.kpi}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-muted-foreground">
                          {row.previous.toLocaleString()}{row.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-foreground">
                          {row.current.toLocaleString()}{row.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <EvolutionBadge value={row.evolution} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comparison Chart */}
          <div className="bg-card border border-border p-6 rounded-3xl">
            <div className="flex items-center gap-3 mb-6">
              <ArrowLeftRight className="w-5 h-5 text-amber-400" />
              <h3 className="font-black text-[10px] uppercase tracking-widest text-foreground">
                Graphique comparatif
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                <XAxis dataKey="name" stroke={chartTheme.axisColor} fontSize={10} />
                <YAxis stroke={chartTheme.axisColor} fontSize={10} />
                <Tooltip contentStyle={chartTheme.tooltipStyle} />
                <Legend />
                <Bar dataKey="previous" fill="#64748B" name="Mois précédent" radius={[4, 4, 0, 0]} />
                <Bar dataKey="current" fill="#06b6d4" name="Mois actuel" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
