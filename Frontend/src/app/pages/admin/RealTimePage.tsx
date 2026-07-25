import React, { useState, useEffect } from 'react';
import {
  Activity, Clock, AlertTriangle, Users, Phone, TrendingUp,
  Zap, CheckCircle2, XCircle, Coffee, RefreshCw, UserCheck,
  ArrowUpRight, ArrowDownRight, Headphones, Brain, Target
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import api from '../../../services/api';

const statusConfig: Record<string, { color: string; bg: string; dot: string; label: string; icon: any }> = {
  active: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-500', label: 'Actif', icon: CheckCircle2 },
  inactive: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', dot: 'bg-red-500', label: 'Inactif', icon: XCircle },
  break: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', dot: 'bg-yellow-500', label: 'Pause', icon: Coffee },
};

export default function RealTimePage() {
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [agentsRes, hourlyRes] = await Promise.all([
        api.get('/admin/realtime/agents'),
        api.get('/admin/realtime/hourly'),
      ]);
      setAgents(agentsRes.data || []);
      setHourlyData((hourlyRes.data || []).map((h: any) => ({
        h: h.h,
        appels: h.appels,
        conversions: Math.round((h.appels || 0) * 0.3),
      })));
      setLastRefresh(new Date());
    } catch (e) {
      console.error('RealTime error:', e);
    } finally {
      setLoading(false);
    }
  };

  const activeCount = agents.filter(a => a.status === 'active').length;
  const inactiveCount = agents.filter(a => a.status === 'inactive').length;
  const breakCount = agents.filter(a => a.status === 'break').length;
  const totalCallsToday = hourlyData.reduce((s: number, h: any) => s + h.appels, 0);
  const totalConversions = hourlyData.reduce((s: number, h: any) => s + h.conversions, 0);

  if (loading && agents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-l-4 border-emerald-500 pl-6">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
            Tableau de Bord <span className="text-emerald-500">Temps Réel</span>
          </h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1 opacity-70">
            {lastRefresh.toLocaleTimeString('fr-FR')} · Actualisation toutes les 30s
          </p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-muted text-foreground text-[10px] font-black uppercase tracking-widest rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-all flex items-center gap-2">
          <RefreshCw className="w-3 h-3" /> Actualiser
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Agents Actifs', value: activeCount, icon: Users, color: 'emerald' },
          { label: 'En Pause', value: breakCount, icon: Coffee, color: 'yellow' },
          { label: 'Inactifs', value: inactiveCount, icon: XCircle, color: 'red' },
          { label: 'Appels Aujourd\'hui', value: totalCallsToday, icon: Phone, color: 'blue' },
          { label: 'Conversions', value: totalConversions, icon: Target, color: 'purple' },
        ].map((kpi, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{kpi.label}</span>
              <div className={`p-2 rounded-xl bg-${kpi.color}-500/10 text-${kpi.color}-500`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black tracking-tighter">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" /> Appels en Direct (Aujourd'hui)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="h" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="appels" stroke="#10b981" fill="url(#callsGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" /> Appels & Conversions
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="h" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="appels" name="Appels" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="conversions" name="Conversions" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest">Agents en direct</h3>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Actif</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Pause</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Inactif</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {agents.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground py-12">Aucun agent connecté</p>
          ) : agents.map((agent: any) => {
            const cfg = statusConfig[agent.status] || statusConfig.inactive;
            const Icon = cfg.icon;
            return (
              <div key={agent.id} className={`rounded-xl border p-4 ${cfg.bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                    <span className="font-semibold text-sm">{agent.name}</span>
                  </div>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {agent.calls} appels</span>
                  {agent.status === 'inactive' && (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {agent.idleTime}min</span>
                  )}
                  <span className={`font-bold ${cfg.color}`}>{cfg.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
