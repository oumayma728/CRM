import React, { useEffect, useMemo, useState } from 'react';
import { adminService } from '../../services/adminService';
import api from '../../services/api';
import { useChartTheme } from '../../hooks/useChartTheme';
import {
  Trophy, AlertCircle, Award, ChevronUp, ChevronDown, Search, Loader2, Users, Star
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * "Stats agents": the ranking (ex "Scorecards agents") and the detail of one agent (ex "Stats agents") in ONE place,
 * inside the "Gestion des agents" page.
 *
 * Removed on purpose because they were invented, not computed: the "skills matrix" (the score +/- fixed offsets),
 * the weekly trend drawn from the score when there was no data, and the "AI recommendation" text (the same sentence
 * for every agent). The "Écouter les appels" button did nothing and is gone too.
 */

interface ScorecardAgent {
  rang: number;
  agentId: number;
  agentNom: string;
  scoreGlobal: number;
  appels: number;
  conversions: number;
  qualite: number;
  aRevoir: number;
  tendance: string;
}

interface AgentSuivi {
  agentId: number;
  agentNom: string;
  score: number;
  appelsAVerifier: number;
  tendance: string;
}

const getTendanceIcon = (tendance: string) => {
  if (tendance === 'up') return <ChevronUp className="w-4 h-4 text-success" />;
  if (tendance === 'down') return <ChevronDown className="w-4 h-4 text-destructive" />;
  return <div className="w-4 h-4" />;
};

const getTendanceText = (tendance: string) =>
  tendance === 'up' ? 'En hausse' : tendance === 'down' ? 'En baisse' : 'Stable';

const getMedal = (rang: number) => {
  if (rang === 1) return <Trophy className="w-6 h-6 text-warning" />;
  if (rang === 2) return <Award className="w-6 h-6 text-muted-foreground" />;
  if (rang === 3) return <Award className="w-6 h-6 text-warning" />;
  return <span className="text-lg font-bold text-muted-foreground">#{rang}</span>;
};

function StatCard({ title, value, icon: Icon, tone }: { title: string; value: React.ReactNode; icon: any; tone: string }) {
  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{title}</span>
        <Icon className={`w-4 h-4 ${tone}`} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

export default function AgentsStatsPanel() {
  const chartTheme = useChartTheme();

  // ── ranking (scorecards) ────────────────────────────────────────────────
  const [ranking, setRanking] = useState<ScorecardAgent[]>([]);
  const [suivi, setSuivi] = useState<AgentSuivi[]>([]);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [rankingError, setRankingError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [scorecardsRes, suiviRes] = await Promise.all([adminService.getScorecards(), adminService.getAgentsSuivi()]);
        setRanking(Array.isArray(scorecardsRes.data) ? scorecardsRes.data : []);
        setSuivi(Array.isArray(suiviRes.data) ? suiviRes.data : []);
      } catch (e) {
        console.error('Erreur chargement du classement:', e);
        setRankingError(true);
      } finally {
        setRankingLoading(false);
      }
    })();
  }, []);

  const filtered = ranking.filter(a => (a.agentNom ?? '').toLowerCase().includes(searchTerm.toLowerCase()));
  const top3 = filtered.slice(0, 3);

  // ── detail of one agent ─────────────────────────────────────────────────
  const [agentNames, setAgentNames] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [agentData, setAgentData] = useState<any>(null);
  const [trend, setTrend] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getAgentsPerformance();
        const names = (data ?? []).map((a: any) => a.agent_name).filter(Boolean);
        setAgentNames(names);
        if (names.length > 0) setSelectedAgent(names[0]);
      } catch (e) {
        console.error('Erreur chargement des agents:', e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedAgent) return;
    setDetailLoading(true);
    Promise.allSettled([api.getStats(selectedAgent), api.getPerformanceTrendByName(selectedAgent)]).then(([stats, perf]) => {
      setAgentData(stats.status === 'fulfilled' ? stats.value : null);
      setTrend(perf.status === 'fulfilled' ? perf.value : null);
      setDetailLoading(false);
    });
  }, [selectedAgent]);

  const evolution = useMemo(
    () => (trend?.monthly_data ?? []).slice(-6).map((m: any) => ({ mois: m.month, score: m.score })),
    [trend]
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Stats agents</h1>
        <p className="text-muted-foreground mt-1">Classement, suivi et détail des performances de chaque agent</p>
      </div>

      {/* ── 1. Classement ─────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground border-l-4 border-primary pl-3">Classement</h2>

        {rankingLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : rankingError ? (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">Impossible de charger le classement des agents.</p>
          </div>
        ) : (
          <>
            {top3.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {top3.map(agent => (
                  <div key={agent.agentId} className={`rounded-xl p-6 text-center text-white ${agent.rang === 2 ? 'bg-gradient-to-r from-muted to-muted' : 'bg-gradient-to-r from-warning to-warning'}`}>
                    <div className="flex justify-center mb-3">{getMedal(agent.rang)}</div>
                    <h3 className="text-xl font-semibold">{agent.agentNom}</h3>
                    <p className="text-3xl font-bold mt-2">{agent.scoreGlobal}/100</p>
                    <div className="flex justify-center items-center gap-1 mt-2">
                      {getTendanceIcon(agent.tendance)}
                      <span className="text-sm opacity-90">{getTendanceText(agent.tendance)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un agent..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="glass-input w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      {['Rang', 'Agent', 'Score', 'Appels', 'Conversions', 'Qualité', 'À revoir', 'Tendance'].map(h => (
                        <th key={h} className="text-left p-4 text-sm font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">Aucun agent trouvé</td></tr>
                    ) : filtered.map(agent => (
                      <tr key={agent.agentId} className="border-b border-border hover:bg-muted transition-colors">
                        <td className="p-4"><div className="flex items-center gap-2">{getMedal(agent.rang)}<span className="text-foreground">#{agent.rang}</span></div></td>
                        <td className="p-4 font-medium text-foreground">{agent.agentNom}</td>
                        <td className="p-4"><span className="text-lg font-bold text-primary">{agent.scoreGlobal}</span></td>
                        <td className="p-4 text-muted-foreground">{agent.appels}</td>
                        <td className="p-4 text-success">{agent.conversions}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${agent.qualite}%` }} />
                            </div>
                            <span className="text-sm text-muted-foreground">{agent.qualite}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {agent.aRevoir > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-warning/15 text-warning">
                              <AlertCircle className="w-3 h-3" />{agent.aRevoir}
                            </span>
                          ) : <span className="text-muted-foreground">-</span>}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            {getTendanceIcon(agent.tendance)}
                            <span className={`text-sm ${agent.tendance === 'up' ? 'text-success' : agent.tendance === 'down' ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {getTendanceText(agent.tendance)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── 2. Agents nécessitant un suivi ───────────────────────────── */}
      {suivi.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-foreground border-l-4 border-primary pl-3">Agents nécessitant un suivi</h2>
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-4">
            {suivi.map(agent => (
              <div key={agent.agentId} className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-foreground">{agent.agentNom}</span>
                  <span className="px-2 py-1 rounded-full text-xs bg-destructive/15 text-destructive">Score : {agent.score}</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Vérifier {agent.appelsAVerifier} appel(s) récent(s)</li>
                  <li>• Suivre la tendance : {agent.tendance === 'down' ? 'à la baisse' : 'stable'}</li>
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 3. Détail d'un agent ─────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-foreground border-l-4 border-primary pl-3">Détail d'un agent</h2>
          {agentNames.length > 0 && (
            <div className="flex items-center gap-3 bg-card p-1 rounded-lg border border-border">
              <span className="text-xs font-medium px-3 text-muted-foreground uppercase">Agent :</span>
              <select
                value={selectedAgent}
                onChange={e => setSelectedAgent(e.target.value)}
                aria-label="Agent"
                className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer pr-8"
              >
                {agentNames.map(n => <option key={n} value={n} className="bg-card">{n}</option>)}
              </select>
            </div>
          )}
        </div>

        {agentNames.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
            Aucune analyse d'appel disponible pour le moment.
          </div>
        ) : detailLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : agentData ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard title="Qualité moyenne" value={`${agentData.avg_score}%`} icon={Award} tone="text-primary" />
              <StatCard title="Total appels" value={agentData.total_calls} icon={Users} tone="text-info" />
              <StatCard title="Positifs" value={agentData.sentiment_distribution?.POSITIVE || 0} icon={Star} tone="text-success" />
              <StatCard title="Négatifs" value={agentData.sentiment_distribution?.NEGATIVE || 0} icon={AlertCircle} tone="text-destructive" />
            </div>

            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">Évolution de la qualité</h3>
              {evolution.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Pas encore assez de données pour afficher l'évolution.</p>
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolution}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.2} vertical={false} />
                      <XAxis dataKey="mois" stroke={chartTheme.textColor} />
                      <YAxis stroke={chartTheme.textColor} />
                      <Tooltip contentStyle={chartTheme.tooltipStyle} />
                      <Line type="monotone" dataKey="score" stroke="#4ade80" strokeWidth={3} dot={{ r: 5, fill: '#4ade80' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-card rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
            Impossible de charger les statistiques de cet agent.
          </div>
        )}
      </section>
    </div>
  );
}
