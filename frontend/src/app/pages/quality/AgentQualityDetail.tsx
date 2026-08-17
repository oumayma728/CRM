import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Star, MessageSquare, Zap, 
  TrendingUp, Activity, PieChart as PieIcon, 
  Save, Sparkles, AlertCircle, CheckCircle2, Search, ChevronDown, User, History
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, ResponsiveContainer, LineChart, 
  Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  PieChart, Pie, Cell 
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useChartTheme } from '../../hooks/useChartTheme';

// Mock data for the specific agent
const RADAR_DATA = [
  { subject: 'Accueil', A: 85, fullMark: 100 },
  { subject: 'Énergie', A: 75, fullMark: 100 },
  { subject: 'Voix', A: 90, fullMark: 100 },
  { subject: 'Écoute', A: 80, fullMark: 100 },
  { subject: 'Client', A: 70, fullMark: 100 },
  { subject: 'Ope', A: 85, fullMark: 100 },
  { subject: 'Efficacité', A: 65, fullMark: 100 },
  { subject: 'Conclusion', A: 60, fullMark: 100 },
];

const QUALIF_DATA = [
  { name: 'RDV', value: 15, color: '#10b981' },
  { name: 'Refus', value: 45, color: '#ef4444' },
  { name: 'Rappel', value: 25, color: '#f59e0b' },
  { name: 'Répondeur', value: 10, color: '#64748b' },
  { name: 'Hors cible', value: 5, color: '#3b82f6' },
];

