import React from 'react';
import { 
  Phone, CheckCircle, Clock, TrendingUp, 
  AlertCircle 
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend 
} from 'recharts';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../../contexts/AuthContext';
import { useAgentDashboard } from '../../../hooks/useAgentDashboard';

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

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="heure" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="appels" 
                  stroke="var(--color-primary)" 
                  fill="var(--color-primary)" 
                  fillOpacity={0.2} 
                  name="Appels" 
                />
                <Area 
                  type="monotone" 
                  dataKey="conversions" 
                  stroke="var(--color-success)" 
                  fill="var(--color-success)" 
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
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="heure" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="appels" fill="var(--color-chart-1)" name="Appels" />
                <Bar dataKey="conversions" fill="var(--color-chart-4)" name="Conversions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appels récents */}
        <div className="bg-card rounded-lg border border-border">
          <div className="p-6 border-b border-border">
            <h3>Appels récents</h3>
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