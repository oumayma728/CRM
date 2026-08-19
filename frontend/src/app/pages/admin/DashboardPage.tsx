import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Users, Phone,
  Target, Download, RefreshCw,
  ArrowUp, ArrowDown, Activity, AlertTriangle,
  BarChart3, Brain, Zap, ArrowUpRight, FileText,
  PlayCircle, Search
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { useChartTheme } from '../../hooks/useChartTheme';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';

interface KPIData {
  totalCalls: number;
  avgScore: number;
  conversionRate: number;
  activeAgents: number;
  callsToday: number;
  pendingFollowups: number;
  avgCallDuration: number;
}

interface ComparisonData {
  day: { current: any; previous: any; evolution: number; score_evol: number };
  week: { current: any; previous: any; evolution: number; score_evol: number };
  month: { current: any; previous: any; evolution: number; score_evol: number };
}

const KPI_ICONS = {
  calls: { icon: Phone, color: 'text-blue-500', bg: 'bg-blue-500/10', grad: 'from-blue-500 to-cyan-400' },
  score: { icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10', grad: 'from-emerald-500 to-teal-400' },
  conversion: { icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10', grad: 'from-purple-500 to-fuchsia-400' },
  agents: { icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10', grad: 'from-orange-500 to-amber-400' },
};

export default function DashboardPage() {
  const chartTheme = useChartTheme();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIData>({
    totalCalls: 0, avgScore: 0, conversionRate: 0,
    activeAgents: 0, callsToday: 0, pendingFollowups: 0, avgCallDuration: 0
  });
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState('today');
  const [chartData, setChartData] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);

  // Agent Management State
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [searchClient, setSearchClient] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [formData, setFormData] = useState({
    username: '', password: '', name: '', role: 'agent', email: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [overviewRes, agentsRes, comparisonRes, appointmentsRes] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getAgents(),
        api.getGlobalComparison(),
        api.getAppointments()
      ]);

      setKpis({
        totalCalls: overviewRes.total_calls || 0,
        avgScore: overviewRes.avg_score || 0,
        conversionRate: overviewRes.conversion_rate || 0,
        activeAgents: overviewRes.active_agents || 0,
        callsToday: overviewRes.calls_today || 0,
        pendingFollowups: overviewRes.pending_followups || 0,
        avgCallDuration: overviewRes.avg_duration || 0
      });

      setComparison(comparisonRes);
      setAgents(agentsRes);
      setAppointments(Array.isArray(appointmentsRes) ? appointmentsRes : []);

      if (overviewRes.hourly && overviewRes.hourly.length > 0) {
        setChartData(overviewRes.hourly.map((h: any) => ({
          name: `${h.hour}h`,
          calls: h.appels,
          convs: Math.round(h.appels * 0.3)
        })));
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error(`Erreur: ${error instanceof Error ? error.message : 'chargement du tableau de bord'}`);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!comparison) {
      alert('Aucune donnée disponible pour générer le PDF');
      return;
    }

    setExporting(true);
    try {
      const doc = new jsPDF();
      const now = new Date().toLocaleString('fr-FR');

      doc.setFontSize(22);
      doc.setTextColor(30, 41, 59);
      doc.text("RAPPORT DE PERFORMANCE CRM AI", 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Genere le : ${now}`, 14, 30);
      doc.text("Analyse comparative de l'activite du centre", 14, 35);

      const tableData = [
        ["Periode", "Appels (Actuel)", "Evolution", "Score Moyen", "Evol. Score"],
        ["Aujourd'hui", comparison.day.current.total, `${comparison.day.evolution}%`, `${comparison.day.current.avg_score}%`, `${comparison.day.score_evol}%`],
        ["Cette Semaine", comparison.week.current.total, `${comparison.week.evolution}%`, `${comparison.week.current.avg_score}%`, `${comparison.week.score_evol}%`],
        ["Ce Mois", comparison.month.current.total, `${comparison.month.evolution}%`, `${comparison.month.current.avg_score}%`, `${comparison.month.score_evol}%`],
      ];

      (doc as any).autoTable({
        startY: 45,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: 'grid',
        headStyles: { fillStyle: '#6366f1', textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      if (agents.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(30, 41, 59);
        doc.text("Performance par Agent", 14, (doc as any).lastAutoTable.finalY + 15);

        const agentTableData = agents.map((a: any) => [
          a.name || a.username || 'N/A',
          a.role || 'agent',
          `${a.score || 70}%`,
          "Bon"
        ]);

        (doc as any).autoTable({
          startY: (doc as any).lastAutoTable.finalY + 5,
          head: [["Nom", "Role", "Score", "Statut"]],
          body: agentTableData,
          theme: 'striped',
        });
      }

      doc.save(`Rapport_Performance_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Erreur lors de la generation du PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleEdit = (agent: any) => {
    setEditingAgent(agent);
    setFormData({
      username: agent.username,
      password: '',
      name: agent.name,
      role: agent.role,
      email: agent.email || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet agent ?')) return;
    try {
      await api.deleteUser(userId);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingAgent) {
        await api.updateUser(editingAgent.id, formData);
      } else {
        await api.createUser(formData);
      }
      setShowModal(false);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredAppointments = appointments.filter((item: any) => {
    const clientMatch =
      item.client_name
        ?.toLowerCase()
        .includes(searchClient.toLowerCase());

    const agentMatch =
      selectedAgent === "" ||
      item.agent_name === selectedAgent;

    const projectMatch =
      selectedProject === "" ||
      item.project_type === selectedProject;

    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
    const hasDateFilter = !!(from || to);
    const itemDate = item.appointment_date
      ? new Date(item.appointment_date)
      : item.created_at
        ? new Date(item.created_at)
        : null;
    let dateMatch = true;
    if (hasDateFilter) {
      if (!itemDate || isNaN(itemDate.getTime())) {
        dateMatch = false;
      } else {
        if (from && itemDate < from) dateMatch = false;
        if (to && itemDate > to) dateMatch = false;
      }
    }

    return clientMatch && agentMatch && projectMatch && dateMatch;
  });

  const statusBadge = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'confirmed' || s === 'confirme') return 'badge-premium';
    if (s === 'cancelled' || s === 'refus') return 'badge-refuse';
    return 'badge-attente';
  };

  const statusLabel = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'confirmed' || s === 'confirme') return 'Confirmé';
    if (s === 'cancelled' || s === 'refus') return 'Refusé';
    return 'En attente';
  };

  const kpiCards = [
    { label: 'Appels Totaux', value: kpis.totalCalls, key: 'calls' },
    { label: 'Score Moyen', value: `${kpis.avgScore}%`, key: 'score' },
    { label: 'Conversion', value: `${kpis.conversionRate}%`, key: 'conversion' },
    { label: 'Agents Actifs', value: kpis.activeAgents, key: 'agents' },
  ] as const;

  return (
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
            className="h-10 px-4 bg-emerald-500 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/25 hover:opacity-90 hover:-translate-y-[1px] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer"
          >
            {exporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generation...
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                Export PDF
              </>
            )}
          </button>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-10 px-4 bg-card border border-border rounded-xl text-xs font-bold uppercase tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-colors hover:border-primary/40"
          >
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
          <button
            onClick={fetchDashboardData}
            className="p-2.5 bg-card border border-border rounded-xl hover:bg-accent hover:border-primary/40 transition-all text-primary cursor-pointer"
            aria-label="Actualiser"
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
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-300" />
              <div className={`w-11 h-11 rounded-xl ${style.bg} flex items-center justify-center mb-3 ${style.color} transition-transform duration-300 group-hover:scale-110`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black text-foreground tabular-nums">{loading ? '...' : kpi.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{kpi.label}</div>
              <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${style.grad} opacity-0 group-hover:opacity-100 transition-opacity`} />
            </div>
          );
        })}
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
        {comparison && [
          { title: 'Aujourd\'hui vs Hier', period: comparison.day },
          { title: 'Cette Semaine vs Précédente', period: comparison.week },
          { title: 'Ce Mois vs Précédent', period: comparison.month },
        ].map((item, i) => {
          const positive = (item.period?.evolution ?? 0) >= 0;
          return (
            <div key={i} className="glass-card p-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">{item.title}</h4>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-black text-foreground tabular-nums">{item.period?.current?.total ?? 0} appels</div>
                  <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${positive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {item.period.evolution > 0 ? '+' : ''}{item.period?.evolution ?? 0}% volume
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-primary tabular-nums">{item.period?.current?.avg_score ?? 0}%</div>
                  <div className={`text-[10px] font-bold mt-1 ${item.period.score_evol >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {item.period.score_evol > 0 ? '+' : ''}{item.period?.score_evol ?? 0}% qualité
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Activité vs Conversions</h3>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest opacity-50">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-primary rounded-full" /> Appels</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> RDV</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: chartTheme.textColor }} axisLine={false} tickLine={false} stroke={chartTheme.textColor} />
              <YAxis tick={{ fontSize: 10, fill: chartTheme.textColor }} axisLine={false} tickLine={false} stroke={chartTheme.textColor} />
              <Tooltip contentStyle={chartTheme.tooltipStyle} />
              <Area type="monotone" dataKey="calls" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#colorCalls)" />
              <Area type="monotone" dataKey="convs" stroke="#10b981" strokeWidth={3} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insights Sidebar */}
        <div className="space-y-4">
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Brain className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">AI Intelligence</h3>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Prédiction</p>
                <p className="text-xs font-medium leading-relaxed">Pic d'appels prévu demain à 14:00. Prévoyez 2 agents supplémentaires.</p>
              </div>
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Performance</p>
                <p className="text-xs font-medium leading-relaxed">Taux de conversion en hausse de 4% ce matin. Très bonne dynamique d'équipe.</p>
              </div>
              <button
                onClick={() => {
                  const report = `Rapport IA du ${new Date().toLocaleDateString('fr-FR')} :
                     - Total Appels: ${kpis.totalCalls}
                     - Meilleur Agent: ${agents.length > 0 ? agents.sort((a, b) => (b.score || 0) - (a.score || 0))[0].name : 'N/A'}
                     - Pic d'activité: ${chartData.length > 0 ? chartData.sort((a, b) => b.calls - a.calls)[0].name : 'N/A'}
                     - Recommandation: Concentrer les effectifs sur le créneau de l'après-midi.`;
                  alert(report);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/25 hover:opacity-90 hover:-translate-y-[1px] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Générer Rapport IA <Zap className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="glass-card p-6 flex-1">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Récapitulatif Rapide</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground">Appels Aujourd'hui</span>
                <span className="text-xs font-black tabular-nums">{kpis.callsToday}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground">Durée Moyenne</span>
                <span className="text-xs font-black tabular-nums">{kpis.avgCallDuration} min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground">Relances en attente</span>
                <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded-full text-[10px] font-black uppercase tabular-nums">{kpis.pendingFollowups}</span>
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
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">HISTORIQUE PRODUCTION</h3>
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-black tabular-nums">
              {filteredAppointments.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher client..."
                value={searchClient}
                onChange={(e) => setSearchClient(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-xl border border-border bg-background/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background/50 text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="">Tous les agents</option>
              {[...new Set(appointments.map((a: any) => a.agent_name))].map((agent: any) => (
                <option key={agent} value={agent}>{agent}</option>
              ))}
            </select>

            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background/50 text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="">Tous les projets</option>
              {[...new Set(appointments.map((a: any) => a.project_type))].map((project: any) => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background/50 text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              title="Date de début"
            />

            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background/50 text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              title="Date de fin"
            />

            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); }}
                className="px-3 py-2 rounded-xl border border-border bg-background/50 text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors cursor-pointer"
                title="Réinitialiser les dates"
              >
                ✕
              </button>
            )}
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
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Création du RDV</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Agent</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Statut</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Enregistrement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAppointments.map((item: any, index: number) => (
                <tr key={item.id || index} className="hover:bg-primary/[0.03] transition-colors">
                  <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{item.client_phone}</td>
                  <td className="px-4 py-4 font-semibold">{item.client_name}</td>
                  <td className="px-4 py-4 text-xs">{item.project_type}</td>
                  <td className="px-4 py-4 text-xs tabular-nums">{item.appointment_date}</td>
                  <td className="px-4 py-4 text-xs text-muted-foreground tabular-nums">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })
                      : '-'}
                  </td>
                  <td className="px-4 py-4 text-xs">{item.agent_name}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusBadge(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toast('Aucun enregistrement disponible pour ce RDV', { icon: '🔇' })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 hover:border-primary/40 transition-colors text-xs font-medium cursor-pointer"
                      title="Écouter l'enregistrement"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      Lecture
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAppointments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <div className="text-muted-foreground text-sm">Aucun RDV trouvé</div>
                    <p className="text-xs text-muted-foreground/60 mt-1">Ajustez vos filtres ou réessayez plus tard</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-scale">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-fade-in-scale duration-300">
            <div className="p-6 border-b border-border bg-muted/20">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">
                {editingAgent ? 'Modifier l\'agent' : 'Ajouter un agent'}
              </h3>
            </div>
            <div className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nom complet</label>
                  <input
                    className="w-full px-4 py-2.5 bg-background/50 text-foreground placeholder:text-muted-foreground border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all"
                    placeholder="Jean Dupont"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Login (Pseudo)</label>
                  <input
                    className="w-full px-4 py-2.5 bg-background/50 text-foreground placeholder:text-muted-foreground border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all"
                    placeholder="jdupont"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email professionnel</label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 bg-background/50 text-foreground placeholder:text-muted-foreground border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mot de passe</label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 bg-background/50 text-foreground placeholder:text-muted-foreground border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all"
                  placeholder={editingAgent ? "•••••••• (vide pour garder)" : "8 caractères min."}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Rôle système</label>
                <select
                  className="w-full px-4 py-2.5 bg-background/50 text-foreground border border-border rounded-xl text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-primary/20 transition-all"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="agent">Conseiller Client (Agent)</option>
                  <option value="qualite">Service Qualité (Superviseur)</option>
                  <option value="admin">Administrateur Système</option>
                </select>
              </div>
            </div>
            <div className="p-6 bg-muted/20 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted rounded-xl transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/25 hover:opacity-90 transition-all cursor-pointer"
              >
                {editingAgent ? 'Sauvegarder' : 'Créer l\'agent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}