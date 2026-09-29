import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import api from '../../services/crmApi';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line
} from 'recharts';
import {
  AlertTriangle, Users, Phone, Calendar, TrendingUp, TrendingDown, Shield, Crown,
  Activity, MapPin, RefreshCw, BarChart3, LayoutGrid, Target, AlertCircle,
  Clock, Coffee, UserCheck, UserX, PlayCircle, WifiOff, DoorOpen, Timer
} from 'lucide-react';

type TabId = 'overview' | 'analytics' | 'performance' | 'pointage';

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'overview', label: "Vue d'ensemble", icon: LayoutGrid },
  { id: 'analytics', label: 'Analytique Avancé', icon: BarChart3 },
  { id: 'performance', label: 'Performance des appels', icon: TrendingUp },
  { id: 'pointage', label: 'Pointage', icon: Clock },
];

const tooltipStyle = {
  backgroundColor: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontSize: '12px',
};

interface DashboardData {
  agentsEnLigne: number;
  totalAgents: number;
  enAppel: number;
  appelsDuJour: number;
  tauxConversion: number;
  alertes: { agentNom: string; message: string; type: string }[];
  performanceHoraire: { heure: string; appels: number; conversions: number }[];
}

interface AgentStatut {
  id: number;
  nom: string;
  prenom: string;
  statut: string;
  dureeAppel: string;
  appels: number;
  conversions: number;
  score: number;
}

interface PerfData {
  currentMonth: { totalCalls: number; conversions: number; conversionRate: number; refusals: number; refusalRate: number; avgDuration: number };
  previousMonth: { totalCalls: number; conversions: number; conversionRate: number; refusals: number; refusalRate: number; avgDuration: number };
  evolution: { totalCalls: number; conversions: number; conversionRate: number; refusalRate: number; avgDuration: number };
  monthlyData: { month: string; calls: number; conversions: number; refusals: number }[];
  rendementStatus: string;
  mistakes: string[];
}

interface TeamAgentLive {
  userId: number;
  userName: string;
  userRole: string;
  status: string;
  clockIn?: string;
  workDurationMinutes?: number;
  currentBreakType?: string;
  totalBreakMinutes?: number;
}

