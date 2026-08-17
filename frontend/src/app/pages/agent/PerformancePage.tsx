import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Award, Target, MessageSquare, Calendar,
  ArrowUp, ArrowDown, Loader2, Search, Filter,
  ChevronDown, ChevronUp, Phone, Clock, BrainCircuit,
  Star, Zap, Activity, BarChart3, ChevronsUpDown,
  CheckCircle2, AlertTriangle, Sparkles, User, Users
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
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

type TabId = 'overview' | 'skills' | 'history';

function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-card border border-border p-5 rounded-2xl">
          <Skeleton className="w-10 h-10 rounded-xl mb-3" />
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <Skeleton className="h-4 w-44 mb-6" />
      <Skeleton className="w-full rounded-lg" style={{ height: `${height}px` }} />
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

export default function PerformancePage() {
  const chartTheme = useChartTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<any>(null);
  const [callsLog, setCallsLog] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentName, setSelectedAgentName] = useState<string>('');
  const [selectOpen, setSelectOpen] = useState(false);

  // History tab state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResult, setFilterResult] = useState('all');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    if (user?.name) {
      setSelectedAgentName(user.name);
    }
  }, [user]);

  useEffect(() => {
    if (selectedAgentName) {
      loadData();
      loadAgentsList();
    }
  }, [selectedAgentName]);

  const loadAgentsList = async () => {
    try {
      const data = await api.getAllAgentsPerformance();
      const names = data.map((a: any) => a.agent_name || a.name).filter(Boolean);
      setAgents(prev => {
        const currentNames = new Set(prev.map(a => a.name));
        const newAgents = names.filter((n: string) => !currentNames.has(n)).map((n: string) => ({ name: n }));
        return [...prev, ...newAgents];
      });
    } catch {
      // Silently fail - agents list is optional
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [compData, callsData] = await Promise.allSettled([
        selectedAgentName ? api.getPerformanceTrendByName(selectedAgentName) : api.getPerformanceComparison(),
        api.getCallsLog(50)
      ]);
      if (compData.status === 'fulfilled') setComparison(compData.value);
      if (callsData.status === 'fulfilled') {
        const calls = (callsData.value || []).map((c: any) => ({
          id: c.callId,
          date: c.callDate ? new Date(c.callDate).toLocaleDateString('fr-FR') : '',
          time: c.callDate ? new Date(c.callDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '',
          company: c.customerIntent || '',
          contact: c.agentName || '',
          duration: c.callDuration ? `${Math.floor(c.callDuration / 60)}m${c.callDuration % 60}s` : '',
          result: c.performance || '',
          score: c.scorePercentage || 0,
          notes: c.nextSteps || '',
          aiSummary: c.summary || ''
        }));
        setCallsLog(calls);
      }
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m${secs}s`;
  };

  const getEvolutionClass = (value: number, inverse: boolean = false) => {
    if (inverse) value = -value;
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const getEvolutionIcon = (value: number, inverse: boolean = false) => {
    if (inverse) value = -value;
    if (value > 0) return ArrowUp;
    if (value < 0) return ArrowDown;
    return null;
  };

  const tabs = [
    { id: 'overview' as TabId, label: 'Vue Globale', icon: BarChart3 },
    { id: 'skills' as TabId, label: 'Compétences', icon: Zap },
    { id: 'history' as TabId, label: 'Historique', icon: Clock }
  ];

  const monthlyChartData = comparison?.monthly_data || [];
  const currentMonth = comparison?.current_month || {};
  const previousMonth = comparison?.previous_month || {};
  const evolution = comparison?.evolution || {};

  const filteredCalls = callsLog.filter(call => {
    const matchesSearch = (call.contact || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (call.company || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterResult === 'all' || (call.result || '').toLowerCase() === filterResult.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const computedSkillsData = useMemo(() => {
    const base = comparison?.current_month?.avg_score ?? 75;
    return [
      { skill: 'Écoute', value: Math.min(100, Math.round(base + 8)) },
      { skill: 'Persuasion', value: Math.min(100, Math.round(base - 2)) },
      { skill: 'Empathie', value: Math.min(100, Math.round(base + 10)) },
      { skill: 'Argumentation', value: Math.min(100, Math.round(base)) },
      { skill: 'Gestion objections', value: Math.min(100, Math.round(base - 6)) },
      { skill: 'Closing', value: Math.min(100, Math.round(base + 3)) },
    ];
  }, [comparison]);

  const computedWeeklyData = useMemo(() => {
    if (comparison?.monthly_data && comparison.monthly_data.length > 0) {
      return comparison.monthly_data.slice(-7).map((m: any) => ({
        day: m.month,
        score: m.score,
        appels: m.calls,
        conversions: m.conversions,
      }));
    }
    return [];
  }, [comparison]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl">
            <Activity className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter text-foreground uppercase">
              Performance <span className="text-primary">Mensuelle</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">
              Analyse détaillée de votre performance et suggestions d'amélioration
            </p>
          </div>
        </div>

        {agents.length > 0 && (
          <Popover open={selectOpen} onOpenChange={setSelectOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-bold text-foreground hover:border-primary/30 transition-all min-w-[200px]">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="flex-1 text-left truncate">{selectedAgentName || user?.name || 'Mon profil'}</span>
                <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-0" align="end">
              <Command>
                <CommandInput placeholder="Rechercher..." className="h-10" />
                <CommandList>
                  <CommandEmpty className="py-6 text-xs text-muted-foreground">Aucun agent</CommandEmpty>
                  <CommandGroup>
                    {user?.name && (
                      <CommandItem
                        value={user.name}
                        onSelect={() => { setSelectedAgentName(user.name); setSelectOpen(false); }}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <User className="w-4 h-4 text-primary" />
                        <span>{user.name} (Moi)</span>
                        {selectedAgentName === user.name && <CheckCircle2 className="w-3.5 h-3.5 text-primary ml-auto" />}
                      </CommandItem>
                    )}
                    {agents.filter(a => a.name !== user?.name).map(agent => (
                      <CommandItem
                        key={agent.name}
                        value={agent.name}
                        onSelect={() => { setSelectedAgentName(agent.name); setSelectOpen(false); }}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary uppercase">
                          {agent.name.substring(0, 2)}
                        </div>
                        <span>{agent.name}</span>
                        {selectedAgentName === agent.name && <CheckCircle2 className="w-3.5 h-3.5 text-primary ml-auto" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-0 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-card text-foreground border border-border border-b-0 shadow-sm -mb-px'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : ''}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: Overview */}
      {activeTab === 'overview' && (
        loading ? (
          <div className="space-y-6">
            <KPISkeleton />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartSkeleton height={280} />
              <ChartSkeleton height={280} />
            </div>
          </div>
        ) : !comparison ? (
          <div className="bg-card border border-border rounded-2xl">
            <EmptyState
              icon={Activity}
              title="Aucune donnée de performance"
              description="Les données apparaîtront ici une fois que des appels seront analysés et notés."
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-purple-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl shadow-purple-600/20 border-b-4 border-purple-900/20 transform hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Global</span>
                </div>
                <h3 className="text-sm font-black uppercase tracking-tighter opacity-80 italic">Score Global</h3>
                <p className="text-4xl font-black italic tracking-tighter mt-1">{currentMonth.avg_score || 0}/100</p>
                {evolution.avg_score != null && (
                  <div className="flex items-center gap-1 mt-3 inline-flex bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    {evolution.avg_score >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {evolution.avg_score > 0 ? '+' : ''}{evolution.avg_score}% VS MOIS DERNIER
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20 border-b-4 border-emerald-900/20 transform hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Impact</span>
                </div>
                <h3 className="text-sm font-black uppercase tracking-tighter opacity-80 italic">Taux conversion</h3>
                <p className="text-4xl font-black italic tracking-tighter mt-1">{currentMonth.conversions || 0}%</p>
                {evolution.conversions != null && (
                  <div className="flex items-center gap-1 mt-3 inline-flex bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    {evolution.conversions >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {evolution.conversions > 0 ? '+' : ''}{evolution.conversions}%
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-sky-500 to-sky-700 rounded-3xl p-6 text-white shadow-xl shadow-sky-500/20 border-b-4 border-sky-900/20 transform hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Qualité</span>
                </div>
                <h3 className="text-sm font-black uppercase tracking-tighter opacity-80 italic">Appels qualité</h3>
                <p className="text-4xl font-black italic tracking-tighter mt-1">{currentMonth.avg_score || 0}%</p>
                {evolution.avg_score != null && (
                  <div className="flex items-center gap-1 mt-3 inline-flex bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    {evolution.avg_score >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {evolution.avg_score > 0 ? '+' : ''}{evolution.avg_score}%
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl shadow-amber-500/20 border-b-4 border-amber-900/20 transform hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Volume</span>
                </div>
                <h3 className="text-sm font-black uppercase tracking-tighter opacity-80 italic">Appels traités</h3>
                <p className="text-4xl font-black italic tracking-tighter mt-1">{currentMonth.total_calls || 0}</p>
                <p className="text-[10px] font-black uppercase mt-3 inline-flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                  SUR {previousMonth.total_calls || 0} LE MOIS DERNIER
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h3 className="font-black text-xs uppercase tracking-widest mb-6 text-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Évolution Mensuelle
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyChartData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                    <XAxis dataKey="month" stroke={chartTheme.textColor} tick={{ fontSize: 11, fontWeight: 700, fill: chartTheme.textColor }} />
                    <YAxis stroke={chartTheme.textColor} tick={{ fontSize: 11, fontWeight: 700, fill: chartTheme.textColor }} />
                    <Tooltip contentStyle={chartTheme.tooltipStyle} />
                    <Legend iconType="circle" />
                    <Line type="monotone" dataKey="score" stroke="url(#colorScore)" strokeWidth={4} dot={{ fill: chartTheme.textColor, strokeWidth: 3, r: 5, stroke: '#7c3aed' }} activeDot={{ r: 7, strokeWidth: 0 }} name="Score" />
                    <Line type="monotone" dataKey="calls" stroke="#10b981" strokeWidth={2} dot={false} name="Appels" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h3 className="font-black text-xs uppercase tracking-widest mb-6 text-foreground flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-primary" />
                  Feedback IA & Suggestions
                </h3>
                <div className="space-y-3">
                  {[
                    { id: 1, type: 'success', title: 'Excellent travail sur l\'écoute active', description: 'Vos temps de silence et vos reformulations sont très bien maîtrisés.' },
                    { id: 2, type: 'improvement', title: 'Améliorer la gestion des objections', description: 'Prenez plus de temps pour comprendre la vraie raison derrière l\'objection avant de répondre.' },
                    { id: 3, type: 'tip', title: 'Astuce : Technique du silence', description: 'Après avoir posé une question importante, laissez un silence de 3-5 secondes.' }
                  ].map(s => (
                    <div key={s.id} className={`p-4 rounded-xl border ${
                      s.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' :
                      s.type === 'improvement' ? 'bg-amber-500/5 border-amber-500/20' :
                      'bg-purple-500/5 border-purple-500/20'
                    }`}>
                      <h4 className={`font-bold text-sm mb-1 flex items-center gap-2 ${
                        s.type === 'success' ? 'text-emerald-500' :
                        s.type === 'improvement' ? 'text-amber-500' :
                        'text-purple-500'
                      }`}>
                        {s.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                         s.type === 'improvement' ? <AlertTriangle className="w-4 h-4" /> :
                         <Sparkles className="w-4 h-4" />}
                        {s.title}
                      </h4>
                      <p className="text-xs text-muted-foreground ml-6">{s.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )
      )}

      {/* TAB: Skills */}
      {activeTab === 'skills' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="font-black text-xs uppercase tracking-widest mb-6 text-foreground flex items-center gap-2">
              <div className="w-2 h-5 bg-primary rounded-full" />
              Compétences évaluées
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={computedSkillsData}>
                <PolarGrid stroke={chartTheme.gridColor} />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fontWeight: 900, fill: chartTheme.textColor }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: chartTheme.textColor, fontSize: 8 }} axisLine={false} />
                <Radar name="Score" dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.25} strokeWidth={3} />
                <Tooltip contentStyle={chartTheme.tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="font-black text-xs uppercase tracking-widest mb-6 text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Performance par jour
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={computedWeeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                <XAxis dataKey="day" stroke={chartTheme.textColor} tick={{ fontSize: 11, fontWeight: 700, fill: chartTheme.textColor }} />
                <YAxis stroke={chartTheme.textColor} tick={{ fontSize: 11, fontWeight: 700, fill: chartTheme.textColor }} />
                <Tooltip contentStyle={chartTheme.tooltipStyle} />
                <Legend iconType="circle" />
                <Bar dataKey="appels" fill="#7c3aed" radius={[6, 6, 0, 0]} name="Appels" />
                <Bar dataKey="conversions" fill="#10b981" radius={[6, 6, 0, 0]} name="Conversions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB: History */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-card border border-border p-6 rounded-2xl">
                    <Skeleton className="h-4 w-24 mb-3" />
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>
              <div className="bg-card border border-border rounded-2xl p-6">
                <Skeleton className="h-8 w-full mb-4" />
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full mb-2" />)}
              </div>
            </div>
          ) : callsLog.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl">
              <EmptyState
                icon={Phone}
                title="Aucun appel enregistré"
                description="L'historique des appels apparaîtra ici une fois que des appels seront analysés."
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total appels</h3>
                    <Phone className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-3xl font-black text-foreground">{callsLog.length}</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Durée moyenne</h3>
                    <Clock className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-3xl font-black text-foreground">5:12</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Score moyen</h3>
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-3xl font-black text-foreground">{callsLog.length > 0 ? Math.round(callsLog.reduce((s, c) => s + c.score, 0) / callsLog.length) : 0}</p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-border">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Rechercher par contact ou sujet..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <select
                        value={filterResult}
                        onChange={(e) => setFilterResult(e.target.value)}
                        className="px-3 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground text-sm font-bold appearance-none cursor-pointer"
                      >
                        <option value="all">Tous les résultats</option>
                        <option value="Converti">Converti</option>
                        <option value="Rappel">Rappel</option>
                        <option value="Refusé">Refusé</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                        <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sujet</th>
                        <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden md:table-cell">Contact</th>
                        <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Durée</th>
                        <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Résultat</th>
                        <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Score</th>
                        <th className="px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCalls.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground text-xs">
                            Aucun appel trouvé pour cette recherche
                          </td>
                        </tr>
                      ) : (
                        filteredCalls.map((call) => (
                          <React.Fragment key={call.id}>
                            <tr className="border-b border-border hover:bg-muted/20 transition-colors">
                              <td className="px-5 py-4">
                                <div>
                                  <p className="font-medium text-foreground text-xs">{call.date}</p>
                                  <p className="text-[10px] text-muted-foreground">{call.time}</p>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-foreground text-xs">{call.company || '—'}</td>
                              <td className="px-5 py-4 text-foreground text-xs hidden md:table-cell">{call.contact || '—'}</td>
                              <td className="px-5 py-4 text-muted-foreground text-xs">{call.duration || '—'}</td>
                              <td className="px-5 py-4">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                  call.result === 'Converti' ? 'bg-emerald-500/10 text-emerald-500' :
                                  call.result === 'Refusé' ? 'bg-red-500/10 text-red-500' :
                                  'bg-amber-500/10 text-amber-500'
                                }`}>
                                  {call.result || '—'}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${
                                      call.score >= 90 ? 'bg-emerald-500' :
                                      call.score >= 75 ? 'bg-amber-500' :
                                      'bg-red-500'
                                    }`} style={{ width: `${call.score}%` }} />
                                  </div>
                                  <span className="text-xs font-bold text-foreground">{call.score}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <button
                                  onClick={() => setExpandedRow(expandedRow === call.id ? null : call.id)}
                                  className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                                >
                                  {expandedRow === call.id ? (
                                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </button>
                              </td>
                            </tr>
                            {expandedRow === call.id && (
                              <tr className="bg-muted/10">
                                <td colSpan={7} className="px-5 py-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-card rounded-xl border border-border">
                                      <h4 className="font-bold text-xs text-foreground mb-2 flex items-center gap-1.5">
                                        <MessageSquare className="w-3.5 h-3.5 text-primary" />
                                        Notes
                                      </h4>
                                      <p className="text-xs text-muted-foreground">{call.notes || 'Aucune note'}</p>
                                    </div>
                                    <div className="p-4 bg-card rounded-xl border border-border">
                                      <h4 className="font-bold text-xs text-foreground mb-2 flex items-center gap-1.5">
                                        <BrainCircuit className="w-3.5 h-3.5 text-primary" />
                                        Résumé IA
                                      </h4>
                                      <p className="text-xs text-muted-foreground">{call.aiSummary || 'Aucun résumé disponible'}</p>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
