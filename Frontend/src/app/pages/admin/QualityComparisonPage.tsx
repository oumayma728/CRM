import React, { useEffect, useState } from 'react';
import { Users, Star, TrendingUp, TrendingDown, BarChart3, Target, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import api from '../../../services/api';

const PIE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

const tooltipStyle = {
  backgroundColor: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  color: 'var(--foreground)',
};

export default function QualityComparisonPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [trend, setTrend] = useState<any>(null);
  const [comparison, setComparison] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedAgent) loadTrend(selectedAgent);
  }, [selectedAgent]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [statsRes, compRes, agentsRes] = await Promise.all([
        api.get('/quality/dashboard/global-stats').catch(() => ({ data: null })),
        api.get('/quality/dashboard/comparison'),
        api.get('/qualite/agents').catch(() => ({ data: [] })),
      ]);
      setGlobalStats(statsRes.data);
      setComparison(compRes.data || []);
      const list = agentsRes.data || [];
      setAgents(list);
      if (list.length > 0 && !selectedAgent) setSelectedAgent(list[0].id);
    } catch (err) {
      console.error('Quality comparison load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTrend = async (agentId: number) => {
    setTrendLoading(true);
    try {
      const res = await api.get(`/quality/dashboard/agent-trend/${agentId}`);
      setTrend(res.data);
    } catch (err) {
      console.error('Trend load error:', err);
      setTrend(null);
    } finally {
      setTrendLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      <span className="ml-3 text-muted-foreground">Chargement...</span>
    </div>
  );

  const selectedAgentName = agents.find(a => a.id === selectedAgent);
  const months = trend?.months || [];
  const avgScoreThisMonth = months.length > 0 ? months[months.length - 1]?.avgScore : 0;
  const avgScorePrevMonth = months.length > 1 ? months[months.length - 2]?.avgScore : 0;
  const scoreDiff = avgScoreThisMonth - avgScorePrevMonth;

  const decisions = months.length > 0 ? Object.entries(months[months.length - 1]?.decisions || {}).map(([k, v]) => ({ name: k, value: v })) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-primary pl-6">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
            Comparaison <span className="text-primary">Qualité</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1 opacity-70">
            Évolution des scores qualité par agent
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedAgent ?? ''}
            onChange={e => setSelectedAgent(Number(e.target.value) || null)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {agents.map((a: any) => (
              <option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>
            ))}
          </select>
          <button onClick={loadInitialData} className="px-4 py-2 bg-muted text-foreground text-[10px] font-black uppercase tracking-widest rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-all flex items-center gap-2">
            <RefreshCw className="w-3 h-3" /> Actualiser
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Évaluations</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500"><Star className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-black tracking-tighter">{months.reduce((s: number, m: any) => s + m.count, 0)}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Score Moyen</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500"><TrendingUp className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-black tracking-tighter">{trendLoading ? '...' : avgScoreThisMonth || 'N/A'}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Évolution</span>
            <div className={`p-2 rounded-xl ${scoreDiff >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {scoreDiff >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <p className={`text-3xl font-black tracking-tighter ${scoreDiff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trendLoading ? '...' : scoreDiff >= 0 ? `+${scoreDiff.toFixed(1)}` : scoreDiff.toFixed(1)}
          </p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Agents</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500"><Users className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-black tracking-tighter">{comparison.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Score trend */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Évolution du Score
          </h3>
          {trendLoading ? (
            <div className="flex items-center justify-center h-64"><RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" /></div>
          ) : months.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={months}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="avgScore" name="Score Moyen" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="maxScore" name="Max" stroke="#22c55e" strokeWidth={1} strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="minScore" name="Min" stroke="#ef4444" strokeWidth={1} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Aucune donnée pour cet agent</div>
          )}
        </div>

        {/* Agent comparison chart */}
        {comparison.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-500" /> Score Moyen par Agent
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={comparison.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                <XAxis dataKey="nom" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                <YAxis domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="avgScore" name="Score Moyen" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly evaluations bar chart */}
        {months.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Évaluations par Mois
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={months}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Nombre" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Decision distribution pie */}
        {decisions.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-500" /> Dernières Décisions
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={decisions} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {decisions.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Comparison table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-black uppercase tracking-widest">Classement des Agents</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/10 border-b border-border">
                {['Agent', 'Score Moyen', 'Évaluations', 'RDV', 'RDV Confirmés'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {comparison.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-muted-foreground text-xs">Aucune donnée disponible</td></tr>
              ) : (
                comparison.map((agent: any, i: number) => (
                  <tr
                    key={agent.agentId || i}
                    className={`hover:bg-muted/20 transition-colors cursor-pointer ${selectedAgent === agent.agentId ? 'bg-primary/5' : ''}`}
                    onClick={() => setSelectedAgent(agent.agentId)}
                  >
                    <td className="px-4 py-3 text-xs font-semibold flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${i < 3 ? 'bg-amber-500/20 text-amber-500' : 'bg-muted text-muted-foreground'}`}>
                        {i + 1}
                      </span>
                      {agent.nom}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`font-black ${agent.avgScore >= 70 ? 'text-emerald-500' : agent.avgScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                        {agent.avgScore}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{agent.totalEvals}</td>
                    <td className="px-4 py-3 text-xs">{agent.totalRdv}</td>
                    <td className="px-4 py-3 text-xs text-emerald-500 font-semibold">{agent.rdvConfirmes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
