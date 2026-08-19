import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Layout } from '../../components/Layout';
import { adminService } from '../../../services/adminService';
import api from '../../../services/api';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  TrendingUp, TrendingDown, Users, Phone, Target, RefreshCw,
  BarChart3, Brain, Zap, FileText, Search
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface DashboardData {
  agentsEnLigne: number;
  totalAgents: number;
  enAppel: number;
  appelsDuJour: number;
  tauxConversion: number;
  performanceHoraire: { heure: string; appels: number; conversions: number }[];
}

interface Overview {
  totalAppels: number;
  appelsToday: number;
  avgQualityScore: number;
  conversionRate: number;
}

interface ComparisonPeriod {
  current: { total: number; avg_score: number };
  previous: { total: number; avg_score: number };
  evolution: number;
  score_evol: number;
}

interface GlobalComparison {
  day: ComparisonPeriod;
  week: ComparisonPeriod;
  month: ComparisonPeriod;
}

interface AgentPerf {
  nom: string;
  avgScore: number;
  totalAppels: number;
  totalRdv: number;
}

interface RdvProduction {
  id: number;
  dateRendezVous: string;
  dateCreation: string;
  statut: string;
  contact: { nom: string; prenom: string; telephone: string; projet?: string } | null;
  agent: { nom: string; prenom: string } | null;
}

