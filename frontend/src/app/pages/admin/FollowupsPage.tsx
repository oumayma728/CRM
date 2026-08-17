import React, { useState, useEffect } from 'react';
import { Target, Users, Calendar, CheckCircle, Clock, Search, Loader2, ArrowRight, Mail, MessageSquare, Send } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../../services/api';
import { useChartTheme } from '../../hooks/useChartTheme';

const STATUS_COLORS: Record<string, string> = {
  'À relancer': 'var(--color-warning)',
  'Relance en cours': 'var(--color-info)',
  'Converti': 'var(--color-success)',
  'Refus final': 'var(--color-destructive)',
  'Injoignable': 'var(--color-muted-foreground)',
  'Relancé': 'var(--color-chart-1)'
};

const tooltipStyle = {
  backgroundColor: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  color: 'var(--foreground)',
};

export default function FollowupsPage() {
  const chartTheme = useChartTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getFollowupsData();
      setData(res);
    } catch (e) {
      console.error('Followups load error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-3 text-muted-foreground">Chargement des prospects...</span>
      </div>
    );
  }

  const stats = data?.stats || {};
  const followups = data?.followups || [];

  const filteredFollowups = followups.filter((f: any) => 
    f.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-amber-500 pl-6">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
            Suivi des <span className="text-amber-500">Prospects</span>
          </h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1 opacity-70">Gestion des rendez-vous et opportunités détectées par l'IA</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Total Prospects" value={stats.total || 0} icon={Target} color="primary" />
        <KPICard title="À Relancer" value={stats.a_relancer || 0} icon={Clock} color="warning" />
        <KPICard title="Convertis" value={stats.convertis || 0} icon={CheckCircle} color="success" />
        <KPICard title="Taux Conversion" value={`${stats.taux_conversion || 0}%`} icon={Users} color="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="mb-4 text-sm font-medium">Répartition par statut</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.by_status || []}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                  paddingAngle={5} dataKey="count" nameKey="status"
                >
                  {(data?.by_status || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || `var(--color-chart-${(index % 5) + 1})`} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTheme.tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agent Distribution */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="mb-4 text-sm font-medium">Prospects par agent</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.by_agent || []}>
                <defs>
                  <linearGradient id="prospectGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#ea580c" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.1} />
                <XAxis dataKey="agent" stroke={chartTheme.textColor} fontSize={12} fontWeight="bold" />
                <YAxis stroke={chartTheme.textColor} />
                <Tooltip contentStyle={chartTheme.tooltipStyle} />
                <Bar dataKey="count" fill="url(#prospectGrad)" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Full List */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h3 className="text-sm font-medium">Liste des prospects & Relances</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Rechercher un agent ou statut..." 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold border border-slate-200 dark:border-slate-600 rounded-xl text-xs uppercase tracking-widest focus:outline-none shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30">
                <th className="text-left p-4 font-medium text-muted-foreground">Agent</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Rendez-vous initial</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Statut</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Relances</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Dernière mise à jour</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFollowups.length > 0 ? (
                filteredFollowups.map((f: any, i: number) => (
                  <tr key={i} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-medium">{f.agent_name}</td>
                    <td className="p-4 text-muted-foreground">
                      {f.appointment_date ? new Date(f.appointment_date).toLocaleDateString('fr-FR') : 'Non spécifié'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        f.status === 'converti' ? 'bg-success/10 text-success' : 
                        f.status === 'a_relancer' ? 'bg-warning/10 text-warning' : 
                        'bg-muted text-muted-foreground'
                      }`}>
                        {f.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${Math.min(f.relance_count * 20, 100)}%` }}></div>
                        </div>
                        <span className="text-xs">{f.relance_count}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {f.updated_at ? new Date(f.updated_at).toLocaleString('fr-FR') : '-'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setSelectedLead(f)}
                          className="p-1.5 hover:bg-primary/20 rounded-lg text-primary transition-colors"
                          title="Envoyer une relance"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors">
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">Aucun prospect trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SEND MESSAGE MODAL (SIMULATION) */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100 dark:bg-slate-800 dark:bg-slate-800/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Envoyer une relance
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Voulez-vous envoyer un message automatique à l'agent <strong>{selectedLead.agent_name}</strong> pour le prospect <strong>#{selectedLead.appointment_date}</strong> ?
            </p>
            
            <div className="space-y-3 mb-8">
              <div className="p-3 bg-muted/50 rounded-lg border border-border flex items-center gap-3">
                <input type="checkbox" checked readOnly className="accent-primary" />
                <span className="text-sm">Notification SMS (Simulé)</span>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg border border-border flex items-center gap-3">
                <input type="checkbox" checked readOnly className="accent-primary" />
                <span className="text-sm">Email de confirmation (Simulé)</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setSelectedLead(null)}
                className="flex-1 py-2 rounded-xl border border-border hover:bg-muted font-medium"
              >
                Annuler
              </button>
              <button 
                onClick={() => {
                   setSending(true);
                   setTimeout(() => {
                     setSending(false);
                     setSelectedLead(null);
                   }, 1500);
                }}
                disabled={sending}
                className="flex-1 py-2 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? "Envoi..." : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({ title, value, icon: Icon, color }: { title: string, value: any, icon: any, color: string }) {
  const colors: Record<string, string> = {
    primary: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    destructive: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const colorClass = colors[color] || colors.primary;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
      <div className={`absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500`}>
        <Icon className="w-16 h-16" />
      </div>
      <div className="flex items-center gap-3 relative z-10">
        <div className={`p-2 rounded-xl ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]} border ${colorClass.split(' ')[2]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</p>
          <p className="text-2xl font-black tracking-tighter text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}
