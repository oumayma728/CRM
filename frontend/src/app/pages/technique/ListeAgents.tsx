import { API_BASE, getToken } from '../../services/api';
import React, { useEffect, useState } from 'react';
import { Users, ChevronRight, Star } from 'lucide-react';
import AgentDetail from './AgentDetail';

interface Agent {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  actif: boolean;
  isElite: boolean;
}

export default function ListeAgents() {
  const [agents, setAgents]           = useState<Agent[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selectedAgent, setSelected]  = useState<Agent | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/technique/agents`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
      .then(r => r.json())
      .then(d => { setAgents(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (selectedAgent) {
    return <AgentDetail agent={selectedAgent} onBack={() => setSelected(null)} />;
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Liste des Agents</h1>
        <p className="text-muted-foreground">Cliquer sur un agent pour voir son historique</p>
      </div>

      <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              {['Nom + Prénom', 'Email', 'Téléphone', 'Statut', ''].map(h => (
                <th key={h} className="p-3 text-left text-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agents.map(a => (
              <tr
                key={a.id}
                onClick={() => setSelected(a)}
                className="border-t hover:bg-muted cursor-pointer transition-colors"
              >
                <td className="p-3 font-medium flex items-center gap-2">
                  {a.isElite && <Star size={14} className="text-warning" />}
                  {a.prenom} {a.nom}
                </td>
                <td className="p-3">{a.email}</td>
                <td className="p-3">{a.telephone || '—'}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    a.actif
                      ? 'bg-success/15 text-success'
                      : 'bg-destructive/15 text-destructive'
                  }`}>
                    {a.actif ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <ChevronRight size={16} className="text-muted-foreground inline" />
                </td>
              </tr>
            ))}
            {agents.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  <Users size={32} className="mx-auto mb-2 opacity-40" />
                  Aucun agent trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
