import React from 'react';
import { Trophy, AlertCircle, TrendingUp, Star, Play } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

const agentScores = [
  { id: 1, name: 'agent 1', score: 95, appels: 48, conversions: 32, qualite: 97, aRevoir: 2, tendance: 'up' },
  { id: 2, name: 'agent 2', score: 94, appels: 45, conversions: 30, qualite: 95, aRevoir: 1, tendance: 'up' },
  { id: 3, name: 'agent 3', score: 92, appels: 42, conversions: 28, qualite: 93, aRevoir: 3, tendance: 'up' },
  { id: 4, name: 'agent 4', score: 90, appels: 40, conversions: 26, qualite: 91, aRevoir: 2, tendance: 'stable' },
  { id: 5, name: 'agent 5', score: 88, appels: 38, conversions: 24, qualite: 89, aRevoir: 4, tendance: 'down' },
  { id: 6, name: 'agent 6', score: 86, appels: 36, conversions: 22, qualite: 87, aRevoir: 5, tendance: 'down' },
  { id: 7, name: 'agent 7', score: 85, appels: 35, conversions: 20, qualite: 84, aRevoir: 5, tendance: 'down' }
];

export default function ScorecardsPage() {
  return (
    <>
      <div className="space-y-6">
        <div>
          <h2>Scorecards Agents</h2>
          <p className="text-muted-foreground mt-1">Classement et évaluation des performances</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {agentScores.slice(0, 3).map((agent, index) => (
            <div key={agent.id} className={`rounded-lg p-6 text-white ${
              index === 0 ? 'bg-gradient-to-br from-warning to-warning/80' :
              index === 1 ? 'bg-gradient-to-br from-muted to-muted/80 text-foreground' :
              'bg-gradient-to-br from-accent to-accent/80'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <Trophy className="w-8 h-8" />
                <span className="text-3xl font-medium">#{index + 1}</span>
              </div>
              <h3 className="text-xl font-medium">{agent.name}</h3>
              <p className="text-2xl font-medium mt-2">Score: {agent.score}/100</p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-lg border border-border">
          <div className="p-6 border-b border-border">
            <h3>Classement détaillé</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-muted-foreground">Rang</th>
                  <th className="text-left p-4 text-muted-foreground">Agent</th>
                  <th className="text-left p-4 text-muted-foreground">Score Global</th>
                  <th className="text-left p-4 text-muted-foreground">Appels</th>
                  <th className="text-left p-4 text-muted-foreground">Conversions</th>
                  <th className="text-left p-4 text-muted-foreground">Qualité</th>
                  <th className="text-left p-4 text-muted-foreground">À revoir</th>
                  <th className="text-left p-4 text-muted-foreground">Tendance</th>
                </tr>
              </thead>
              <tbody>
                {agentScores.map((agent, index) => (
                  <tr key={agent.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {index < 3 && <Star className="w-4 h-4 text-warning" />}
                        <span className="font-medium text-foreground">#{index + 1}</span>
                      </div>
                    </td>
                    <td className="p-4 text-foreground font-medium">{agent.name}</td>
                    <td className="p-4">
                      <span className="text-xl font-medium text-primary">{agent.score}</span>
                    </td>
                    <td className="p-4 text-foreground">{agent.appels}</td>
                    <td className="p-4 text-success">{agent.conversions}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden w-20">
                          <div className="h-full bg-primary" style={{ width: `${agent.qualite}%` }}></div>
                        </div>
                        <span className="text-sm text-foreground">{agent.qualite}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {agent.aRevoir > 0 && (
                        <span className="flex items-center gap-1 text-warning">
                          <AlertCircle className="w-4 h-4" />
                          {agent.aRevoir}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <TrendingUp className={`w-5 h-5 ${
                        agent.tendance === 'up' ? 'text-success' :
                        agent.tendance === 'down' ? 'text-destructive rotate-180' :
                        'text-muted-foreground'
                      }`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
             <div className="p-6 border-t border-border">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Agents nécessitant un suivi
            </h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-3">
              {agentScores.slice(-3).reverse().map((agent) => (
                <div key={agent.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <p>{agent.name}</p>
                    <Badge variant="outline" className="border-red-500 text-red-700">
                      Score: {agent.score}
                    </Badge>
                  </div>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    {[
                      `Verifier ${agent.aRevoir} appel(s) recent(s)`,
                      `Suivre la tendance: ${agent.tendance}`,
                    ].map((rec, i) => (
                      <li key={i}>• {rec}</li>
                    ))}
                  </ul>
                  <Button className="w-full mt-3" size="sm" variant="outline">
                    <Play className="w-4 h-4 mr-2" />
                    Écouter les appels
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