const formatLiveTime = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const formatLiveDuration = (minutes?: number) => {
  if (minutes == null || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}` : `${m} min`;
};

const LiveStatusBadge = ({ status }: { status: string }) => {
  if (status === 'active')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success"><PlayCircle className="w-3 h-3" /> En poste</span>;
  if (status === 'break')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning"><Coffee className="w-3 h-3" /> Pause</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground"><WifiOff className="w-3 h-3" /> Hors ligne</span>;
};

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [agents, setAgents] = useState<AgentStatut[]>([]);
  const [loading, setLoading] = useState(true);

  const [overview, setOverview] = useState<any>(null);
  const [agentsPerf, setAgentsPerf] = useState<any[]>([]);
  const [geo, setGeo] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [perf, setPerf] = useState<PerfData | null>(null);
  const [perfLoading, setPerfLoading] = useState(true);

  const [liveAgents, setLiveAgents] = useState<TeamAgentLive[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    const [ovRes, agRes, geoRes] = await Promise.allSettled([
      api.get('/analytics/overview'),
      api.get('/analytics/agents-performance'),
      api.get('/analytics/geo'),
    ]);
    if (ovRes.status === 'fulfilled') setOverview(ovRes.value.data);
    else console.error('overview error:', (ovRes as PromiseRejectedResult).reason?.response?.data ?? (ovRes as PromiseRejectedResult).reason);
    if (agRes.status === 'fulfilled') setAgentsPerf(agRes.value.data);
    else console.error('agents-performance error:', (agRes as PromiseRejectedResult).reason?.response?.data ?? (agRes as PromiseRejectedResult).reason);
    if (geoRes.status === 'fulfilled') setGeo(geoRes.value.data);
    else console.error('geo error:', (geoRes as PromiseRejectedResult).reason?.response?.data ?? (geoRes as PromiseRejectedResult).reason);
    setAnalyticsLoading(false);
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    setPerfLoading(true);
    api.get('/performance/comparison')
      .then(r => setPerf(r.data))
      .catch(() => {})
      .finally(() => setPerfLoading(false));
  }, []);

  const fetchLive = useCallback(async () => {
    try {
      const res = await api.get('/attendance/team-detail');
      setLiveAgents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Erreur chargement pointage en direct:', err);
    } finally {
      setLiveLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 30000);
    return () => clearInterval(interval);
  }, [fetchLive]);

  const presentLive = liveAgents.filter(a => a.status === 'active' || a.status === 'break');
  const onBreakLive = liveAgents.filter(a => a.status === 'break');
  const absentLive = liveAgents.filter(a => a.status !== 'active' && a.status !== 'break');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashboardRes, agentsRes] = await Promise.all([
          adminService.getDashboard(),
          adminService.getAgentsStatut()
        ]);
        setDashboard(dashboardRes.data);
        setAgents(agentsRes.data);
      } catch (error) {
        console.error('Erreur chargement dashboard superadmin:', error);
        setDashboard({
          agentsEnLigne: 7,
          totalAgents: 8,
          enAppel: 4,
          appelsDuJour: 284,
          tauxConversion: 64.1,
          alertes: [
            { agentNom: 'Agent 1', message: 'Pause prolongée (20 min)', type: 'pause' },
            { agentNom: 'Agent 2', message: 'Hors ligne depuis 1h', type: 'offline' },
          ],
          performanceHoraire: [
            { heure: '08:00', appels: 12, conversions: 7 },
            { heure: '09:00', appels: 25, conversions: 15 },
            { heure: '10:00', appels: 38, conversions: 22 },
            { heure: '11:00', appels: 42, conversions: 28 },
            { heure: '12:00', appels: 18, conversions: 10 },
            { heure: '13:00', appels: 22, conversions: 14 },
            { heure: '14:00', appels: 45, conversions: 30 },
            { heure: '15:00', appels: 50, conversions: 35 },
          ],
        });
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatutColor = (statut: string) => {
    switch (statut?.toLowerCase()) {
      case 'en_appel': return 'bg-success/15 text-success';
      case 'disponible': return 'bg-primary/15 text-primary';
      case 'pause': return 'bg-warning/15 text-warning';
      case 'hors_ligne': return 'bg-destructive/15 text-destructive';
      default: return 'bg-muted text-foreground';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut?.toLowerCase()) {
      case 'en_appel': return 'En appel';
      case 'disponible': return 'Disponible';
      case 'pause': return 'En pause';
      case 'hors_ligne': return 'Hors ligne';
      default: return statut || 'Inconnu';
    }
  };

  const perfStatCard = (label: string, current: number, previous: number, evo: number, unit = '') => (
    <div className="glass-card p-5">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold">{current}{unit}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-muted-foreground">Mois préc. {previous}{unit}</span>
        <span className={`text-xs font-medium flex items-center gap-0.5 ${evo >= 0 ? 'text-success' : 'text-destructive'}`}>
          {evo >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(evo)}%
        </span>
      </div>
    </div>
  );

  return (
    <><div className="p-6 space-y-6">

        {/* Header SuperAdmin */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Dashboard Super Admin</h1>
              <p className="text-sm text-muted-foreground">Vue temps réel — accès complet</p>
            </div>
          </div>
          <Link
            to="/superadmin/permissions"
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors"
          >
            <Shield className="w-4 h-4" />
            Gérer les permissions
          </Link>
        </div>

        {/* Navbar interne */}
        <div className="glass-card flex items-center gap-1 p-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
        <>
        {/* Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-2" />
                <div className="h-8 bg-muted rounded w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Agents en ligne</p>
                <Users className="w-4 h-4 text-success" />
              </div>
              <p className="text-3xl font-bold text-foreground">
                {dashboard?.agentsEnLigne ?? 0}
                <span className="text-sm font-normal text-muted-foreground ml-1">/ {dashboard?.totalAgents ?? 0}</span>
              </p>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">En appel</p>
                <Phone className="w-4 h-4 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground">{dashboard?.enAppel ?? 0}</p>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Appels du jour</p>
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground">{dashboard?.appelsDuJour ?? 0}</p>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Taux conversion</p>
                <TrendingUp className="w-4 h-4 text-warning" />
              </div>
              <p className="text-3xl font-bold text-foreground">{dashboard?.tauxConversion?.toFixed(1) ?? 0}%</p>
            </div>
          </div>
        )}

        {/* Performance chart + Alertes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="glass-card lg:col-span-2 p-4">
            <h2 className="text-sm font-semibold text-foreground mb-4">Performance horaire</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dashboard?.performanceHoraire ?? []}>
                <defs>
                  <linearGradient id="appelsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="convsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-4)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-chart-4)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="heure" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="appels" name="Appels" stroke="var(--color-chart-1)" fill="url(#appelsGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="conversions" name="Conversions" stroke="var(--color-chart-4)" fill="url(#convsGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Alertes */}
          <div className="glass-card p-4">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Alertes actives
            </h2>
            {(dashboard?.alertes ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune alerte</p>
            ) : (
              <div className="space-y-2">
                {(dashboard?.alertes ?? []).map((alerte, i) => (
                  <div
                    key={i}
                    className={`rounded-lg p-3 text-sm ${
                      alerte.type === 'offline'
                        ? 'bg-destructive/10 border border-destructive/30'
                        : 'bg-warning/10 border border-warning/30'
                    }`}
                  >
                    <p className="font-medium text-foreground">{alerte.agentNom}</p>
                    <p className="text-muted-foreground mt-0.5">{alerte.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Agents en temps réel */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Agents — statut en temps réel</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Chargement...</div>
          ) : agents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Aucun agent trouvé</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2 text-muted-foreground font-medium">Agent</th>
                    <th className="text-left px-4 py-2 text-muted-foreground font-medium">Statut</th>
                    <th className="text-left px-4 py-2 text-muted-foreground font-medium">Durée appel</th>
                    <th className="text-right px-4 py-2 text-muted-foreground font-medium">Appels</th>
                    <th className="text-right px-4 py-2 text-muted-foreground font-medium">Conversions</th>
                    <th className="text-right px-4 py-2 text-muted-foreground font-medium">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {agent.prenom} {agent.nom}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatutColor(agent.statut)}`}>
                          {getStatutLabel(agent.statut)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{agent.dureeAppel || '—'}</td>
                      <td className="px-4 py-3 text-right text-foreground">{agent.appels}</td>
                      <td className="px-4 py-3 text-right text-foreground">{agent.conversions}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${
                          agent.score >= 80 ? 'text-success' :
                          agent.score >= 60 ? 'text-warning' : 'text-destructive'
                        }`}>
                          {agent.score}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
        )}

        {activeTab === 'analytics' && (
        <>
        {/* ── Analytique Avancé (fusionné depuis Analytique Appels + Analytics Avancé) ── */}
        <div className="flex items-center justify-between border-l-4 border-primary pl-4 pt-2">
          <div>
            <h2 className="text-lg font-bold text-foreground">Analytique Avancé</h2>
            <p className="text-sm text-muted-foreground">Statuts RDV, performance par agent, répartition géographique</p>
          </div>
          <button
            onClick={loadAnalytics}
            className="px-3 py-2 bg-muted text-foreground text-xs font-medium rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3 h-3 ${analyticsLoading ? 'animate-spin' : ''}`} /> Actualiser
          </button>
        </div>

        {analyticsLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Chargement des analytics...
          </div>
        ) : (
          <>
            {/* Statuts RDV + Métriques clés */}
            {overview && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" /> Statuts RDV
                  </h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Confirmés', value: overview.rdvConfirmes },
                          { name: 'Signés', value: overview.rdvSignes },
                          { name: 'Annulés', value: overview.rdvAnnules },
                        ]}
                        cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}>
                        {['var(--color-chart-1)', 'var(--color-chart-4)', 'var(--color-chart-5)'].map((color, i) => <Cell key={i} fill={color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="glass-card p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-success" /> Métriques Clés
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Total RDV', value: overview.totalRdv, icon: Calendar },
                      { label: "Appels aujourd'hui", value: overview.appelsToday, icon: Phone },
                      { label: 'Score qualité moyen', value: `${overview.avgQualityScore}/100`, icon: TrendingUp },
                      { label: 'RDV confirmés', value: overview.rdvConfirmes, icon: Activity },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <item.icon className="w-4 h-4 text-primary" />
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Performance par agent */}
            {agentsPerf.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Score moyen par agent</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={agentsPerf.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                      <XAxis dataKey="nom" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="avgScore" name="Score Qualité" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="glass-card p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4">RDV par agent</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={agentsPerf.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                      <XAxis dataKey="nom" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                      <YAxis />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Bar dataKey="rdvConfirme" name="Confirmés" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="rdvSigne" name="Signés" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="rdvAnnule" name="Annulés" fill="var(--color-chart-5)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">Classement agents</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          {['Agent', 'Appels', 'Total RDV', 'Confirmés', 'Signés', 'Score Qual.', 'Salaire Mois', 'Conversion'].map(h => (
                            <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {agentsPerf.map((a: any) => (
                          <tr key={a.agentId} className="hover:bg-muted/30 transition-colors">
                            <td className="px-3 py-3 font-medium text-foreground">{a.nom}</td>
                            <td className="px-3 py-3">{a.totalAppels}</td>
                            <td className="px-3 py-3">{a.totalRdv}</td>
                            <td className="px-3 py-3 text-success font-semibold">{a.rdvConfirme}</td>
                            <td className="px-3 py-3 text-primary font-semibold">{a.rdvSigne}</td>
                            <td className="px-3 py-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${a.avgScore >= 70 ? 'bg-success/10 text-success' : a.avgScore >= 50 ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}`}>
                                {a.avgScore}
                              </span>
                            </td>
                            <td className="px-3 py-3 font-mono">{a.salaireMois?.toFixed(2) || '0.00'} €</td>
                            <td className="px-3 py-3">{a.conversionRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Répartition géographique */}
            {geo && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> Top villes
                  </h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={geo.byVille?.slice(0, 10) || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                      <XAxis dataKey="ville" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                      <YAxis />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" name="Contacts" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="glass-card p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-success" /> Top départements
                  </h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={geo.byDepartement?.slice(0, 10) || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                      <XAxis dataKey="departement" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" name="Contacts" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
        </>
        )}

        {activeTab === 'performance' && (
        <>
        {/* ── Performance des appels ── */}
        <div className="flex items-center justify-between border-l-4 border-primary pl-4 pt-2">
          <div>
            <h2 className="text-lg font-bold text-foreground">Performance des appels</h2>
            <p className="text-sm text-muted-foreground">Évolution mensuelle des appels, conversions et refus</p>
          </div>
          {perf && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${perf.rendementStatus === 'augmenté' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
              Rendement {perf.rendementStatus}
            </span>
          )}
        </div>

        {perfLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Chargement de la performance...
          </div>
        ) : (
          <>
            {perf?.mistakes.map((m, i) => (
              <div key={i} className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <p className="text-sm text-destructive">{m}</p>
              </div>
            ))}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {perf && (
                <>
                  {perfStatCard('Appels', perf.currentMonth.totalCalls, perf.previousMonth.totalCalls, perf.evolution.totalCalls)}
                  {perfStatCard('Conversions', perf.currentMonth.conversions, perf.previousMonth.conversions, perf.evolution.conversions)}
                  {perfStatCard('Taux conversion', perf.currentMonth.conversionRate, perf.previousMonth.conversionRate, perf.evolution.conversionRate, '%')}
                  {perfStatCard('Refus', perf.currentMonth.refusalRate, perf.previousMonth.refusalRate, perf.evolution.refusalRate, '%')}
                </>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Phone className="w-4 h-4" /> Appels mensuels</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={perf?.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="calls" fill="var(--color-primary, #6366f1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Target className="w-4 h-4" /> Conversions mensuelles</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={perf?.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="conversions" stroke="var(--color-chart-4)" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
        </>
        )}

        {activeTab === 'pointage' && (
        <>
        {/* ── Pointage en direct ── */}
        <div className="flex items-center justify-between border-l-4 border-primary pl-4 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <div>
              <h2 className="text-lg font-bold text-foreground">Pointage en direct</h2>
              <p className="text-sm text-muted-foreground">
                Suivi des présences · mis à jour à {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>
          <button
            onClick={fetchLive}
            disabled={liveLoading}
            className="px-3 py-2 bg-muted text-foreground text-xs font-medium rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3 h-3 ${liveLoading ? 'animate-spin' : ''}`} /> Actualiser
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card p-4 flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-success shrink-0" />
            <div>
              <p className="text-2xl font-bold text-foreground">{presentLive.length}</p>
              <p className="text-xs text-muted-foreground">Présents</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-3">
            <Coffee className="w-5 h-5 text-warning shrink-0" />
            <div>
              <p className="text-2xl font-bold text-foreground">{onBreakLive.length}</p>
              <p className="text-xs text-muted-foreground">En pause</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-3">
            <UserX className="w-5 h-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-2xl font-bold text-foreground">{absentLive.length}</p>
              <p className="text-xs text-muted-foreground">Hors ligne</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Détail par agent</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium">Agent</th>
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium">Statut</th>
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium">Arrivée</th>
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium">Durée</th>
                  <th className="text-right px-4 py-2 text-muted-foreground font-medium">Pause</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {liveLoading && liveAgents.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">Chargement...</td></tr>
                ) : liveAgents.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">Aucune donnée de pointage disponible</td></tr>
                ) : liveAgents.map(agent => (
                  <tr key={agent.userId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{agent.userName}</td>
                    <td className="px-4 py-3"><LiveStatusBadge status={agent.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><DoorOpen className="w-3.5 h-3.5" />{formatLiveTime(agent.clockIn)}</span>
                    </td>
                    <td className="px-4 py-3 text-foreground font-mono">
                      <span className="inline-flex items-center gap-1.5"><Timer className="w-3.5 h-3.5" />{formatLiveDuration(agent.workDurationMinutes)}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-warning font-mono">
                      {agent.totalBreakMinutes ? `${agent.totalBreakMinutes} min` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
        )}

      </div></>
  );
}