const KPI_ICONS = {
  calls: { icon: Phone, color: 'text-blue-500', bg: 'bg-blue-500/10', grad: 'from-blue-500 to-cyan-400' },
  score: { icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10', grad: 'from-emerald-500 to-teal-400' },
  conversion: { icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10', grad: 'from-purple-500 to-fuchsia-400' },
  agents: { icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10', grad: 'from-orange-500 to-amber-400' },
};

const statusBadgeClass = (statut: string) => {
  if (['CONFIRME', 'CONFIRME_CONF_CALL', 'CONFIRME_TOTAL', 'SIGNE'].includes(statut)) return 'badge-premium';
  if (statut === 'ANNULE') return 'badge-refuse';
  return 'badge-attente';
};

const statusBadgeLabel = (statut: string) => {
  const labels: Record<string, string> = {
    BRUT: 'En attente', CONFIRME: 'Confirmé', CONFIRME_CONF_CALL: 'Confirmé',
    CONFIRME_TOTAL: 'Confirmé', ANNULE: 'Annulé', SIGNE: 'Signé',
  };
  return labels[statut] || statut;
};

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [comparison, setComparison] = useState<GlobalComparison | null>(null);
  const [agentsPerf, setAgentsPerf] = useState<AgentPerf[]>([]);
  const [production, setProduction] = useState<RdvProduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [searchClient, setSearchClient] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedProjet, setSelectedProjet] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, agentsRes, ovRes, agRes, cmpRes, prodRes] = await Promise.allSettled([
        adminService.getDashboard(),
        adminService.getAgentsStatut(),
        api.get('/analytics/overview'),
        api.get('/analytics/agents-performance'),
        api.get('/performance/global-comparison'),
        api.get('/qualite/rdv-calendrier'),
      ]);
      if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data);
      if (ovRes.status === 'fulfilled') setOverview(ovRes.value.data);
      if (agRes.status === 'fulfilled') setAgentsPerf(agRes.value.data);
      if (cmpRes.status === 'fulfilled') setComparison(cmpRes.value.data);
      if (prodRes.status === 'fulfilled') setProduction(Array.isArray(prodRes.value.data) ? prodRes.value.data : []);
      if (agentsRes.status === 'rejected') console.error('agents statut error:', agentsRes.reason);
    } catch (err) {
      console.error('Erreur chargement dashboard admin:', err);
      toast.error('Erreur lors du chargement du tableau de bord');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredProduction = useMemo(() => {
    return production.filter(item => {
      const clientName = `${item.contact?.prenom ?? ''} ${item.contact?.nom ?? ''}`.toLowerCase();
      if (searchClient && !clientName.includes(searchClient.toLowerCase())) return false;
      if (selectedAgent) {
        const agentName = `${item.agent?.prenom ?? ''} ${item.agent?.nom ?? ''}`.trim();
        if (agentName !== selectedAgent) return false;
      }
      if (selectedProjet && item.contact?.projet !== selectedProjet) return false;
      const itemDate = new Date(item.dateRendezVous);
      if (dateFrom && itemDate < new Date(dateFrom + 'T00:00:00')) return false;
      if (dateTo && itemDate > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [production, searchClient, selectedAgent, selectedProjet, dateFrom, dateTo]);

  const agentNames = useMemo(() => {
    const set = new Set<string>();
    production.forEach(p => { if (p.agent) set.add(`${p.agent.prenom} ${p.agent.nom}`.trim()); });
    return Array.from(set);
  }, [production]);

  const projets = useMemo(() => {
    const set = new Set<string>();
    production.forEach(p => { if (p.contact?.projet) set.add(p.contact.projet); });
    return Array.from(set);
  }, [production]);

  const kpiCards = [
    { label: 'Appels Totaux', value: overview?.totalAppels ?? 0, key: 'calls' as const },
    { label: 'Score Moyen', value: `${overview?.avgQualityScore ?? 0}%`, key: 'score' as const },
    { label: 'Conversion', value: `${overview?.conversionRate ?? 0}%`, key: 'conversion' as const },
    { label: 'Agents Actifs', value: dashboard?.agentsEnLigne ?? 0, key: 'agents' as const },
  ];

  const bestAgent = useMemo(() => agentsPerf.length > 0 ? [...agentsPerf].sort((a, b) => b.avgScore - a.avgScore)[0] : null, [agentsPerf]);
  const peakHour = useMemo(() => {
    const data = dashboard?.performanceHoraire ?? [];
    return data.length > 0 ? [...data].sort((a, b) => b.appels - a.appels)[0] : null;
  }, [dashboard]);

  const handleGenerateReport = () => {
    const lines = [
      `Rapport du ${new Date().toLocaleDateString('fr-FR')}`,
      `Appels totaux : ${overview?.totalAppels ?? 0}`,
      bestAgent ? `Meilleur agent : ${bestAgent.nom} (${bestAgent.avgScore}/100)` : null,
      peakHour ? `Pic d'activité : ${peakHour.heure} (${peakHour.appels} appels)` : null,
    ].filter(Boolean);
    toast.info(lines.join('\n'), { autoClose: 8000 });
  };

  const generatePDF = () => {
    if (!comparison) { toast.warn('Aucune donnée disponible pour générer le PDF'); return; }
    setExporting(true);
    try {
      const doc = new jsPDF();
      const now = new Date().toLocaleString('fr-FR');
      doc.setFontSize(18);
      doc.text('Rapport de Performance CRM', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Généré le : ${now}`, 14, 27);

      autoTable(doc, {
        startY: 35,
        head: [['Période', 'Appels', 'Évolution', 'Score Moyen', 'Évol. Score']],
        body: [
          ["Aujourd'hui", comparison.day.current.total, `${comparison.day.evolution}%`, `${comparison.day.current.avg_score}%`, `${comparison.day.score_evol}%`],
          ['Cette semaine', comparison.week.current.total, `${comparison.week.evolution}%`, `${comparison.week.current.avg_score}%`, `${comparison.week.score_evol}%`],
          ['Ce mois', comparison.month.current.total, `${comparison.month.evolution}%`, `${comparison.month.current.avg_score}%`, `${comparison.month.score_evol}%`],
        ],
        theme: 'grid',
      });

      if (agentsPerf.length > 0) {
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(14);
        doc.text('Performance par Agent', 14, finalY);
        autoTable(doc, {
          startY: finalY + 5,
          head: [['Agent', 'Score', 'Appels', 'RDV']],
          body: agentsPerf.map(a => [a.nom, `${a.avgScore}%`, a.totalAppels, a.totalRdv]),
          theme: 'striped',
        });
      }

      doc.save(`Rapport_Performance_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setExporting(false);
    }
  };

  const comparisonCards = comparison ? [
    { title: "Aujourd'hui vs Hier", period: comparison.day },
    { title: 'Cette Semaine vs Précédente', period: comparison.week },
    { title: 'Ce Mois vs Précédent', period: comparison.month },
  ] : [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Vue d'ensemble <span className="text-gradient-primary">Dashboard</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Pilotage de l'activité en temps réel</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={generatePDF}
              disabled={exporting || loading}
              className="h-10 px-4 bg-emerald-500 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/25 hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {exporting ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              Export PDF
            </button>
            <button
              onClick={fetchAll}
              className="p-2.5 bg-card border border-border rounded-xl hover:bg-accent transition-all text-primary cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {kpiCards.map((kpi, i) => {
            const style = KPI_ICONS[kpi.key];
            const Icon = style.icon;
            return (
              <div key={i} className="glass-card-hover p-5 relative overflow-hidden group">
                <div className={`w-11 h-11 rounded-xl ${style.bg} flex items-center justify-center mb-3 ${style.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-foreground tabular-nums">{loading ? '...' : kpi.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{kpi.label}</div>
                <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${style.grad} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            );
          })}
        </div>

        {/* Comparison cards */}
        {comparisonCards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
            {comparisonCards.map((item, i) => {
              const positive = item.period.evolution >= 0;
              return (
                <div key={i} className="glass-card p-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">{item.title}</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xl font-black text-foreground tabular-nums">{item.period.current.total} appels</div>
                      <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${positive ? 'text-emerald-500' : 'text-red-500'}`}>
                        {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {item.period.evolution > 0 ? '+' : ''}{item.period.evolution}% volume
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary tabular-nums">{item.period.current.avg_score}%</div>
                      <div className={`text-[10px] font-bold mt-1 ${item.period.score_evol >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {item.period.score_evol > 0 ? '+' : ''}{item.period.score_evol}% qualité
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Activité vs Conversions</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dashboard?.performanceHoraire ?? []}>
                <defs>
                  <linearGradient id="colorCallsAdmin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="heure" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="appels" name="Appels" stroke="#6366f1" strokeWidth={3} fill="url(#colorCallsAdmin)" />
                <Area type="monotone" dataKey="conversions" name="Conversions" stroke="#10b981" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* AI Insights */}
          <div className="space-y-4">
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Insights</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                  <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Pic d'activité</p>
                  <p className="text-xs font-medium">
                    {peakHour ? `${peakHour.heure} avec ${peakHour.appels} appels` : 'Pas assez de données'}
                  </p>
                </div>
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Meilleur agent</p>
                  <p className="text-xs font-medium">
                    {bestAgent ? `${bestAgent.nom} — score ${bestAgent.avgScore}/100` : 'Pas assez de données'}
                  </p>
                </div>
                <button
                  onClick={handleGenerateReport}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/25 hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Générer un résumé <Zap className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Récapitulatif Rapide</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Appels Aujourd'hui</span>
                  <span className="text-xs font-black tabular-nums">{overview?.appelsToday ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">En appel</span>
                  <span className="text-xs font-black tabular-nums">{dashboard?.enAppel ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Agents en ligne</span>
                  <span className="text-xs font-black tabular-nums">{dashboard?.agentsEnLigne ?? 0}/{dashboard?.totalAgents ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Historique Production */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Historique Production</h3>
              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-black tabular-nums">
                {filteredProduction.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher client..."
                  value={searchClient}
                  onChange={e => setSearchClient(e.target.value)}
                  className="pl-9 pr-3 py-2 rounded-xl border border-border bg-background/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border bg-background/50 text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Tous les agents</option>
                {agentNames.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select value={selectedProjet} onChange={e => setSelectedProjet(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border bg-background/50 text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Tous les projets</option>
                {projets.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border bg-background/50 text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border bg-background/50 text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">GSM</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Client</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Projet</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date RDV</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Création</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Agent</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProduction.map(item => (
                  <tr key={item.id} className="hover:bg-primary/[0.03] transition-colors">
                    <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{item.contact?.telephone}</td>
                    <td className="px-4 py-4 font-semibold">{item.contact ? `${item.contact.prenom} ${item.contact.nom}` : '—'}</td>
                    <td className="px-4 py-4 text-xs">{item.contact?.projet || '—'}</td>
                    <td className="px-4 py-4 text-xs tabular-nums">{new Date(item.dateRendezVous).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-4 text-xs text-muted-foreground tabular-nums">
                      {item.dateCreation ? new Date(item.dateCreation).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-4 text-xs">{item.agent ? `${item.agent.prenom} ${item.agent.nom}` : '—'}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusBadgeClass(item.statut)}`}>
                        {statusBadgeLabel(item.statut)}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredProduction.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center">
                      <div className="text-muted-foreground text-sm">Aucun RDV trouvé</div>
                      <p className="text-xs text-muted-foreground/60 mt-1">Ajustez vos filtres ou réessayez plus tard</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
