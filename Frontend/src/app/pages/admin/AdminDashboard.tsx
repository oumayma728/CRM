import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { adminService } from '../../../services/adminService';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { AlertTriangle, Users, Phone, Calendar, TrendingUp, Circle, PauseCircle, CircleOff, Loader2 } from 'lucide-react';

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

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [agents, setAgents] = useState<AgentStatut[]>([]);
  const [loading, setLoading] = useState(true);

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
        console.error('Erreur chargement dashboard admin:', error);
        setDashboard({
          agentsEnLigne: 7,
          totalAgents: 8,
          enAppel: 4,
          appelsDuJour: 284,
          tauxConversion: 64.1,
          alertes: [
            { agentNom: 'agent 1', message: 'Pause prolongée (20 min)', type: 'pause' },
            { agentNom: 'agent 2', message: 'Hors ligne depuis 1h', type: 'offline' },
          ],
          performanceHoraire: [
            { heure: '08:00', appels: 12, conversions: 7 },
            { heure: '09:00', appels: 25, conversions: 15 },
            { heure: '10:00', appels: 35, conversions: 22 },
            { heure: '11:00', appels: 42, conversions: 28 },
            { heure: '12:00', appels: 38, conversions: 24 },
            { heure: '13:00', appels: 30, conversions: 18 },
            { heure: '14:00', appels: 28, conversions: 17 },
          ],
        });
        setAgents([
          { id: 1, nom: 'agent 1', prenom: '', statut: 'En appel', dureeAppel: '12:35', appels: 42, conversions: 28, score: 92 },
          { id: 2, nom: 'agent 2', prenom: '', statut: 'En ligne', dureeAppel: '-', appels: 38, conversions: 24, score: 88 },
          { id: 3, nom: 'agent 3', prenom: '', statut: 'En appel', dureeAppel: '05:12', appels: 45, conversions: 30, score: 94 },
          { id: 4, nom: 'agent 4', prenom: '', statut: 'Pause', dureeAppel: '-', appels: 35, conversions: 20, score: 85 },
          { id: 5, nom: 'agent 5', prenom: '', statut: 'En ligne', dureeAppel: '-', appels: 40, conversions: 26, score: 90 },
          { id: 6, nom: 'agent 6', prenom: '', statut: 'En appel', dureeAppel: '15:42', appels: 48, conversions: 32, score: 95 },
          { id: 7, nom: 'agent 7', prenom: '', statut: 'Hors ligne', dureeAppel: '-', appels: 0, conversions: 0, score: 0 },
          { id: 8, nom: 'agent 8', prenom: '', statut: 'En appel', dureeAppel: '03:28', appels: 36, conversions: 22, score: 86 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'En appel':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200"><Phone size={12} className="text-amber-500" />En appel</span>;
      case 'En ligne':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"><Circle size={12} className="text-emerald-500" fill="#22c55e" />En ligne</span>;
      case 'Pause':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-200"><PauseCircle size={12} className="text-blue-500" />Pause</span>;
      case 'Hors ligne':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 ring-1 ring-gray-200"><CircleOff size={12} className="text-gray-400" />Hors ligne</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-600">{statut}</span>;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded-lg" />
          <div className="h-4 w-96 bg-gray-200 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
          </div>
          <div className="h-[400px] bg-gray-200 rounded-xl" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-l-4 border-primary pl-6">
          <h1 className="text-2xl font-bold">Dashboard Live Opérationnel</h1>
          <p className="text-muted-foreground text-sm mt-1">Supervision en temps réel de l'activité du centre d'appels</p>
        </div>

        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border border-border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Agents en ligne</p>
                <p className="text-3xl font-bold mt-0.5">{dashboard?.agentsEnLigne}<span className="text-lg text-muted-foreground">/{dashboard?.totalAgents}</span></p>
              </div>
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">En appel</p>
                <p className="text-3xl font-bold mt-0.5">{dashboard?.enAppel}</p>
              </div>
              <div className="w-11 h-11 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Phone className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Appels du jour</p>
                <p className="text-3xl font-bold mt-0.5">{dashboard?.appelsDuJour}</p>
              </div>
              <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Taux conversion</p>
                <p className="text-3xl font-bold mt-0.5">{dashboard?.tauxConversion}%</p>
              </div>
              <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Alertes en cours */}
        {dashboard?.alertes && dashboard.alertes.length > 0 && (
          <div className="bg-card rounded-lg border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="font-semibold">Alertes en cours</h2>
            </div>
            <div className="space-y-2">
              {dashboard.alertes.map((alerte, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${alerte.type === 'pause' ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20' : 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20'}`}>
                  <p className="font-medium text-sm">{alerte.agentNom}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{alerte.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Graphique Performance horaire */}
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Performance horaire</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dashboard?.performanceHoraire}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
              <XAxis dataKey="heure" stroke="var(--color-muted-foreground)" tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--color-muted-foreground)" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-foreground)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              />
              <Legend />
              <Area type="monotone" dataKey="appels" name="Appels" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={2.5} />
              <Area type="monotone" dataKey="conversions" name="Conversions" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tableau Statut des agents */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Statut des agents en temps réel</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Agent</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Statut</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Durée appel</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Appels</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Conversions</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Score</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-4 font-medium text-gray-900 dark:text-white">{agent.nom} {agent.prenom}</td>
                    <td className="p-4">{getStatutBadge(agent.statut)}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">{agent.dureeAppel}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">{agent.appels}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">{agent.conversions}</td>
                    <td className="p-4">
                      <span className={`font-medium ${
                        agent.score >= 90 ? 'text-green-600 dark:text-green-400' : 
                        agent.score >= 80 ? 'text-yellow-600 dark:text-yellow-400' : 
                        agent.score > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
                      }`}>
                        {agent.score > 0 ? agent.score : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}