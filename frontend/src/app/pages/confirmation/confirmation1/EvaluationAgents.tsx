import { API_BASE, getToken } from '../../../services/api';
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

  useEffect(() => { fetchEvaluation(); }, []);

  const fetchEvaluation = async () => {
    try {
      const res = await fetch(`${API_BASE}/confirmation1/agents/evaluation`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setAgents(await res.json());
    } catch (e) { console.error('Erreur:', e); }
    finally { setLoading(false); }
  };

  const filtered = agents
    .filter(a => a.agentNom.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'scoreGlobal') return b.scoreGlobal - a.scoreGlobal;
      if (sortBy === 'brut')        return b.brut - a.brut;
      if (sortBy === 'confirme')    return b.confirme - a.confirme;
      return 0;
    });

  const scoreColor = (s: number) =>
    s >= 80 ? 'text-success' : s >= 60 ? 'text-warning' : 'text-destructive';

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Évaluation des Agents</h1>
        <p className="text-muted-foreground">Performances et statistiques par agent</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Users size={20}/>, color:'text-primary',   label:'Total Agents',     value: agents.length },
          { icon: <CheckCircle size={20}/>, color:'text-success', label:'Total Confirmés', value: agents.reduce((s,a)=>s+a.confirme,0) },
          { icon: <XCircle size={20}/>, color:'text-destructive',   label:'Total Annulés',   value: agents.reduce((s,a)=>s+a.annule,0) },
          { icon: <Star size={20}/>, color:'text-primary',label:'Score Moyen',
            value: agents.length ? Math.round(agents.reduce((s,a)=>s+a.scoreGlobal,0)/agents.length)+'/100' : '0/100' },
        ].map(({ icon, color, label, value }) => (
          <div key={label} className="glass-card p-4">
            <div className={`flex items-center gap-2 ${color} mb-2`}>
              {icon}
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
            <div className="text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      {/* Recherche / tri */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un agent..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
        >
          <option value="scoreGlobal">Trier par Score Global</option>
          <option value="brut">Trier par Brut</option>
          <option value="confirme">Trier par Confirmés</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground uppercase text-xs">
              <tr>
                {['Agent','Brut','Confirmé','Annulé','Porte','Pas Signé','Signé','R2','Pas Intéressé','Score'].map(h => (
                  <th key={h} className="p-3 text-left first:text-left text-center">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr
                  key={a.agentId}
                  className="border-t hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => setSelectedAgent(a)}
                >
                  <td className="p-3 font-medium">{a.agentNom}</td>
                  <td className="p-3 text-center">{a.brut}</td>
                  <td className="p-3 text-center text-success font-medium">{a.confirme}</td>
                  <td className="p-3 text-center text-destructive font-medium">{a.annule}</td>
                  <td className="p-3 text-center">{a.porte}</td>
                  <td className="p-3 text-center text-warning">{a.pasSigne}</td>
                  <td className="p-3 text-center text-primary font-medium">{a.signe}</td>
                  <td className="p-3 text-center">{a.r2}</td>
                  <td className="p-3 text-center">{a.pasInteresse}</td>
                  <td className="p-3 text-center">
                    <span className={`font-bold ${scoreColor(a.scoreGlobal)}`}>{a.scoreGlobal}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">Aucun agent trouvé</div>
        )}
      </div>

      {/* Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="glass-card w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{selectedAgent.agentNom}</h3>
              <button onClick={() => setSelectedAgent(null)} className="text-muted-foreground hover:text-muted-foreground text-xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label:'Brut',          value: selectedAgent.brut,    cls:'bg-muted' },
                { label:'Taux Conversion', value: selectedAgent.brut ? Math.round(selectedAgent.confirme/selectedAgent.brut*100)+'%' : '0%', cls:'bg-muted' },
                { label:'Confirmés',     value: selectedAgent.confirme, cls:'bg-success/10', vCls:'text-success' },
                { label:'Signés',        value: selectedAgent.signe,   cls:'bg-primary/10',  vCls:'text-primary'  },
                { label:'Annulés',       value: selectedAgent.annule,  cls:'bg-destructive/10',   vCls:'text-destructive'   },
                { label:'Score Global',  value: selectedAgent.scoreGlobal, cls:'bg-primary/10', vCls:`font-extrabold ${scoreColor(selectedAgent.scoreGlobal)}` },
              ].map(({ label, value, cls, vCls='' }) => (
                <div key={label} className={`${cls} p-3 rounded-lg`}>
                  <div className="text-xs text-muted-foreground mb-1">{label}</div>
                  <div className={`text-2xl font-bold ${vCls} `}>{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-end">
              <button onClick={() => setSelectedAgent(null)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
