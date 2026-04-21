import React from 'react';
import { Layout } from '../../components/Layout';
import { Phone, PhoneOff, Pause, Users, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const agentsStatus = [
  { id: 1, name: 'agent 1', status: 'en-appel', duration: '12:35', calls: 42, conversions: 28, score: 92 },
  { id: 2, name: 'agent 2', status: 'en-ligne', duration: '00:00', calls: 38, conversions: 24, score: 88 },
  { id: 3, name: 'agent 3', status: 'en-appel', duration: '05:12', calls: 45, conversions: 30, score: 94 },
  { id: 4, name: 'agent 4', status: 'pause', duration: '08:20', calls: 35, conversions: 20, score: 85 },
  { id: 5, name: 'agent 5', status: 'en-ligne', duration: '00:00', calls: 40, conversions: 26, score: 90 },
  { id: 6, name: 'agent 6', status: 'en-appel', duration: '15:42', calls: 48, conversions: 32, score: 95 },
  { id: 7, name: 'agent 7', status: 'hors-ligne', duration: '00:00', calls: 0, conversions: 0, score: 0 },
  { id: 8, name: 'agent 8', status: 'en-appel', duration: '03:28', calls: 36, conversions: 22, score: 86 }
];

const hourlyData = [
  { hour: '08:00', appels: 24, conversions: 15 },
  { hour: '09:00', appels: 48, conversions: 32 },
  { hour: '10:00', appels: 56, conversions: 38 },
  { hour: '11:00', appels: 52, conversions: 35 },
  { hour: '12:00', appels: 28, conversions: 18 },
  { hour: '13:00', appels: 32, conversions: 20 },
  { hour: '14:00', appels: 60, conversions: 42 }
];

const alerts = [
  { id: 1, agent: 'agent 1', type: 'inactivité', message: 'Pause prolongée (20 min)', time: '14:30' },
  { id: 2, agent: 'agent 2', type: 'absence', message: 'Hors ligne depuis 1h', time: '13:45' }
];

export default function AdminDashboard() {
  const enLigne = agentsStatus.filter(a => a.status !== 'hors-ligne').length;
  const enAppel = agentsStatus.filter(a => a.status === 'en-appel').length;
  const totalAppels = agentsStatus.reduce((sum, a) => sum + a.calls, 0);
  const totalConversions = agentsStatus.reduce((sum, a) => sum + a.conversions, 0);
  const tauxConversion = ((totalConversions / totalAppels) * 100).toFixed(1);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2>Dashboard Live Opérationnel</h2>
          <p className="text-muted-foreground mt-1">Supervision en temps réel de l'activité du centre d'appels</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-success to-success/80 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3>Agents en ligne</h3>
              <Users className="w-5 h-5" />
            </div>
            <p className="text-4xl font-medium">{enLigne}/{agentsStatus.length}</p>
          </div>

          <div className="bg-gradient-to-br from-primary to-secondary rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3>En appel</h3>
              <Phone className="w-5 h-5" />
            </div>
            <p className="text-4xl font-medium">{enAppel}</p>
          </div>

          <div className="bg-gradient-to-br from-accent to-accent/80 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3>Appels du jour</h3>
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-4xl font-medium">{totalAppels}</p>
          </div>

          <div className="bg-gradient-to-br from-warning to-warning/80 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3>Taux conversion</h3>
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-4xl font-medium">{tauxConversion}%</p>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h3 className="text-destructive">Alertes en cours</h3>
            </div>
            <div className="space-y-2">
              {alerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between bg-card rounded-lg p-3">
                  <div>
                    <p className="font-medium text-foreground">{alert.agent}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{alert.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="mb-4">Performance horaire</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="hour" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="appels" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.2} name="Appels" />
              <Area type="monotone" dataKey="conversions" stroke="var(--color-success)" fill="var(--color-success)" fillOpacity={0.2} name="Conversions" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-lg border border-border">
          <div className="p-6 border-b border-border">
            <h3>Statut des agents en temps réel</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-muted-foreground">Agent</th>
                  <th className="text-left p-4 text-muted-foreground">Statut</th>
                  <th className="text-left p-4 text-muted-foreground">Durée appel</th>
                  <th className="text-left p-4 text-muted-foreground">Appels</th>
                  <th className="text-left p-4 text-muted-foreground">Conversions</th>
                  <th className="text-left p-4 text-muted-foreground">Score</th>
                </tr>
              </thead>
              <tbody>
                {agentsStatus.map(agent => (
                  <tr key={agent.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-foreground font-medium">{agent.name}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {agent.status === 'en-appel' && (
                          <>
                            <Phone className="w-4 h-4 text-success animate-pulse" />
                            <span className="text-success">En appel</span>
                          </>
                        )}
                        {agent.status === 'en-ligne' && (
                          <>
                            <div className="w-2 h-2 bg-success rounded-full"></div>
                            <span className="text-success">En ligne</span>
                          </>
                        )}
                        {agent.status === 'pause' && (
                          <>
                            <Pause className="w-4 h-4 text-warning" />
                            <span className="text-warning">Pause</span>
                          </>
                        )}
                        {agent.status === 'hors-ligne' && (
                          <>
                            <PhoneOff className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Hors ligne</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {agent.status === 'en-appel' ? agent.duration : '-'}
                    </td>
                    <td className="p-4 text-foreground">{agent.calls}</td>
                    <td className="p-4 text-success">{agent.conversions}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        agent.score >= 90 ? 'bg-success/10 text-success' :
                        agent.score >= 80 ? 'bg-warning/10 text-warning' :
                        agent.score > 0 ? 'bg-destructive/10 text-destructive' :
                        'bg-muted text-muted-foreground'
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
