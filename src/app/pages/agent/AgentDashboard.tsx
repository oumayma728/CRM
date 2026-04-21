import React from 'react';
import { Phone, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Layout } from '../../components/Layout';

const performanceData = [
  { time: '08:00', appels: 4, conversions: 2 },
  { time: '09:00', appels: 8, conversions: 5 },
  { time: '10:00', appels: 12, conversions: 7 },
  { time: '11:00', appels: 10, conversions: 6 },
  { time: '12:00', appels: 6, conversions: 3 },
  { time: '13:00', appels: 5, conversions: 2 },
  { time: '14:00', appels: 11, conversions: 8 }
];

const recentCalls = [
  { id: 1, company: 'Société ABC', contact: 'Jean Dupont', duration: '5:32', status: 'Converti', time: '14:23' },
  { id: 2, company: 'Entreprise XYZ', contact: 'Marie Martin', duration: '3:15', status: 'Refusé', time: '14:10' },
  { id: 3, company: 'Solutions Pro', contact: 'Pierre Leroy', duration: '8:45', status: 'Converti', time: '13:55' },
  { id: 4, company: 'Tech Innovate', contact: 'Sophie Bernard', duration: '2:30', status: 'Rappel', time: '13:40' },
  { id: 5, company: 'Digital Services', contact: 'Luc Moreau', duration: '6:12', status: 'Converti', time: '13:20' }
];

export default function AgentDashboard() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2>Mon Tableau de Bord</h2>
          <p className="text-muted-foreground mt-1">Vue d'ensemble de votre activité du jour</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Appels du jour</h3>
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-medium text-foreground">56</p>
            <p className="text-sm text-success mt-1">+12% vs hier</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Conversions</h3>
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <p className="text-3xl font-medium text-foreground">33</p>
            <p className="text-sm text-success mt-1">Taux: 58.9%</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Temps productif</h3>
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <p className="text-3xl font-medium text-foreground">6h 24m</p>
            <p className="text-sm text-muted-foreground mt-1">80% du temps total</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Score Qualité</h3>
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <p className="text-3xl font-medium text-foreground">92/100</p>
            <p className="text-sm text-success mt-1">+5 points</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="mb-4">Performance du jour</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="time" stroke="var(--color-muted-foreground)" />
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

          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="mb-4">Taux de conversion par heure</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="time" stroke="var(--color-muted-foreground)" />
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
                  <th className="text-left p-4 text-muted-foreground">Heure</th>
                </tr>
              </thead>
              <tbody>
                {recentCalls.map((call) => (
                  <tr key={call.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-foreground">{call.company}</td>
                    <td className="p-4 text-foreground">{call.contact}</td>
                    <td className="p-4 text-muted-foreground">{call.duration}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        call.status === 'Converti' ? 'bg-success/10 text-success' :
                        call.status === 'Refusé' ? 'bg-destructive/10 text-destructive' :
                        'bg-warning/10 text-warning'
                      }`}>
                        {call.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">{call.time}</td>
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
