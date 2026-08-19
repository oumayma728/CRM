import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Award, Target, Users, Calendar,
  ArrowUp, ArrowDown, Loader2, User, Search, Filter,
  Activity, Star, Clock, Phone, CheckCircle2, AlertCircle,
  ChevronDown, ChevronsUpDown, Zap, BarChart3, BrainCircuit,
  Sparkles, AlertTriangle, Crown, Medal, ArrowUpDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line
} from 'recharts';
import api from '../../services/api';
import { useChartTheme } from '../../hooks/useChartTheme';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';

const COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];
const RADAR_COLORS = { agent1: '#7c3aed', agent2: '#10b981' };

function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-card border border-border p-5 rounded-2xl">
          <Skeleton className="w-10 h-10 rounded-xl mb-3" />
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-24 mt-1" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton({ height = 250 }: { height?: number }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <Skeleton className="h-4 w-48 mb-6" />
      <Skeleton className={`w-full rounded-lg`} style={{ height }} />
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-primary/40" />
      </div>
      <p className="text-sm font-bold text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
}

function LoadingSpinner({ text = 'Chargement...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{text}</p>
    </div>
  );
}

export default function AdminPerformancePage() {
  const chartTheme = useChartTheme();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | 'team'>('team');
  const [selectOpen, setSelectOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadAgentsPerformance();
  }, []);

  const loadAgentsPerformance = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAllAgentsPerformance();
      const mapped = data.map((a: any, idx: number) => ({
        id: a.id || a.agent_id || `agent_${idx}`,
        rank: idx + 1,
        name: a.agent_name || a.name || 'Agent inconnu',
        current: a.total_calls || a.current || 0,
        previous: a.previous || 0,
        score: a.avg_score || a.score || 0,
        conversions: a.conversions || 0,
        refusals: a.refusals || 0,
        activity: a.activity || [],
      })).sort((a, b) => b.score - a.score);
      setAgents(mapped);
    } catch (e) {
      console.error('Error loading agents:', e);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  const selectedAgent = selectedAgentId === 'team'
    ? null
    : agents.find(a => a.id === Number(selectedAgentId));

  const getEvolution = (current: number, previous: number) => {
    if (!previous) return '0';
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const teamAvgScore = agents.length > 0
    ? Math.round(agents.reduce((s, a) => s + a.score, 0) / agents.length)
    : 0;
  const teamTotalCalls = agents.reduce((s, a) => s + a.current, 0);
  const teamTotalConversions = agents.reduce((s, a) => s + a.conversions, 0);
  const teamRefusalRate = agents.length > 0
    ? Math.round(agents.reduce((s, a) => s + a.refusals, 0) / teamTotalCalls * 100)
    : 0;

  const comparisonData = agents.length >= 2 ? [
    { metric: 'Score', agent1: agents[0]?.score || 0, agent2: agents[1]?.score || 0 },
    { metric: 'Appels', agent1: agents[0]?.current || 0, agent2: agents[1]?.current || 0 },
    { metric: 'RDV', agent1: agents[0]?.conversions || 0, agent2: agents[1]?.conversions || 0 },
    { metric: 'Refus', agent1: agents[0]?.refusals || 0, agent2: agents[1]?.refusals || 0 },
  ] : [];

  const bestAgent = agents[0];
  const worstAgent = agents.length > 0 ? agents[agents.length - 1] : null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl">
            <BarChart3 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter text-foreground uppercase">
              Performance <span className="text-primary">Comparée</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">
              Analyse comparative des performances des agents
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Popover open={selectOpen} onOpenChange={setSelectOpen}>
            <PopoverTrigger asChild>
              <button
                className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-bold text-foreground hover:border-primary/30 transition-all min-w-[220px]"
              >
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="flex-1 text-left truncate">
                  {selectedAgentId === 'team' ? 'Vue Équipe (Global)' : selectedAgent?.name || 'Sélectionner...'}
                </span>
                <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[260px] p-0" align="end">
              <Command>
                <CommandInput placeholder="Rechercher un agent..." className="h-10" />
                <CommandList>
                  <CommandEmpty className="py-6 text-xs text-muted-foreground">
                    Aucun agent trouvé
                  </CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="team"
                      onSelect={() => { setSelectedAgentId('team'); setSelectOpen(false); }}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-primary" />
                      <span>Vue Équipe (Global)</span>
                      {selectedAgentId === 'team' && <CheckCircle2 className="w-3.5 h-3.5 text-primary ml-auto" />}
                    </CommandItem>
                    {agents.map(agent => (
                      <CommandItem
                        key={agent.id}
                        value={agent.name}
                        onSelect={() => { setSelectedAgentId(agent.id); setSelectOpen(false); }}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary uppercase">
                          {agent.name.substring(0, 2)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{agent.name}</p>
                          <p className="text-[10px] text-muted-foreground">Score: {agent.score}%</p>
                        </div>
                        {selectedAgentId === agent.id && <CheckCircle2 className="w-3.5 h-3.5 text-primary ml-auto" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <button
            onClick={loadAgentsPerformance}
            className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {initialLoading ? (
        <div className="space-y-6">
          <KPISkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChartSkeleton height={300} />
            </div>
            <ChartSkeleton height={300} />
          </div>
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl">
          <EmptyState
            icon={Users}
            title="Aucun agent disponible"
            description="Les données de performance apparaîtront ici une fois que des appels seront analysés."
          />
        </div>
      ) : selectedAgentId === 'team' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Score Équipe', value: `${teamAvgScore}%`, icon: Star, color: 'text-yellow-400', sub: 'Moyenne générale', trend: null },
              { label: 'Total Appels', value: teamTotalCalls.toLocaleString(), icon: Phone, color: 'text-blue-400', sub: 'Mois en cours', trend: null },
              { label: 'Conversions', value: teamTotalConversions.toLocaleString(), icon: Target, color: 'text-emerald-400', sub: 'RDV confirmés', trend: null },
              { label: 'Taux Rejet', value: `${teamRefusalRate}%`, icon: TrendingDown, color: 'text-red-400', sub: 'Non qualifiés', trend: null },
            ].map((kpi, i) => (
              <div key={i} className="bg-card border border-border p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all duration-300">
                <div className="relative z-10">
                  <div className={`w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center mb-3 ${kpi.color}`}>
                    <kpi.icon className="w-5 h-5" />
                  </div>
                  <div className="text-3xl font-black text-foreground">{kpi.value}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{kpi.label}</div>
                  <div className="text-[10px] font-bold text-muted-foreground/50 mt-1">{kpi.sub}</div>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                  <kpi.icon className="w-20 h-20" />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <h3 className="font-black text-xs uppercase tracking-widest text-foreground">
                  Classement Performance
                </h3>
                <Crown className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/10 text-left">
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rang</th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Agent</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Score</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Appels</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">RDV</th>
                      <th className="px-6 py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {agents.map((agent, idx) => (
                      <tr key={agent.id} className="hover:bg-muted/20 transition-colors group cursor-pointer" onClick={() => setSelectedAgentId(agent.id)}>
                        <td className="px-6 py-4">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                            idx === 0 ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/20' :
                            idx === 1 ? 'bg-slate-300 text-slate-900' :
                            idx === 2 ? 'bg-orange-400 text-white' : 'bg-muted text-muted-foreground'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/30 flex items-center justify-center font-bold text-[10px] text-primary uppercase">
                              {agent.name.substring(0, 2)}
                            </div>
                            <span className="font-bold text-foreground">{agent.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${agent.score}%` }} />
                            </div>
                            <span className="font-black text-xs text-primary">{agent.score}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-foreground">{agent.current}</td>
                        <td className="px-4 py-4 text-center text-emerald-500 font-black">{agent.conversions}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-1.5 rounded-lg hover:bg-primary hover:text-white transition-all text-muted-foreground opacity-0 group-hover:opacity-100">
                            <TrendingUp className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="font-black text-xs uppercase tracking-widest mb-6 text-foreground">Comparaison Top 2</h3>
              {comparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={comparisonData}>
                    <PolarGrid stroke={chartTheme.gridColor} />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: chartTheme.textColor }} />
                    <PolarRadiusAxis angle={90} domain={[0, 'auto']} tick={{ fontSize: 8, fill: chartTheme.textColor }} axisLine={false} />
                    <Radar name={agents[0]?.name || 'Agent 1'} dataKey="agent1" stroke={RADAR_COLORS.agent1} fill={RADAR_COLORS.agent1} fillOpacity={0.15} strokeWidth={2} />
                    <Radar name={agents[1]?.name || 'Agent 2'} dataKey="agent2" stroke={RADAR_COLORS.agent2} fill={RADAR_COLORS.agent2} fillOpacity={0.15} strokeWidth={2} />
                    <Tooltip contentStyle={chartTheme.tooltipStyle} />
                    <Legend iconType="circle" />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={Users} title="Agents insuffisants" description="Ajoutez plus d'agents pour voir la comparaison." />
              )}
              <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                  <BrainCircuit className="w-3 h-3" /> Insight IA
                </p>
                <p className="text-xs font-medium leading-relaxed text-foreground">
                  {agents[0]?.name || "L'agent"} mène avec <span className="text-primary font-bold">{agents[0]?.score || 0}%</span> de score.
                  {agents[1] ? ` ${agents[1]?.name} suit à ${agents[1]?.score || 0}%.` : ''}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-1 bg-gradient-to-br from-purple-600 to-indigo-800 rounded-2xl p-6 text-white shadow-xl shadow-purple-600/20 border-b-4 border-purple-900/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-xl font-black">
                  {selectedAgent?.name.substring(0, 2)}
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">{selectedAgent?.name}</h3>
                  <div className="flex items-center gap-1.5 opacity-70 mt-0.5">
                    <Medal className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {selectedAgent && agents.indexOf(selectedAgent) === 0 ? 'Meilleur Agent' :
                       selectedAgent && agents.indexOf(selectedAgent) === agents.length - 1 ? 'À améliorer' : 'Agent'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase opacity-60 mb-1">
                    <span>Score Qualité</span>
                    <span>{selectedAgent?.score}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white" style={{ width: `${selectedAgent?.score}%` }} />
                  </div>
                </div>
                <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                  <div className="text-center flex-1">
                    <p className="text-xl font-black">{selectedAgent?.current}</p>
                    <p className="text-[10px] font-bold uppercase opacity-60">Appels</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center flex-1">
                    <p className="text-xl font-black">{selectedAgent?.conversions}</p>
                    <p className="text-[10px] font-bold uppercase opacity-60">RDV</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Évolution Appels', value: `${getEvolution(selectedAgent?.current || 0, selectedAgent?.previous || 1)}%`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: 'vs mois dernier' },
                { label: 'Taux Conversion', value: selectedAgent?.current ? `${Math.round((selectedAgent?.conversions / selectedAgent?.current) * 100)}%` : '0%', icon: Target, color: 'text-purple-400', bg: 'bg-purple-500/10', trend: 'RDV / Appels' },
                { label: 'Taux de Closing', value: selectedAgent?.current ? `${Math.round((selectedAgent?.conversions / selectedAgent?.current) * 100)}%` : '0%', icon: Award, color: 'text-amber-400', bg: 'bg-amber-500/10', trend: 'Performance' },
              ].map((kpi, i) => (
                <div key={i} className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 ${kpi.bg} rounded-lg ${kpi.color}`}>
                      <kpi.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{kpi.label}</span>
                  </div>
                  <div className="text-2xl font-black text-foreground">{kpi.value}</div>
                  <p className="text-[10px] font-bold text-muted-foreground mt-1">{kpi.trend}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="font-black text-xs uppercase tracking-widest mb-6 text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Activité Quotidienne
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={selectedAgent?.activity || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: chartTheme.textColor }} stroke={chartTheme.gridColor} />
                  <YAxis tick={{ fontSize: 10, fill: chartTheme.textColor }} stroke={chartTheme.gridColor} />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} contentStyle={chartTheme.tooltipStyle} />
                  <Legend iconType="circle" />
                  <Bar dataKey="calls" name="Appels" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="convs" name="Conversions" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="font-black text-xs uppercase tracking-widest mb-6 text-foreground flex items-center gap-2">
                <PieChart className="w-4 h-4 text-primary" />
                Répartition des Appels
              </h3>
              <div className="h-[250px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'RDV Confirmé', value: selectedAgent?.conversions || 0 },
                        { name: 'Refusé', value: selectedAgent?.refusals || 0 },
                        { name: 'Non qualifié', value: Math.max(0, (selectedAgent?.current || 0) - (selectedAgent?.conversions || 0) - (selectedAgent?.refusals || 0)) },
                      ]}
                      cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                    >
                      {COLORS.map((color, idx) => (
                        <Cell key={`cell-${idx}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTheme.tooltipStyle} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setSelectedAgentId('team')}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowUpDown className="w-3 h-3" />
              Retour au classement global
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
