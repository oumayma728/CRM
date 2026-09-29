import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { 
  Trophy, TrendingUp, TrendingDown, AlertCircle, 
  Play, Award, ChevronUp, ChevronDown, Search
} from 'lucide-react';

interface ScorecardAgent {
  rang: number;
  agentId: number;
  agentNom: string;
  scoreGlobal: number;
  appels: number;
  conversions: number;
  qualite: number;
  aRevoir: number;
  tendance: string;
}

interface AgentSuivi {
  agentId: number;
  agentNom: string;
  score: number;
  appelsAVerifier: number;
  tendance: string;
}

export default function ScorecardsPage() {
  const [agents, setAgents] = useState<ScorecardAgent[]>([]);
  const [agentsSuivi, setAgentsSuivi] = useState<AgentSuivi[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [scorecardsRes, suiviRes] = await Promise.all([
          adminService.getScorecards(),
          adminService.getAgentsSuivi()
        ]);
        setAgents(scorecardsRes.data);
        setAgentsSuivi(suiviRes.data);
      } catch (error) {
        console.error('Erreur chargement scorecards:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getTendanceIcon = (tendance: string) => {
    if (tendance === 'up') return <ChevronUp className="w-4 h-4 text-success" />;
    if (tendance === 'down') return <ChevronDown className="w-4 h-4 text-destructive" />;
    return <div className="w-4 h-4" />;
  };

  const getTendanceText = (tendance: string) => {
    if (tendance === 'up') return 'En hausse';
    if (tendance === 'down') return 'En baisse';
    return 'Stable';
  };

  const getMedal = (rang: number) => {
    if (rang === 1) return <Trophy className="w-6 h-6 text-warning" />;
    if (rang === 2) return <Award className="w-6 h-6 text-muted-foreground" />;
    if (rang === 3) return <Award className="w-6 h-6 text-warning" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rang}</span>;
  };

  const filteredAgents = agents.filter(agent =>
    agent.agentNom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <><div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div></>
    );
  }

  const top3 = filteredAgents.slice(0, 3);
  const rest = filteredAgents.slice(3);

  return (
    <><div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Scorecards Agents</h1>
          <p className="text-muted-foreground mt-1">Classement et évaluation des performances</p>
        </div>

        {/* Top 3 Agents */}
        {top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3.map((agent) => (
              <div
                key={agent.agentId}
                className={`rounded-xl p-6 text-center text-white ${
                  agent.rang === 1 ? 'bg-gradient-to-r from-warning to-warning' :
                  agent.rang === 2 ? 'bg-gradient-to-r from-muted to-muted' :
                  'bg-gradient-to-r from-warning to-warning'
                }`}
              >
                <div className="flex justify-center mb-3">{getMedal(agent.rang)}</div>
                <h3 className="text-xl font-semibold">{agent.agentNom}</h3>
                <p className="text-3xl font-bold mt-2">{agent.scoreGlobal}/100</p>
                <div className="flex justify-center items-center gap-1 mt-2">
                  {getTendanceIcon(agent.tendance)}
                  <span className="text-sm opacity-90">{getTendanceText(agent.tendance)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un agent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Classement détaillé */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="font-semibold text-foreground">Classement détaillé</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Rang</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Agent</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Score</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Appels</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Conversions</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Qualité</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">À revoir</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Tendance</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((agent) => (
                  <tr key={agent.agentId} className="border-b border-border hover:bg-muted transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getMedal(agent.rang)}
                        <span className="text-foreground">#{agent.rang}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-foreground">{agent.agentNom}</td>
                    <td className="p-4">
                      <span className="text-lg font-bold text-primary">{agent.scoreGlobal}</span>
                    </td>
                    <td className="p-4 text-muted-foreground">{agent.appels}</td>
                    <td className="p-4 text-success">{agent.conversions}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${agent.qualite}%` }} />
                        </div>
                        <span className="text-sm text-muted-foreground">{agent.qualite}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {agent.aRevoir > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-warning/15 text-warning">
                          <AlertCircle className="w-3 h-3" />
                          {agent.aRevoir}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {getTendanceIcon(agent.tendance)}
                        <span className={`text-sm ${
                          agent.tendance === 'up' ? 'text-success' : 
                          agent.tendance === 'down' ? 'text-destructive' : 
                          'text-muted-foreground'
                        }`}>
                          {getTendanceText(agent.tendance)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Agents nécessitant un suivi */}
        {agentsSuivi.length > 0 && (
          <div className="bg-card rounded-xl shadow-sm border border-border">
            <div className="p-6 border-b border-border">
              <h2 className="font-semibold text-foreground">Agents nécessitant un suivi</h2>
            </div>
            <div className="p-6 space-y-4">
              {agentsSuivi.map((agent) => (
                <div key={agent.agentId} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-foreground">{agent.agentNom}</span>
                      <span className="px-2 py-1 rounded-full text-xs bg-destructive/15 text-destructive">
                        Score: {agent.score}
                      </span>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Vérifier {agent.appelsAVerifier} appel(s) récent(s)</li>
                      <li>• Suivre la tendance: {agent.tendance === 'down' ? 'à la baisse' : 'stable'}</li>
                    </ul>
                  </div>
                  <button className="ml-4 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Écouter les appels
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div></>
  );
}