import React, { useEffect, useState } from 'react';
import { Users, CheckCircle, XCircle, Star, Search } from 'lucide-react';

interface AgentEvaluation {
  agentId: number;
  agentNom: string;
  brut: number;
  confirme: number;
  annule: number;
  porte: number;
  pasSigne: number;
  signe: number;
  r2: number;
  pasInteresse: number;
  scoreGlobal: number;
}

export default function EvaluationAgents() {
  const [agents, setAgents] = useState<AgentEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentEvaluation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('scoreGlobal');

  useEffect(() => {
    fetchEvaluation();
  }, []);

  const fetchEvaluation = async () => {
    try {
      const response = await fetch('/api/confirmation1/agents/evaluation', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setAgents(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents
    .filter(a => a.agentNom.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'scoreGlobal') return b.scoreGlobal - a.scoreGlobal;
      if (sortBy === 'brut') return b.brut - a.brut;
      if (sortBy === 'confirme') return b.confirme - a.confirme;
      return 0;
    });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Évaluation des Agents</h1>
        <p className="text-gray-500">Performances et statistiques par agent</p>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <Users size={20} />
            <span className="text-sm text-gray-500">Total Agents</span>
          </div>
          <div className="text-2xl font-bold">{agents.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2">
            <CheckCircle size={20} />
            <span className="text-sm text-gray-500">Total Confirmés</span>
          </div>
          <div className="text-2xl font-bold">{agents.reduce((sum, a) => sum + a.confirme, 0)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <XCircle size={20} />
            <span className="text-sm text-gray-500">Total Annulés</span>
          </div>
          <div className="text-2xl font-bold">{agents.reduce((sum, a) => sum + a.annule, 0)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-purple-500 mb-2">
            <Star size={20} />
            <span className="text-sm text-gray-500">Score Moyen</span>
          </div>
          <div className="text-2xl font-bold">{agents.length ? Math.round(agents.reduce((sum, a) => sum + a.scoreGlobal, 0) / agents.length) : 0}/100</div>
        </div>
      </div>

      {/* Recherche et tri */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un agent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
        >
          <option value="scoreGlobal">Trier par Score Global</option>
          <option value="brut">Trier par Brut</option>
          <option value="confirme">Trier par Confirmés</option>
        </select>
      </div>

      {/* Tableau des agents */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Agent</th>
                <th className="p-3 text-center">Brut</th>
                <th className="p-3 text-center">Confirmé</th>
                <th className="p-3 text-center">Annulé</th>
                <th className="p-3 text-center">Porte</th>
                <th className="p-3 text-center">Pas Signé</th>
                <th className="p-3 text-center">Signé</th>
                <th className="p-3 text-center">R2</th>
                <th className="p-3 text-center">Pas Intéressé</th>
                <th className="p-3 text-center">Score</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.map((agent) => (
                <tr key={agent.agentId} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedAgent(agent)}>
                  <td className="p-3 font-medium">{agent.agentNom}</td>
                  <td className="p-3 text-center">{agent.brut}</td>
                  <td className="p-3 text-center text-green-600">{agent.confirme}</td>
                  <td className="p-3 text-center text-red-600">{agent.annule}</td>
                  <td className="p-3 text-center">{agent.porte}</td>
                  <td className="p-3 text-center text-orange-600">{agent.pasSigne}</td>
                  <td className="p-3 text-center text-blue-600">{agent.signe}</td>
                  <td className="p-3 text-center">{agent.r2}</td>
                  <td className="p-3 text-center">{agent.pasInteresse}</td>
                  <td className="p-3 text-center">
                    <span className={`font-bold ${getScoreColor(agent.scoreGlobal)}`}>{agent.scoreGlobal}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAgents.length === 0 && (
          <div className="text-center py-8 text-gray-500">Aucun agent trouvé</div>
        )}
      </div>

      {/* Modal détails agent */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{selectedAgent.agentNom}</h3>
              <button onClick={() => setSelectedAgent(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-500">Brut</div>
                <div className="text-2xl font-bold">{selectedAgent.brut}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-500">Taux Conversion</div>
                <div className="text-2xl font-bold">{selectedAgent.brut ? Math.round(selectedAgent.confirme / selectedAgent.brut * 100) : 0}%</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm text-gray-500">Confirmés</div>
                <div className="text-2xl font-bold text-green-600">{selectedAgent.confirme}</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-gray-500">Signés</div>
                <div className="text-2xl font-bold text-blue-600">{selectedAgent.signe}</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t flex justify-end">
              <button onClick={() => setSelectedAgent(null)} className="px-4 py-2 bg-primary text-white rounded">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}