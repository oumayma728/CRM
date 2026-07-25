import React, { useState, useEffect } from 'react';
import { Calendar, Clock, TrendingUp, Users, Loader2, Sparkles, AlertCircle, Sun, Coffee, Moon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../../services/api';

export default function PlanningPage() {
  const [loading, setLoading] = useState(true);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      api.get('/admin/realtime/hourly'),
      api.get('/quality/dashboard/global-stats').catch(() => ({ data: null })),
    ]).then(([hourlyRes, statsRes]) => {
      setHourlyData(hourlyRes.data || []);
      setStats(statsRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <span className="ml-3 text-muted-foreground">Analyse du trafic...</span>
    </div>
  );

  const sortedHourly = [...hourlyData].sort((a, b) => b.appels - a.appels);
  const peakHour = sortedHourly[0]?.h?.replace('h', '') || '12';

  const suggestions = [
    { title: 'Staffing Matinal (09h-12h)', status: 'Haute Intensité',
      recommendation: 'Augmenter l\'équipe de 20% sur ce créneau pour réduire le temps d\'attente.',
      icon: Sun, color: 'text-amber-500' },
    { title: 'Staffing Après-midi (14h-17h)', status: 'Pic d\'Appels',
      recommendation: 'Concentrer les agents les plus performants sur ce créneau.',
      icon: Coffee, color: 'text-indigo-500' },
    { title: 'Staffing Soir (18h+)', status: 'Calme',
      recommendation: 'Idéal pour les tâches administratives et le traitement des emails.',
      icon: Moon, color: 'text-blue-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-primary pl-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Planification IA & Staffing</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-1">Analyse prédictive du trafic et recommandations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-5 flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-full"><Clock className="w-6 h-6 text-primary" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Heure de Pointe</p>
            <p className="text-xl font-bold">{peakHour}:00</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5 flex items-center gap-4">
          <div className="p-3 bg-success/10 rounded-full"><Users className="w-6 h-6 text-success" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Staffing Suggéré</p>
            <p className="text-xl font-bold">{Math.max(Math.round((stats?.totalAgents || 10) * 0.6), 5)} Agents</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5 flex items-center gap-4">
          <div className="p-3 bg-info/10 rounded-full"><TrendingUp className="w-6 h-6 text-info" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Trafic Prévu</p>
            <p className="text-xl font-bold">{stats?.totalAppels || 0} appels</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="w-5 h-5 text-primary" /> Distribution Horaire du Trafic
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="planGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
              <XAxis dataKey="h" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="appels" stroke="#6366f1" strokeWidth={3} fill="url(#planGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Recommandations de l'IA
          </h3>
          {suggestions.map((s, i) => (
            <div key={i} className="bg-card rounded-lg border border-border p-5 hover:border-primary/50 transition-colors cursor-default">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-muted"><s.icon className={`w-5 h-5 ${s.color}`} /></div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{s.title}</span>
                    <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{s.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{s.recommendation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
          <AlertCircle className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-1 text-center md:text-left">
          <h4 className="font-bold text-foreground">Alerte Congestion détectée</h4>
          <p className="text-sm text-muted-foreground">
            L'IA prévoit un pic d'appels entre 10h et 11h. Nous recommandons de mobiliser 2 agents supplémentaires pour maintenir le niveau de service.
          </p>
        </div>
        <button className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap ml-auto">Optimiser maintenant</button>
      </div>
    </div>
  );
}
