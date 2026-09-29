/**
 * Pointage — Service Technique
 * Affiche le pointage des agents via l'endpoint admin (réutilise la même logique).
 */
import React, { useEffect, useState } from 'react';
import api from '../../services/crmApi';
import { Clock, Coffee, LogIn, AlertCircle } from 'lucide-react';

interface PointageDetail {
  agentNom: string;
  arrivee: string;
  depart: string;
  pauses: string;
  tempsProductif: string;
  statut: string;
  retardMinutes: number;
  estEnRetard: boolean;
  penaliteSalaire: number;
}

interface PointageData {
  presents: number;
  totalAgents: number;
  retards: number;
  tempsMoyen: string;
  pausesMoyennes: string;
  heureDebutTravail: string;
  heureFinTravail: string;
  toleranceMinutes: number;
  details: PointageDetail[];
}

const statutBadge = (statut: string) => {
  switch (statut) {
    case 'En activité': return 'bg-success/15 text-success';
    case 'En pause':    return 'bg-warning/15 text-warning';
    default:            return 'bg-muted text-muted-foreground';
  }
};

const statutDot = (statut: string) => {
  switch (statut) {
    case 'En activité': return 'bg-success animate-pulse';
    case 'En pause':    return 'bg-warning animate-pulse';
    default:            return 'bg-muted-foreground';
  }
};

export default function Pointage() {
  const [pointage, setPointage] = useState<PointageData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [date, setDate]         = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get(`/technique/pointage?date=${date}`)
      .then(r => { setPointage(r.data); setLoading(false); })
      .catch(e => { setError(e.message || 'Erreur de chargement'); setLoading(false); });
  }, [date]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Pointage EBI</h1>
          <p className="text-muted-foreground text-sm">Suivi des heures d'activité des agents</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Date :</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="glass-input px-3 py-1.5 rounded-lg text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-xl p-4">
          <AlertCircle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      ) : pointage && (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: LogIn,  label: 'Présents',    value: `${pointage.presents}/${pointage.totalAgents}`, color: 'text-success bg-success/15' },
              { icon: Clock,  label: 'Retards',     value: pointage.retards,        color: 'text-destructive bg-destructive/15' },
              { icon: Clock,  label: 'Temps moyen', value: pointage.tempsMoyen,     color: 'text-primary bg-primary/15' },
              { icon: Coffee, label: 'Pauses moy.', value: pointage.pausesMoyennes, color: 'text-warning bg-warning/15' },
            ].map(s => (
              <div key={s.label} className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <span className={`p-1.5 rounded-lg ${s.color}`}><s.icon size={14} /></span>
                </div>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Table détail */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b font-semibold flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              Détail par agent
              <span className="ml-auto text-xs text-muted-foreground font-normal">
                Début: {pointage.heureDebutTravail} — Fin: {pointage.heureFinTravail} — Tolérance: {pointage.toleranceMinutes} min
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-xs uppercase text-muted-foreground">
                  <tr>
                    {['Agent', 'Statut', 'Arrivée', 'Départ', 'Pauses', 'Temps productif', 'Retard'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pointage.details.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Aucun pointage pour cette date</td></tr>
                  ) : (
                    pointage.details.map((d, i) => (
                      <tr key={i} className="hover:bg-muted transition-colors">
                        <td className="px-4 py-3 font-medium">{d.agentNom}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statutBadge(d.statut)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statutDot(d.statut)}`} />
                            {d.statut}
                          </span>
                        </td>
                        <td className="px-4 py-3">{d.arrivee}</td>
                        <td className="px-4 py-3">{d.depart}</td>
                        <td className="px-4 py-3">{d.pauses}</td>
                        <td className="px-4 py-3">{d.tempsProductif}</td>
                        <td className="px-4 py-3">
                          {d.estEnRetard ? (
                            <span className="text-destructive font-medium">{d.retardMinutes} min</span>
                          ) : (
                            <span className="text-success">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
