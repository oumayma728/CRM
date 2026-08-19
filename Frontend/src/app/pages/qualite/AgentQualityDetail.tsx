import React, { useEffect, useState, useMemo } from 'react';
import {
  Zap, TrendingUp, History, Search, ChevronDown, Phone, CalendarCheck, Target, ShieldCheck
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import api from '../../../services/api';

interface Agent { id: number; nom: string; prenom: string; }
interface Evaluation {
  id: number;
  dateEvaluation: string;
  noteEcoute: number;
  notePitchCommercial: number;
  noteTraitementObjections: number;
  noteQualiteAppel: number;
  noteRespectScript: number;
  noteGlobale: number;
  commentaire?: string;
}
interface MonthStats {
  calls: number; appointments: number; conversion_rate: number;
  quality_score: number; attendance_rate: number;
}
interface AgentPerformance { current_month: MonthStats; }

const DEFAULT_RADAR = [
  { subject: 'Écoute', A: 0 },
  { subject: 'Pitch', A: 0 },
  { subject: 'Objections', A: 0 },
  { subject: 'Qualité appel', A: 0 },
  { subject: 'Script', A: 0 },
];

export default function AgentQualityDetail() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showAgentList, setShowAgentList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<AgentPerformance | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  useEffect(() => {
    api.get('/qualite/agents').then(res => {
      setAgents(res.data);
      if (res.data.length > 0) setSelectedAgent(res.data[0]);
    }).catch(err => console.error('Erreur chargement agents:', err)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedAgent) return;
    Promise.all([
      api.get(`/qualite/agent-performance/${selectedAgent.id}`),
      api.get(`/qualite/evaluations/${selectedAgent.id}`),
    ]).then(([perfRes, evalRes]) => {
      setPerformance(perfRes.data);
      setEvaluations(evalRes.data);
    }).catch(err => console.error('Erreur chargement détail agent:', err));
  }, [selectedAgent]);

  const filteredAgents = agents.filter(a => `${a.prenom} ${a.nom}`.toLowerCase().includes(searchTerm.toLowerCase()));

  const radarData = useMemo(() => {
    if (evaluations.length === 0) return DEFAULT_RADAR;
    const avg = (key: keyof Evaluation) => Math.round((evaluations.reduce((s, e) => s + (Number(e[key]) || 0), 0) / evaluations.length) * 20);
    return [
      { subject: 'Écoute', A: avg('noteEcoute') },
      { subject: 'Pitch', A: avg('notePitchCommercial') },
      { subject: 'Objections', A: avg('noteTraitementObjections') },
      { subject: 'Qualité appel', A: avg('noteQualiteAppel') },
      { subject: 'Script', A: avg('noteRespectScript') },
    ];
  }, [evaluations]);

  const cm = performance?.current_month;
  const kpis = cm ? [
    { label: 'Appels', value: cm.calls, icon: Phone, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'RDV', value: cm.appointments, icon: CalendarCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Conversion', value: `${cm.conversion_rate}%`, icon: Target, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Score qualité', value: `${cm.quality_score}%`, icon: ShieldCheck, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  ] : [];

  if (loading) return <div className="p-6 flex items-center justify-center h-64 text-muted-foreground">Chargement...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header + agent selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Détail Qualité par Agent</h1>
          <p className="text-sm text-muted-foreground mt-1">Profil, performance et historique d'évaluations</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowAgentList(!showAgentList)}
            className="flex items-center gap-3 bg-card border border-border px-4 py-2.5 rounded-xl hover:border-primary/50 transition-all min-w-[240px]"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-xs">
              {selectedAgent ? `${selectedAgent.prenom[0]}${selectedAgent.nom[0]}` : '?'}
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-foreground">{selectedAgent ? `${selectedAgent.prenom} ${selectedAgent.nom}` : 'Sélectionner...'}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showAgentList ? 'rotate-180' : ''}`} />
          </button>

          {showAgentList && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-lg z-50 p-3">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text" placeholder="Rechercher un agent..." autoFocus
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredAgents.map(a => (
                  <button
                    key={a.id}
                    onClick={() => { setSelectedAgent(a); setShowAgentList(false); }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors ${selectedAgent?.id === a.id ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                  >
                    <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center font-black text-[10px] text-primary">
                      {a.prenom[0]}{a.nom[0]}
                    </div>
                    <span className="text-sm font-medium text-foreground">{a.prenom} {a.nom}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI summary */}
      {cm && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map(kpi => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="bg-card border border-border rounded-xl p-4">
                <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center ${kpi.color} mb-2`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xl font-black text-foreground">{kpi.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{kpi.label}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills radar */}
        <div className="bg-card border border-border p-6 rounded-xl flex flex-col items-center">
          <h3 className="font-bold text-sm text-foreground mb-4 self-start flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Profil de Compétences
          </h3>
          <div className="h-64 w-full max-w-sm">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name={selectedAgent ? `${selectedAgent.prenom} ${selectedAgent.nom}` : ''} dataKey="A" stroke="#818cf8" fill="#818cf8" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            {evaluations.length > 0 ? `Basé sur ${evaluations.length} évaluation(s) manuelle(s)` : 'Aucune évaluation manuelle enregistrée pour cet agent'}
          </p>
        </div>

        {/* Evaluation history */}
        <div className="bg-card border border-border p-6 rounded-xl">
          <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-primary" /> Historique des Évaluations
          </h3>
          <div className="space-y-3 max-h-[320px] overflow-y-auto">
            {evaluations.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-xl">
                <p className="text-xs text-muted-foreground">Aucune évaluation enregistrée pour cet agent.</p>
              </div>
            ) : evaluations.map(e => (
              <div key={e.id} className="p-4 bg-muted/40 border border-border rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-0.5 bg-primary/10 rounded-lg text-xs font-bold text-primary">
                    Score : {e.noteGlobale.toFixed(1)}/5
                  </span>
                  <span className="text-xs text-muted-foreground">{new Date(e.dateEvaluation).toLocaleDateString('fr-FR')}</span>
                </div>
                {e.commentaire && <p className="text-xs text-foreground/70 italic">"{e.commentaire}"</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
