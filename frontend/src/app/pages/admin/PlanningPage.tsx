import React, { useState, useEffect } from 'react';
import { Calendar, Clock, TrendingUp, Users, Loader2, Sparkles, AlertCircle, Sun, Coffee, Moon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../../services/api';
import { useChartTheme } from '../../hooks/useChartTheme';

const tooltipStyle = {
  backgroundColor: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  color: 'var(--foreground)',
};

export default function PlanningPage() {
  const chartTheme = useChartTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getAnalyticsOverview();
      setData(res);
    } catch (e) {
      console.error('Planning load error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-3 text-muted-foreground">Analyse du trafic par l'IA...</span>
      </div>
    );
  }

  const hourlyData = data?.hourly || [];
  
  // Logic to find peak hours and suggest staffing
  const sortedHourly = [...hourlyData].sort((a, b) => b.appels - a.appels);
  const peakHour = sortedHourly[0]?.hour || 0;
  
  const suggestions = [
    { 
      title: "Staffing Matinal (09h-12h)", 
      status: "Haute Intensité", 
      recommendation: "Augmenter l'équipe de 20% sur ce créneau pour réduire le temps d'attente.",
      icon: Sun,
      color: "text-warning"
    },
    { 
      title: "Staffing Après-midi (14h-17h)", 
      status: "Pic d'Appels", 
      recommendation: "Concentrer les agents les plus performants (Best Agents) sur ce créneau.",
      icon: Coffee,
      color: "text-primary"
    },
    { 
      title: "Staffing Soir (18h+)", 
      status: "Calme", 
      recommendation: "Idéal pour les tâches administratives et le traitement des emails.",
      icon: Moon,
      color: "text-info"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h2>Planification IA & Staffing</h2>
        </div>
        <p className="text-muted-foreground mt-1">Analyse prédictive du trafic et recommandations d'optimisation des effectifs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-5 flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Heure de Pointe</p>
            <p className="text-xl font-bold">{peakHour}h:00</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5 flex items-center gap-4">
          <div className="p-3 bg-success/10 rounded-full">
            <Users className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Staffing Suggéré</p>
            <p className="text-xl font-bold">12 Agents</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5 flex items-center gap-4">
          <div className="p-3 bg-info/10 rounded-full">
            <TrendingUp className="w-6 h-6 text-info" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Trafic Prévu</p>
            <p className="text-xl font-bold">+15% demain</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Area Chart */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Distribution Hebdomadaire du Trafic
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorAppels" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4649D0" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4649D0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.2} vertical={false} />
                <XAxis dataKey="hour" stroke={chartTheme.textColor} tickFormatter={(v) => `${v}h`} />
                <YAxis stroke={chartTheme.textColor} />
                <Tooltip contentStyle={chartTheme.tooltipStyle} />
                <Area type="monotone" dataKey="appels" stroke="#4649D0" strokeWidth={4} fillOpacity={1} fill="url(#colorAppels)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2 px-1">
            <Sparkles className="w-4 h-4 text-primary" />
            Recommandations de l'IA
          </h3>
          {suggestions.map((s, i) => (
            <div key={i} className="bg-card rounded-lg border border-border p-5 hover:border-primary/50 transition-colors cursor-default group">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{s.title}</span>
                    <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      {s.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {s.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alert Card */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 animate-pulse">
          <AlertCircle className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-1 text-center md:text-left">
          <h4 className="font-bold text-foreground">Alerte Congestion détectée</h4>
          <p className="text-sm text-muted-foreground max-w-2xl">
            L'IA prévoit un pic d'appels exceptionnel ce jeudi entre 10h et 11h. 
            Nous recommandons de mobiliser 2 agents supplémentaires en télétravail pour maintenir le niveau de service.
          </p>
        </div>
        <button className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap ml-auto">
          Optimiser maintenant
        </button>
      </div>
    </div>
  );
}
