import React from 'react';
import {
  Phone, CheckCircle, Clock, TrendingUp,
  AlertCircle, ArrowUpRight
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../../contexts/AuthContext';
import { useAgentDashboard } from '../../../hooks/useAgentDashboard';
import AttendanceWidget from '../../components/AttendanceWidget';

export default function AgentDashboard() {
  const { user } = useAuth();
  const agentId = user?.id || 1;
  const { dashboard, loading, error } = useAgentDashboard(agentId);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Chargement du tableau de bord...</span>
        </div>
      </Layout>
    );
  }

  if (error || !dashboard) {
    return (
      <Layout>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-destructive">{error || 'Erreur de chargement des données'}</p>
        </div>
      </Layout>
    );
  }

  const getStatusBadge = (resultat: string) => {
    switch (resultat) {
      case 'Converti':
      case 'RENDEZ_VOUS':
        return 'bg-success/10 text-success';
      case 'Rappel':
      case 'RAPPEL':
        return 'bg-warning/10 text-warning';
      case 'Refusé':
      case 'REFUS_PAS_INTERESSE':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted/10 text-muted-foreground';
    }
  };

  const getStatusLabel = (resultat: string) => {
    switch (resultat) {
      case 'RENDEZ_VOUS': return 'Converti';
      case 'RAPPEL': return 'Rappel';
      case 'REFUS_PAS_INTERESSE': return 'Refusé';
      default: return resultat;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2>Mon Tableau de Bord</h2>
          <p className="text-muted-foreground mt-1">Vue d'ensemble de votre activité du jour</p>
        </div>

        {/* Pointage widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <AttendanceWidget />
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative overflow-hidden rounded-2xl p-5 group bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-600/25 ring-1 ring-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-600/35">
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br from-cyan-300/30 to-transparent opacity-70 group-hover:scale-150 transition-transform duration-700 blur-2xl" />
              <div className="relative flex items-center justify-between mb-3">
                <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl ring-1 ring-white/20">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Quotidien</span>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-white/85">Appels du jour</h3>
              <p className="text-3xl font-bold mt-1 text-white tabular-nums">{dashboard.appelsDuJour}</p>
              <div className={`mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 ring-1 ring-white/20 text-[10px] font-bold text-white`}>
                <ArrowUpRight className="w-3 h-3" /> {dashboard.evolutionAppels >= 0 ? '+' : ''}{dashboard.evolutionAppels}% vs hier
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl p-5 group bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 ring-1 ring-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/35">
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br from-teal-300/30 to-transparent opacity-70 group-hover:scale-150 transition-transform duration-700 blur-2xl" />
              <div className="relative flex items-center justify-between mb-3">
                <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl ring-1 ring-white/20">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Réussite</span>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-white/85">Conversions</h3>
              <p className="text-3xl font-bold mt-1 text-white tabular-nums">{dashboard.conversionsDuJour}</p>
              <p className="mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 ring-1 ring-white/20 text-[10px] font-bold text-white">
                Taux : {dashboard.tauxConversion}%
              </p>
            </div>

            <div className="relative overflow-hidden rounded-2xl p-5 group bg-gradient-to-br from-rose-400 via-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25 ring-1 ring-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/35">
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br from-pink-300/30 to-transparent opacity-70 group-hover:scale-150 transition-transform duration-700 blur-2xl" />
              <div className="relative flex items-center justify-between mb-3">
                <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl ring-1 ring-white/20">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Niveau</span>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-white/85">Score Qualité</h3>
              <p className="text-3xl font-bold mt-1 text-white tabular-nums">{dashboard.scoreQualite}/100</p>
              <p className="mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 ring-1 ring-white/20 text-[10px] font-bold text-white">
                +5 points
              </p>
            </div>
          </div>
        </div>

        {/* KPIs — hidden (merged above) */}
        <div className="hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Appels du jour</h3>
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-medium text-foreground">{dashboard.appelsDuJour}</p>
            <p className={`text-sm mt-1 ${dashboard.evolutionAppels >= 0 ? 'text-success' : 'text-destructive'}`}>
              {dashboard.evolutionAppels >= 0 ? '+' : ''}{dashboard.evolutionAppels}% vs hier
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Conversions</h3>
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <p className="text-3xl font-medium text-foreground">{dashboard.conversionsDuJour}</p>
            <p className="text-sm text-muted-foreground mt-1">Taux: {dashboard.tauxConversion}%</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Temps productif</h3>
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <p className="text-3xl font-medium text-foreground">{dashboard.tempsProductif}</p>
            <p className="text-sm text-muted-foreground mt-1">80% du temps total</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Score Qualité</h3>
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <p className="text-3xl font-medium text-foreground">{dashboard.scoreQualite}/100</p>
            <p className="text-sm text-success mt-1">+5 points</p>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="mb-4">Performance du jour</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dashboard.statistiquesParHeure}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="heure" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="appels"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.2}
                  name="Appels"
                />
                <Area
                  type="monotone"
                  dataKey="conversions"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.2}
                  name="Conversions"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="mb-4">Taux de conversion par heure</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboard.statistiquesParHeure}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="heure" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Legend />
                <Bar dataKey="appels" fill="#6366f1" name="Appels" radius={[4, 4, 0, 0]} />
                <Bar dataKey="conversions" fill="#22c55e" name="Conversions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appels récents */}
        <div className="bg-card rounded-lg border border-border">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h3>Historique du jour</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Appels enregistrés aujourd'hui — remis à zéro chaque matin
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                Total : <span className="font-bold text-foreground">{dashboard.appelsDuJour}</span>
              </span>
              <span className="text-muted-foreground">
                Convertis : <span className="font-bold text-success">{dashboard.conversionsDuJour}</span>
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-muted-foreground">Société</th>
                  <th className="text-left p-4 text-muted-foreground">Contact</th>
                  <th className="text-left p-4 text-muted-foreground">Durée</th>
                  <th className="text-left p-4 text-muted-foreground">Statut</th>
                  <th className="text-left p-4 text-muted-foreground">Score</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.appelsRecents.map((appel) => (
                  <tr key={appel.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium text-foreground">{appel.societe}</td>
                    <td className="p-4 text-foreground">{appel.contact}</td>
                    <td className="p-4 text-muted-foreground">{appel.duree}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(appel.resultat)}`}>
                        {getStatusLabel(appel.resultat)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`font-medium ${
                        appel.score >= 80 ? 'text-success' : 
                        appel.score >= 60 ? 'text-warning' : 
                        'text-destructive'
                      }`}>
                        {appel.score}
                      </span>
                    </td>
                  </tr>
                ))}
                {dashboard.appelsRecents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Aucun appel récent
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