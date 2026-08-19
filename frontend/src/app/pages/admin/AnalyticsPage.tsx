import React, { useState, useEffect } from 'react';
import { Phone, TrendingUp, Users, MapPin, AlertTriangle, Target, Loader2, Clock } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../../services/api';
import { useChartTheme } from '../../hooks/useChartTheme';

const COLORS = ['var(--color-success)', 'var(--color-warning)', 'var(--color-chart-1)', 'var(--color-info)', 'var(--color-chart-5)'];

const tooltipStyle = {
  backgroundColor: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  color: 'var(--foreground)',
};

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
};

type TabId = 'overview' | 'performance' | 'supervision' | 'geo';

export default function AnalyticsPage() {
  const chartTheme = useChartTheme();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [supervision, setSupervision] = useState<any>(null);
  const [geo, setGeo] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ov, ag, sup, ge] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getAgentsPerformance(),
        api.getSupervisionData(),
        api.getGeoAnalysis(),
      ]);
      setOverview(ov);
      setAgents(ag);
      setSupervision(sup);
      setGeo(ge);
    } catch (e) {
      console.error('Analytics load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview' as TabId, label: 'Vue Globale', icon: TrendingUp },
    { id: 'performance' as TabId, label: 'Performance Agents', icon: Users },
    { id: 'supervision' as TabId, label: 'Supervision', icon: AlertTriangle },
    { id: 'geo' as TabId, label: 'Géo-Analyse', icon: MapPin },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-3 text-muted-foreground">Chargement des données MySQL...</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-primary pl-6">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
              Intelligence <span className="text-primary">Analytique</span>
            </h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1 opacity-70">Rapports de performance en direct depuis le cortex MySQL</p>
          </div>
          <button onClick={loadData} className="px-4 py-2 bg-muted text-foreground text-[10px] font-black uppercase tracking-widest rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-all flex items-center gap-2">
            <Loader2 className="w-3 h-3" /> Actualiser les données
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB: Vue Globale */}
        {activeTab === 'overview' && overview && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <KPICard title="Total Appels" value={overview.total_calls} icon={Phone} color="primary" />
              <KPICard title="Score Moyen" value={`${overview.avg_score}%`} icon={TrendingUp} color="success" />
              <KPICard title="Meilleur Agent" value={overview.best_agent} icon={Users} color="info" />
              <KPICard title="Priorité Formation" value={overview.worst_agent} icon={AlertTriangle} color="warning" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Matrice des Compétences (Radar) */}
              <div className="bg-card rounded-3xl border border-border p-8 shadow-premium overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                  <TrendingUp className="w-32 h-32" />
                </div>
                
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">
                    Matrice des Compétences
                  </h3>
                </div>

                <div className="flex justify-center items-center h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={overview.radar && overview.radar.length > 0 ? overview.radar : [
                      { critere: 'Accueil', score: 0 },
                      { critere: 'Energie', score: 0 },
                      { critere: 'Voix', score: 0 },
                      { critere: 'Ecoute', score: 0 },
                      { critere: 'Client', score: 0 },
                      { critere: 'Operateur', score: 0 },
                      { critere: 'Efficacite', score: 0 },
                      { critere: 'Conclusion', score: 0 },
                    ]}>
                      <PolarGrid stroke="#334155" gridType="polygon" />
                      <PolarAngleAxis 
                        dataKey="critere" 
                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} 
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 10]} 
                        tick={false} 
                        axisLine={false}
                      />
                      <Radar
                        name="Performance"
                        dataKey="score"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="#6366f1"
                        fillOpacity={0.5}
                      />
                      <Tooltip 
                        contentStyle={chartTheme.tooltipStyle} 
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sentiments */}
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">Répartition des sentiments</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(overview.sentiments).map(([name, value]) => ({ name, value }))}
                      cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {Object.keys(overview.sentiments).map((key, i) => {
                         const colors: Record<string, string> = {
                           "POSITIVE": "#22c55e",
                           "NEUTRAL": "#4649D0",
                           "NEGATIVE": "#ef4444"
                         };
                         return <Cell key={i} fill={colors[key] || "#4649D0"} />;
                      })}
                    </Pie>
                    <Tooltip contentStyle={chartTheme.tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Hourly */}
              <div className="bg-card rounded-lg border border-border p-6 lg:col-span-2 shadow-sm">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">Appels par heure</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={overview.hourly}>
                    <defs>
                      <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4649D0" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#7C7FFF" stopOpacity={1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.2} />
                    <XAxis dataKey="hour" stroke={chartTheme.textColor} tickFormatter={(v) => `${v}h`} />
                    <YAxis stroke={chartTheme.textColor} />
                    <Tooltip contentStyle={chartTheme.tooltipStyle} />
                    <Bar dataKey="appels" fill="url(#barColor)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Performance Agents */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                   <div className="w-1.5 h-4 bg-primary rounded-full"></div> Score moyen par agent
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={agents}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#818cf8" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.1} />
                    <XAxis dataKey="agent_name" stroke={chartTheme.textColor} fontSize={11} fontWeight="bold" />
                    <YAxis stroke={chartTheme.textColor} domain={[0, 100]} />
                    <Tooltip contentStyle={chartTheme.tooltipStyle} />
                    <Bar dataKey="avg_score" fill="url(#scoreGrad)" name="Score %" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
 
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                   <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div> Temps de parole Agent vs Client
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={agents}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.1} />
                    <XAxis dataKey="agent_name" stroke={chartTheme.textColor} fontSize={11} fontWeight="bold" />
                    <YAxis stroke={chartTheme.textColor} />
                    <Tooltip contentStyle={chartTheme.tooltipStyle} />
                    <Legend iconType="circle" />
                    <Bar dataKey="talk_ratio" fill="#818cf8" name="Agent %" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="client_ratio" fill="#10b981" name="Client %" stackId="a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Agents Table */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="mb-4">Détails par agent</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-muted-foreground font-medium">Agent</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Appels</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Score</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Positif</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Négatif</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Neutre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map(a => (
                      <tr key={a.agent_name} className="border-b border-border hover:bg-muted/30">
                        <td className="p-3 font-medium text-foreground">{a.agent_name}</td>
                        <td className="p-3 text-foreground">{a.total_calls}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs ${a.avg_score >= 70 ? 'bg-success/10 text-success' : a.avg_score >= 50 ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}`}>
                            {a.avg_score}%
                          </span>
                        </td>
                        <td className="p-3 text-success">{a.positive}</td>
                        <td className="p-3 text-destructive">{a.negative}</td>
                        <td className="p-3 text-muted-foreground">{a.neutral}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Supervision */}
        {activeTab === 'supervision' && supervision && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPICard title="Motifs de refus" value={supervision.refusals.reduce((s: number, r: any) => s + r.count, 0)} icon={AlertTriangle} color="destructive" />
              <KPICard title="Incohérences" value={supervision.incoherence_count} icon={Target} color="warning" />
              <KPICard title="Score cohérence" value={`${supervision.coherence_avg}%`} icon={TrendingUp} color="info" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Refusals */}
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                   <div className="w-1.5 h-4 bg-red-500 rounded-full"></div> Motifs de refus
                </h3>
                {supervision.refusals.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={supervision.refusals}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.1} />
                      <XAxis dataKey="motif" stroke={chartTheme.textColor} fontSize={10} fontWeight="bold" angle={-20} textAnchor="end" height={60} />
                      <YAxis stroke={chartTheme.textColor} />
                      <Tooltip contentStyle={chartTheme.tooltipStyle} />
                      <Bar dataKey="count" fill="#ef4444" name="Nombre" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-12 italic">Aucun refus détecté par l'IA</p>
                )}
              </div>

              {/* Refusals by agent */}
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-warning/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                   <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div> Refus par agent
                </h3>
                {supervision.refusals_by_agent.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={supervision.refusals_by_agent}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.1} />
                      <XAxis dataKey="agent" stroke={chartTheme.textColor} fontSize={10} fontWeight="bold" />
                      <YAxis stroke={chartTheme.textColor} />
                      <Tooltip contentStyle={chartTheme.tooltipStyle} />
                      <Bar dataKey="count" fill="#f59e0b" name="Refus" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-12 italic">Aucune donnée</p>
                )}
              </div>

              {/* Incoherences by agent */}
              <div className="bg-card rounded-lg border border-border p-6 lg:col-span-2">
                <h3 className="mb-4">Incohérences de qualification par agent</h3>
                {supervision.incoherences_by_agent.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={supervision.incoherences_by_agent}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                      <XAxis dataKey="agent" stroke={chartTheme.textColor} />
                      <YAxis stroke={chartTheme.textColor} />
                      <Tooltip contentStyle={chartTheme.tooltipStyle} />
                      <Bar dataKey="count" fill="var(--color-chart-5)" name="Incohérences" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-success text-center py-8">✅ Toutes les qualifications sont cohérentes</p>
                )}
              </div>
            </div>

            {supervision.inactivity_count > 0 && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <p className="text-foreground">{supervision.inactivity_count} appel(s) avec inactivité &gt; 30s détectée</p>
              </div>
            )}
          </div>
        )}

        {/* TAB: Géo */}
        {activeTab === 'geo' && geo && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <KPICard title="Appels localisés" value={geo.total_localized} icon={MapPin} color="primary" />
              <KPICard title="Top Département" value={geo.top_dept} icon={MapPin} color="success" />
              <KPICard title="Départements couverts" value={geo.dept_count} icon={MapPin} color="info" />
              <KPICard title="Durée Moyenne" value={formatDuration(geo.departments?.length ? Math.round(geo.departments.reduce((s: number, d: any) => s + (d.avg_duration || 0), 0) / geo.departments.length) : 0)} icon={Clock} color="warning" />
            </div>

            <div className="bg-card rounded-lg border border-border p-6 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 blur-3xl opacity-50"></div>
              <h3 className="mb-6 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                 <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div> Appels par département
              </h3>
              {geo.departments.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={geo.departments}>
                    <defs>
                      <linearGradient id="geoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#c084fc" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.1} />
                    <XAxis dataKey="dept" stroke={chartTheme.textColor} fontSize={12} fontWeight="bold" />
                    <YAxis stroke={chartTheme.textColor} />
                    <Tooltip contentStyle={chartTheme.tooltipStyle} />
                    <Bar dataKey="total" fill="url(#geoGrad)" name="Appels" radius={[6, 6, 0, 0]} barSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-16 italic uppercase tracking-widest text-xs opacity-50">Aucun code postal détecté dans les transcriptions</p>
              )}
            </div>

            {/* Dept table */}
            {geo.departments.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="mb-4">Détails par département</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 text-muted-foreground">Département</th>
                        <th className="text-left p-3 text-muted-foreground">Appels</th>
                        <th className="text-left p-3 text-muted-foreground">Score moyen</th>
                        <th className="text-left p-3 text-muted-foreground">Durée moyenne</th>
                      </tr>
                    </thead>
                    <tbody>
                      {geo.departments.map((d: any) => (
                        <tr key={d.dept} className="border-b border-border hover:bg-muted/30">
                          <td className="p-3 font-medium text-foreground">{d.dept}</td>
                          <td className="p-3 text-foreground">{d.total}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-xs ${d.avg_score >= 70 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                              {d.avg_score}%
                            </span>
                          </td>
                          <td className="p-3 text-foreground font-medium">{formatDuration(Math.round(d.avg_duration || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── KPI Card ────────────────────────────────────────────────
function KPICard({ title, value, icon: Icon, color }: { title: string; value: any; icon: any; color: string }) {
  const colors: Record<string, string> = {
    primary: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    destructive: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const colorClass = colors[color] || colors.primary;

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
      <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500`}>
        <Icon className="w-24 h-24" />
      </div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
          {title}
        </span>
        <div className={`p-2 rounded-xl ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]} border ${colorClass.split(' ')[2]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <p className="text-3xl font-black tracking-tighter text-foreground">{value}</p>
      </div>
    </div>
  );
}
