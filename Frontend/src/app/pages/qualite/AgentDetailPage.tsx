import React, { useEffect, useState } from 'react';
import { TrendingUp, ChevronDown, Phone, CalendarCheck, Target, ShieldCheck, Timer, History, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../../../services/api';

export default function AgentDetailPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [agentId, setAgentId] = useState<number | null>(null);
  const [perf, setPerf] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
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
    Promise.all([
      api.get(`/performance/agent/${agentId}`),
      api.get(`/quality/dashboard/agent-detail/${agentId}`),
    ]).then(([perfRes, detailRes]) => {
      setPerf(perfRes.data);
      setDetail(detailRes.data);
    }).catch(() => {});
  }, [agentId]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const cm = perf?.current_month;
  const prev = perf?.previous_month;
  const evaluations = detail?.evaluations || [];

  const trendData = cm?.daily_performance?.length
    ? cm.daily_performance.map((v: number, i: number) => ({ jour: `J${i+1}`, rdv: v }))
    : [];

  const evalChartData = [...evaluations].reverse().slice(0, 10).map((e: any) => ({
    date: new Date(e.evaluationDate || e.dateEvaluation).toLocaleDateString('fr-FR'),
    score: e.globalScore || e.noteGlobale
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-indigo-500 pl-6">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
            Détail <span className="text-indigo-500">Agent</span>
          </h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1 opacity-70">Performance et historique des évaluations</p>
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

      {/* Month-over-month comparison */}
      {cm && prev && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Appels', current: cm.calls, previous: prev.calls, unit: '' },
            { label: 'RDV', current: cm.appointments, previous: prev.appointments, unit: '' },
            { label: 'Taux conversion', current: cm.conversion_rate, previous: prev.conversion_rate, unit: '%' },
            { label: 'Score qualité', current: cm.quality_score, previous: 0, unit: '%' },
          ].map((kpi, i) => {
            const evo = kpi.previous > 0 ? Math.round((kpi.current - kpi.previous) / kpi.previous * 100) : 0;
            return (
              <div key={i} className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{kpi.label}</span>
                  <span className={`text-xs font-bold ${evo >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {evo >= 0 ? '+' : ''}{evo}%
                  </span>
                </div>
                <p className="text-2xl font-black tracking-tighter">{kpi.current}{kpi.unit}</p>
                <p className="text-xs text-muted-foreground">Mois préc. {kpi.previous}{kpi.unit}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily RDV performance */}
        {trendData.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> RDV quotidiens
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="jour" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="rdv" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Evaluation history */}
        {evalChartData.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" /> Scores évaluations
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={evalChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Evaluations table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <History className="w-4 h-4" /> Historique des évaluations
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/10 border-b border-border">
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Score</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Décision</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Commentaire</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {evaluations.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-muted-foreground text-xs">Aucune évaluation</td></tr>
              ) : evaluations.map((e: any, i: number) => (
                <tr key={e.id || i} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-xs">
                    {new Date(e.evaluationDate || e.dateEvaluation || e.DateEvaluation).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className={`font-black ${(e.globalScore || e.noteGlobale || 0) >= 70 ? 'text-emerald-500' : (e.globalScore || e.noteGlobale || 0) >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                      {e.globalScore || e.noteGlobale || 0}/100
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{e.decision || '-'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{e.commentaires || e.commentaire || e.Commentaire || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
