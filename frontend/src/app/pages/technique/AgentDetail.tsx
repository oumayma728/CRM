import { API_BASE, getToken } from '../../services/api';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, TrendingUp, Star } from 'lucide-react';

interface Agent { id: number; nom: string; prenom: string; }

interface MoisProduction {
  mois: string;
  brut: number;
  annule: number;
  confirme: number;
  signatures: number;
  pose: number;
  couleur: 'green' | 'yellow' | 'red';
}

interface Evaluation {
  id: number;
  date: string;
  noteGlobale: number;
  notePitch: number;
  noteObjections: number;
  noteQualite: number;
  noteScript: number;
  noteEcoute: number;
  commentaire?: string;
}

interface Props {
  agent: Agent;
  onBack: () => void;
}

const rowColor = (couleur: string) => {
  if (couleur === 'green')  return 'bg-card';
  if (couleur === 'yellow') return 'bg-warning/10 text-warning';
  return 'bg-destructive/15 text-destructive';
};

export default function AgentDetail({ agent, onBack }: Props) {
  const [production,   setProduction]   = useState<MoisProduction[]>([]);
  const [evaluations,  setEvaluations]  = useState<Evaluation[]>([]);
  const [loadingProd,  setLoadingProd]  = useState(true);
  const [loadingEval,  setLoadingEval]  = useState(true);

  const headers = { Authorization: `Bearer ${getToken()}` };

  useEffect(() => {
    fetch(`${API_BASE}/technique/agents/${agent.id}/production`, { headers })
      .then(r => r.json())
      .then(d => { setProduction(d.production || []); setLoadingProd(false); })
      .catch(() => setLoadingProd(false));

    fetch(`${API_BASE}/technique/agents/${agent.id}/evaluations`, { headers })
      .then(r => r.json())
      .then(d => { setEvaluations(d || []); setLoadingEval(false); })
      .catch(() => setLoadingEval(false));
  }, [agent.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft size={20} className="" />
        </button>
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground">{agent.prenom} {agent.nom}</h1>
          <p className="text-muted-foreground">Fiche agent — historique complet</p>
        </div>
      </div>

      {/* Historique de Production */}
      <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
        <div className="p-4 border-b flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" />
          <span className="font-semibold">Historique de Production</span>
        </div>

        {loadingProd ? (
          <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  {['Mois', 'RDV', 'Annulés', 'Confirmés', 'Signatures', 'Pose'].map(h => (
                    <th key={h} className="p-3 text-left text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {production.map((m, i) => (
                  <tr key={i} className={`border-t ${rowColor(m.couleur)}`}>
                    <td className="p-3 font-medium">{m.mois}</td>
                    <td className="p-3">{m.brut}</td>
                    <td className="p-3">{m.annule}</td>
                    <td className="p-3">{m.confirme}</td>
                    <td className="p-3 font-semibold">{m.signatures}</td>
                    <td className="p-3">{m.pose}</td>
                  </tr>
                ))}
                {production.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      Aucune donnée de production disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Légende */}
        <div className="p-3 border-t flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-card border border-border inline-block" /> Bon mois</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-warning/20 inline-block" /> Mois moyen</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-destructive/30 inline-block" /> Mois faible</span>
        </div>
      </div>

      {/* Historique d'Évaluation */}
      <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
        <div className="p-4 border-b flex items-center gap-2">
          <Star size={18} className="text-warning" />
          <span className="font-semibold">Historique d'Évaluation</span>
        </div>

        {loadingEval ? (
          <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
        ) : evaluations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Aucune évaluation enregistrée pour cet agent
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  {['Date', 'Note globale', 'Pitch', 'Objections', 'Qualité', 'Script', 'Écoute', 'Commentaire'].map(h => (
                    <th key={h} className="p-3 text-left text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {evaluations.map(e => (
                  <tr key={e.id} className="border-t hover:bg-muted">
                    <td className="p-3">{e.date}</td>
                    <td className="p-3">
                      <span className={`font-bold ${e.noteGlobale >= 8 ? 'text-success' : e.noteGlobale >= 6 ? 'text-warning' : 'text-destructive'}`}>
                        {e.noteGlobale}/10
                      </span>
                    </td>
                    <td className="p-3">{e.notePitch}/10</td>
                    <td className="p-3">{e.noteObjections}/10</td>
                    <td className="p-3">{e.noteQualite}/10</td>
                    <td className="p-3">{e.noteScript}/10</td>
                    <td className="p-3">{e.noteEcoute}/10</td>
                    <td className="p-3 text-muted-foreground italic text-xs">{e.commentaire || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
