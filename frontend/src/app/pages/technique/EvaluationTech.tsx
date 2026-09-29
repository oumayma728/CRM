import { API_BASE, getToken } from '../../services/api';
import React, { useEffect, useState } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface EvalItem {
  id: number;
  agentId: number;
  agentNom: string;
  date: string;
  noteGlobale: number;
  notePitch: number;
  commentaire?: string;
}

export default function EvaluationTech() {
  const [evals,   setEvals]   = useState<EvalItem[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const size = 20;

  const token = () => getToken();

  useEffect(() => { fetchEvals(); }, [page]);

  const fetchEvals = () => {
    setLoading(true);
    fetch(`${API_BASE}/technique/evaluations?page=${page}&size=${size}`, {
      headers: { Authorization: `Bearer ${token()}` }
    })
      .then(r => r.json())
      .then(d => {
        setEvals(d.evaluations || []);
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const totalPages = Math.ceil(total / size);

  const noteColor = (n: number) =>
    n >= 8 ? 'text-success'
    : n >= 6 ? 'text-warning'
    : 'text-destructive';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Évaluation</h1>
        <p className="text-muted-foreground">Historique des évaluations agents</p>
      </div>

      <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Star size={16} className="text-warning" />
            {total} évaluation{total !== 1 ? 's' : ''} au total
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  {['Agent', 'Date', 'Note globale', 'Pitch', 'Commentaire'].map(h => (
                    <th key={h} className="p-3 text-left text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {evals.map(e => (
                  <tr key={e.id} className="border-t hover:bg-muted">
                    <td className="p-3 font-medium">{e.agentNom}</td>
                    <td className="p-3">{e.date}</td>
                    <td className="p-3">
                      <span className={`font-bold ${noteColor(e.noteGlobale)}`}>{e.noteGlobale}/10</span>
                    </td>
                    <td className="p-3">{e.notePitch}/10</td>
                    <td className="p-3 text-muted-foreground italic text-xs">{e.commentaire || '—'}</td>
                  </tr>
                ))}
                {evals.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Aucune évaluation disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Page {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-border disabled:opacity-40 hover:bg-muted"
              >
                <ChevronLeft size={16} className="" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded border border-border disabled:opacity-40 hover:bg-muted"
              >
                <ChevronRight size={16} className="" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