export default function AgentQualityDetail() {
  const chartTheme = useChartTheme();
  const navigate = useNavigate();
  const [showAgentList, setShowAgentList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState({ id: 0, name: 'Sélectionner...', matricule: '-' });
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [radarData, setRadarData] = useState(RADAR_DATA);
  const [qualifData, setQualifData] = useState(QUALIF_DATA);
  const [agentStats, setAgentStats] = useState<any>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await api.getAgents();
        const agentUsers = data.filter((u: any) => u.role === 'agent');
        setAgents(agentUsers);
        if (agentUsers.length > 0) {
          setSelectedAgent({ 
            id: agentUsers[0].id, 
            name: agentUsers[0].name || agentUsers[0].username, 
            matricule: `#${agentUsers[0].id.toString().padStart(4, '0')}` 
          });
        }
      } catch (error) {
        console.error("Error fetching agents:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const filteredAgents = agents.filter(a => (a.name || a.username || '').toLowerCase().includes(searchTerm.toLowerCase()));

  const [scores, setScores] = useState({
    accueil: 4,
    energie: 3,
    voix: 4,
    ecoute: 5,
    client: 4,
    operateur: 3,
    efficacite: 3,
    conclusion: 2,
  });
  const [comment, setComment] = useState('');
  const [isPreFilling, setIsPreFilling] = useState(false);
  const [evaluationHistory, setEvaluationHistory] = useState<any[]>([]);

  useEffect(() => {
    if (selectedAgent.id) {
      fetchEvaluations();
      fetchAgentDetail();
    }
  }, [selectedAgent.id]);

  const fetchAgentDetail = async () => {
    try {
      const detail = await api.getQualityAgentDetail(selectedAgent.id);
      setAgentStats(detail);
      if (detail.skills_profile && detail.skills_profile.length > 0) {
        setRadarData(detail.skills_profile);
      } else {
        setRadarData(RADAR_DATA);
      }
      if (detail.qualification_distribution && detail.qualification_distribution.length > 0) {
        setQualifData(detail.qualification_distribution);
      } else {
        setQualifData(QUALIF_DATA);
      }
    } catch (error) {
      console.error("Error fetching agent detail:", error);
    }
  };

  const fetchEvaluations = async () => {
    try {
      const data = await api.getAgentEvaluations(selectedAgent.id);
      const parsedData = data.map((item: any) => {
        let scoresObj: any = {};
        if (item.scores_json) {
          try {
            scoresObj = JSON.parse(item.scores_json);
          } catch (e) {
            console.error("Failed to parse scores_json", e);
          }
        }
        
        // Normalize criteria keys to ensure both formats work
        const score_accueil = (scoresObj.score_accueil ?? ((Number(scoresObj.accueil_formule || 0) + Number(scoresObj.accueil_sourire || 0)) / 2)) || 0;
        const score_energie = scoresObj.score_energie ?? scoresObj.energie ?? 0;
        const score_voix = scoresObj.score_voix ?? scoresObj.voix ?? 0;
        const score_ecoute = scoresObj.score_ecoute ?? scoresObj.decouverte_ecoute ?? 0;
        const score_client = scoresObj.score_client ?? scoresObj.decouverte_besoin ?? 0;
        const score_ope = (scoresObj.score_ope ?? ((Number(scoresObj.argumentaire_maitrise || 0) + Number(scoresObj.argumentaire_objection || 0)) / 2)) || 0;
        const score_efficacite = scoresObj.score_efficacite ?? scoresObj.closing_recap ?? 0;
        const score_conclusion = scoresObj.score_conclusion ?? scoresObj.closing_conge ?? 0;

        return {
          ...item,
          score_accueil,
          score_energie,
          score_voix,
          score_ecoute,
          score_client,
          score_ope,
          score_efficacite,
          score_conclusion
        };
      });
      setEvaluationHistory(parsedData);
    } catch (error) {
      console.error("Error fetching evaluations:", error);
    }
  };

  const handleStarClick = (criterion: keyof typeof scores, val: number) => {
    setScores(prev => ({ ...prev, [criterion]: val }));
  };

  const handleSave = async () => {
    if (!selectedAgent.id) {
      toast.error("Veuillez sélectionner un agent");
      return;
    }

    try {
      const sum = Object.values(scores).reduce((a, b) => a + b, 0);
      const globalScoreVal = ((sum / 40.0) * 100);
      const scoresPayload = Object.keys(scores).reduce((acc, key) => ({
        ...acc,
        [`score_${key}`]: scores[key as keyof typeof scores]
      }), {});

      await api.saveQualityEvaluation({
        agent_id: selectedAgent.id,
        scores: scoresPayload,
        commentaires: comment,
        decision: globalScoreVal >= 75 ? 'conforme' : globalScoreVal >= 50 ? 'coaching' : 'non-conforme',
        global_score: globalScoreVal
      });
      toast.success('Fiche d\'évaluation enregistrée avec succès !');
      fetchEvaluations();
      fetchAgentDetail();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const simulateAIPrefill = () => {
    setIsPreFilling(true);
    setTimeout(() => {
      setScores({
        accueil: 5,
        energie: 4,
        voix: 4,
        ecoute: 5,
        client: 4,
        operateur: 4,
        efficacite: 3,
        conclusion: 3,
      });
      setComment(`ANALYSE IA DÉTAILLÉE :
- POINTS FORTS : Excellente maîtrise de la formule d'accueil et de l'identification du client (Accueil 5/5). Énergie positive constante tout au long de l'appel.
- POINTS DE VIGILANCE : La conclusion pourrait être plus structurée avec un résumé clair des prochaines étapes.
- ACTION PLAN : Session de coaching sur le module 'Conclusion & Rebond' recommandée.`);
      setIsPreFilling(false);
      toast.success('Analyse IA sémantique terminée !');
    }, 1500);
  };

  const renderStars = (criterion: keyof typeof scores) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button 
          key={star} 
          onClick={() => handleStarClick(criterion, star)}
          className={`transition-all ${star <= scores[criterion] ? 'text-amber-400 scale-110' : 'text-slate-600 hover:text-slate-400'}`}
        >
          <Star className={`w-5 h-5 ${star <= scores[criterion] ? 'fill-current' : ''}`} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/qualite/dashboard')}
            className="w-12 h-12 flex items-center justify-center bg-card border border-border rounded-2xl text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all shadow-lg"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowAgentList(!showAgentList)}
              className="flex items-center gap-4 bg-card border border-border px-6 py-3 rounded-2xl hover:border-primary/50 transition-all min-w-[280px]"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-lg">
                {selectedAgent.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-black text-foreground uppercase tracking-tight">{selectedAgent.name}</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{selectedAgent.matricule}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showAgentList ? 'rotate-180' : ''}`} />
            </button>

            {showAgentList && (
              <div className="absolute top-full left-0 mt-2 w-full bg-card border border-border rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="RECHERCHER AGENT..."
                    className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-2 text-[10px] font-bold text-foreground focus:outline-none focus:border-primary/50 transition-all uppercase tracking-widest"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                  {filteredAgents.map(a => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setSelectedAgent({
                          id: a.id,
                          name: a.name || a.username,
                          matricule: `#${a.id.toString().padStart(4, '0')}`
                        });
                        setShowAgentList(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedAgent.id === a.id ? 'bg-primary/20 border border-primary/30' : 'hover:bg-muted/40'}`}
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center font-black text-[10px] text-primary">
                        {(a.name || a.username || 'A').split(' ').map((n: any) => n[0]).join('')}
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-black text-foreground uppercase">{a.name || a.username}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">#{a.id.toString().padStart(4, '0')}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={simulateAIPrefill}
          disabled={isPreFilling}
          className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center gap-3 shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 group"
        >
          {isPreFilling ? <Activity className="w-4 h-4 animate-spin text-white" /> : <Sparkles className="w-4 h-4 text-white group-hover:animate-pulse" />}
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Assistant IA : Pré-remplir la fiche</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Radar Chart & Qualifications */}
        <div className="space-y-8">
          
          <div className="bg-card border border-border p-8 rounded-3xl flex flex-col items-center">
            <h3 className="font-black text-xs uppercase tracking-widest text-foreground mb-8 self-start flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Profil de Compétences
            </h3>
            <div className="h-72 w-full max-w-sm">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke={chartTheme.gridColor} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name={selectedAgent.name}
                      dataKey="A"
                      stroke="#818cf8"
                      fill="#818cf8"
                      fillOpacity={0.3}
                    />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-4 text-center">
              Analyse basée sur les 50 derniers appels qualifiés.
            </p>
          </div>

          <div className="bg-card border border-border p-8 rounded-3xl">
             <h3 className="font-black text-xs uppercase tracking-widest text-foreground mb-8 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-400" /> Distribution des Qualifications
            </h3>
            <div className="flex items-center gap-8">
              <div className="h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={qualifData}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {qualifData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                {qualifData.map((item, i) => (
                  <div key={i} className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] font-black text-foreground uppercase tracking-widest">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-muted-foreground ml-4">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Fiche d'Évaluation */}
        <div className="bg-card border border-border p-8 rounded-3xl flex flex-col">
          <h3 className="font-black text-xs uppercase tracking-widest text-foreground mb-8 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" /> Fiche d'Évaluation Qualité
          </h3>

          <div className="space-y-6 flex-1">
            {[
              { id: 'accueil', label: 'Accueil & Identification', desc: 'Formule de politesse et identification' },
              { id: 'energie', label: 'Énergie & Dynamisme', desc: 'Sourire et attitude proactive' },
              { id: 'voix', label: 'Qualité Vocale', desc: 'Clarté, débit et volume' },
              { id: 'ecoute', label: 'Écoute Active', desc: 'Reformulation et non-interruption' },
              { id: 'client', label: 'Orientation Client', desc: 'Empathie et tact professionnel' },
              { id: 'operateur', label: 'C. Opérationnelles', desc: 'Exactitude des infos transmises' },
              { id: 'efficacite', label: 'Efficacité', desc: 'Gestion de l\'attente et pertinence' },
              { id: 'conclusion', label: 'Rebond & Conclusion', desc: 'Prise de congé professionnelle' },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-muted/40 border border-border rounded-2xl hover:border-primary/20 transition-all">
                <div>
                  <p className="text-xs font-black text-foreground uppercase tracking-tight">{item.label}</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{item.desc}</p>
                </div>
                {renderStars(item.id as keyof typeof scores)}
              </div>
            ))}

            <div className="mt-8">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 block">Commentaires & Recommandations</label>
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Saisissez vos observations..."
                className="w-full bg-background/50 border border-border rounded-2xl p-4 text-xs font-medium text-foreground focus:outline-none focus:border-primary/40 min-h-[120px] transition-all resize-none"
              />
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <button 
              onClick={handleSave}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/25 hover:opacity-90 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" /> Enregistrer l'Évaluation
            </button>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-[10px] font-black text-muted-foreground uppercase">Score Moyen</span>
              <span className="text-lg font-black text-primary">{((Object.values(scores).reduce((a, b) => a + b, 0) / 8)).toFixed(1)}/5</span>
            </div>
          </div>

          {/* AI Insight Box */}
          <div className="mt-8 p-4 bg-primary/5 border-l-4 border-primary rounded-r-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-foreground/80 leading-relaxed italic">
                  "L'agent présente un potentiel élevé sur l'empathie mais perd pied sur le closing. Une session de formation sur la 'Double Alternance' est recommandée."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historique des Évaluations */}
      <div className="bg-card border border-border p-8 rounded-3xl">
        <h3 className="font-black text-xs uppercase tracking-widest text-foreground mb-8 flex items-center gap-2">
          <History className="w-4 h-4 text-primary" /> Historique des Évaluations Manuelles
        </h3>
        
        <div className="space-y-4">
          {evaluationHistory.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-border rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aucune évaluation enregistrée pour cet agent.</p>
            </div>
          ) : (
            evaluationHistory.map((eval_item, i) => (
              <div key={i} className="p-6 bg-muted/40 border border-border rounded-2xl hover:border-primary/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-primary/20 rounded-lg text-[10px] font-black text-primary uppercase">
                      Score: {(
                        (eval_item.score_accueil + eval_item.score_energie + eval_item.score_voix + 
                         eval_item.score_ecoute + eval_item.score_client + eval_item.score_ope + 
                         eval_item.score_efficacite + eval_item.score_conclusion) / 8
                      ).toFixed(1)}/5
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(eval_item.evaluation_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <span className="text-[9px] font-black text-muted-foreground/70 uppercase tracking-widest">Par {eval_item.evaluator_name}</span>
                </div>
                <p className="text-xs font-medium text-foreground/70 leading-relaxed italic">
                  "{eval_item.commentaires || "Aucun commentaire"}"
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
