import React from 'react';
import { Layout } from '../../components/Layout';
import { Clock, Coffee, LogIn, LogOut } from 'lucide-react';

const agentPointage = [
  { id: 1, name: 'agent 1', arrivee: '08:02', premierAppel: '08:15', dernierAppel: '17:42', depart: '18:05', pauses: '45min', tempsProductif: '7h15', status: 'present' },
  { id: 2, name: 'agent 2', arrivee: '08:05', premierAppel: '08:18', dernierAppel: '17:38', depart: '18:00', pauses: '42min', tempsProductif: '7h20', status: 'present' },
  { id: 3, name: 'agent 3', arrivee: '08:00', premierAppel: '08:12', dernierAppel: '17:45', depart: '18:10', pauses: '38min', tempsProductif: '7h35', status: 'present' },
  { id: 4, name: 'agent 4', arrivee: '08:15', premierAppel: '08:30', dernierAppel: '17:30', depart: '17:55', pauses: '65min', tempsProductif: '6h48', status: 'retard' },
  { id: 5, name: 'agent 5', arrivee: '07:58', premierAppel: '08:10', dernierAppel: '17:48', depart: '18:12', pauses: '40min', tempsProductif: '7h32', status: 'present' }
];

    export default function PointagePage() {

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2>Rapport de Pointage</h2>
          <p className="text-muted-foreground mt-1">Suivi de la présence et du temps de travail</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Présents</h3>
              <LogIn className="w-5 h-5 text-success" />
            </div>
            <p className="text-3xl font-medium text-foreground">8/10</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Retards</h3>
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <p className="text-3xl font-medium text-foreground">1</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Temps moyen</h3>
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-medium text-foreground">7h18</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Pauses moyennes</h3>
              <Coffee className="w-5 h-5 text-accent" />
            </div>
            <p className="text-3xl font-medium text-foreground">46min</p>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border">
          <div className="p-6 border-b border-border">
            <h3>Détail du pointage du jour</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-muted-foreground">Agent</th>
                  <th className="text-left p-4 text-muted-foreground">Arrivée</th>
                  <th className="text-left p-4 text-muted-foreground">Premier appel</th>
                  <th className="text-left p-4 text-muted-foreground">Dernier appel</th>
                  <th className="text-left p-4 text-muted-foreground">Départ</th>
                  <th className="text-left p-4 text-muted-foreground">Pauses</th>
                  <th className="text-left p-4 text-muted-foreground">Temps productif</th>
                  <th className="text-left p-4 text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody>
                {agentPointage.map(agent => (
                  <tr key={agent.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-foreground font-medium">{agent.name}</td>
                    <td className="p-4 text-foreground">{agent.arrivee}</td>
                    <td className="p-4 text-muted-foreground">{agent.premierAppel}</td>
                    <td className="p-4 text-muted-foreground">{agent.dernierAppel}</td>
                    <td className="p-4 text-foreground">{agent.depart}</td>
                    <td className="p-4 text-warning">{agent.pauses}</td>
                    <td className="p-4 text-success font-medium">{agent.tempsProductif}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        agent.status === 'present' ? 'bg-success/10 text-success' :
                        'bg-warning/10 text-warning'
                      }`}>
                        {agent.status === 'present' ? 'À l\'heure' : 'Retard'}
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
