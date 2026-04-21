import React, { useState } from 'react';
import { Layout } from '../../components/Layout';
import { Search, Filter, ChevronDown, ChevronUp, Phone, Clock, TrendingUp } from 'lucide-react';

const callHistory = [
  { id: 1, date: '2026-04-01', time: '14:23', company: 'Société ABC', contact: 'Jean Dupont', duration: '5:32', result: 'Converti', score: 95, notes: 'Client très intéressé, bon feeling', aiSummary: 'Prospect qualifié avec un besoin immédiat. Budget confirmé. Décision rapide attendue.' },
  { id: 2, date: '2026-04-01', time: '14:10', company: 'Entreprise XYZ', contact: 'Marie Martin', duration: '3:15', result: 'Refusé', score: 72, notes: 'Pas de budget pour l\'instant', aiSummary: 'Budget insuffisant. Pas de besoin identifié à court terme.' },
  { id: 3, date: '2026-04-01', time: '13:55', company: 'Solutions Pro', contact: 'Pierre Leroy', duration: '8:45', result: 'Converti', score: 98, notes: 'Excellent contact, signature prévue', aiSummary: 'Décision positive. Excellent rapport. Signature imminente.' },
  { id: 4, date: '2026-04-01', time: '13:40', company: 'Tech Innovate', contact: 'Sophie Bernard', duration: '2:30', result: 'Rappel', score: 85, notes: 'Doit consulter son équipe', aiSummary: 'Intérêt confirmé. Validation interne nécessaire. Rappel à planifier dans 48h.' },
  { id: 5, date: '2026-04-01', time: '13:20', company: 'Digital Services', contact: 'Luc Moreau', duration: '6:12', result: 'Converti', score: 91, notes: 'Contrat signé pendant l\'appel', aiSummary: 'Conversion réussie. Excellent échange commercial. Client satisfait.' },
  { id: 6, date: '2026-03-31', time: '17:30', company: 'Startup Alpha', contact: 'Emma Dubois', duration: '4:18', result: 'Rappel', score: 78, notes: 'Intéressée mais occupe', aiSummary: 'Prospect prometteur. Occupée actuellement. Meilleur moment : matin.' },
  { id: 7, date: '2026-03-31', time: '16:45', company: 'Industries Beta', contact: 'Thomas Petit', duration: '7:20', result: 'Converti', score: 93, notes: 'Deal important, très satisfait', aiSummary: 'Gros contrat. Client enthousiaste. Recommandations possibles.' },
  { id: 8, date: '2026-03-31', time: '15:22', company: 'Commerce Gamma', contact: 'Julie Roux', duration: '1:45', result: 'Refusé', score: 65, notes: 'Mauvais timing', aiSummary: 'Contexte défavorable. Pas de besoin actuel. Ne pas recontacter.' }
];

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResult, setFilterResult] = useState('all');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const filteredCalls = callHistory.filter(call => {
    const matchesSearch = call.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         call.contact.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterResult === 'all' || call.result === filterResult;
    return matchesSearch && matchesFilter;
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2>Historique de mes appels</h2>
          <p className="text-muted-foreground mt-1">Consultez tous vos appels passés et leurs résultats</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Total appels</h3>
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-medium text-foreground">{callHistory.length}</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Durée moyenne</h3>
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <p className="text-3xl font-medium text-foreground">5:12</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Score moyen</h3>
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <p className="text-3xl font-medium text-foreground">84.6</p>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border">
          <div className="p-6 border-b border-border">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher par société ou contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <select
                  value={filterResult}
                  onChange={(e) => setFilterResult(e.target.value)}
                  className="px-3 py-2 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                >
                  <option value="all">Tous les résultats</option>
                  <option value="Converti">Converti</option>
                  <option value="Rappel">Rappel</option>
                  <option value="Refusé">Refusé</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-muted-foreground">Date</th>
                  <th className="text-left p-4 text-muted-foreground">Société</th>
                  <th className="text-left p-4 text-muted-foreground">Contact</th>
                  <th className="text-left p-4 text-muted-foreground">Durée</th>
                  <th className="text-left p-4 text-muted-foreground">Résultat</th>
                  <th className="text-left p-4 text-muted-foreground">Score</th>
                  <th className="text-left p-4 text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {filteredCalls.map((call) => (
                  <React.Fragment key={call.id}>
                    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-foreground">
                        <div>
                          <p className="font-medium">{call.date}</p>
                          <p className="text-sm text-muted-foreground">{call.time}</p>
                        </div>
                      </td>
                      <td className="p-4 text-foreground">{call.company}</td>
                      <td className="p-4 text-foreground">{call.contact}</td>
                      <td className="p-4 text-muted-foreground">{call.duration}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          call.result === 'Converti' ? 'bg-success/10 text-success' :
                          call.result === 'Refusé' ? 'bg-destructive/10 text-destructive' :
                          'bg-warning/10 text-warning'
                        }`}>
                          {call.result}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                call.score >= 90 ? 'bg-success' :
                                call.score >= 75 ? 'bg-warning' :
                                'bg-destructive'
                              }`}
                              style={{ width: `${call.score}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-foreground">{call.score}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setExpandedRow(expandedRow === call.id ? null : call.id)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                          {expandedRow === call.id ? (
                            <ChevronUp className="w-4 h-4 text-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-foreground" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedRow === call.id && (
                      <tr className="bg-muted/20">
                        <td colSpan={7} className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-foreground mb-2">Notes de l'agent</h4>
                              <p className="text-sm text-muted-foreground">{call.notes}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground mb-2">Résumé IA</h4>
                              <p className="text-sm text-muted-foreground">{call.aiSummary}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
