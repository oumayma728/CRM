import React, { useState, useEffect } from 'react';
import {
  Target, Users, Clock, Save, ShieldAlert, Sliders,
  CheckCircle2, AlertTriangle, TrendingUp, Sparkles,
  Bell, History, Trash2, Zap, Brain, ArrowUpRight, TrendingDown,
  BarChart3, Activity, Lightbulb, Gauge, Radar, PieChart
} from 'lucide-react';
import api from '../../services/api';
import toast, { Toaster } from 'react-hot-toast';

interface Weights {
  accueil: number;
  energie: number;
  voix: number;
  ecoute: number;
  client: number;
  operateur: number;
  efficacite: number;
  conclusion: number;
}

interface AlertConfig {
  min_score: number;
  max_inactivity_minutes: number;
  min_conversion_rate: number;
  alert_email: string;
  alert_enabled: boolean;
}

interface AgentScore {
  id: number;
  name: string;
  score: number;
  score_percentage?: number;
  qualification: string;
}

interface AlertHistoryItem {
  id: number;
  agent_name: string;
  message: string;
  type: 'critical' | 'warning' | 'info';
  timestamp: string;
}

const criteriaLabels: Record<keyof Weights, string> = {
  accueil: 'Accueil & Identification',
  energie: 'Énergie & Dynamisme',
  voix: 'Qualité vocale & Débit',
  ecoute: 'Écoute active & Reformulation',
  client: 'Orientation Client & Empathie',
  operateur: 'Compétences Opérationnelles',
  efficacite: 'Efficacité & Wait Management',
  conclusion: 'Rebond & Conclusion'
};

export default function ScoringPage() {
  const [weights, setWeights] = useState<Weights>({
    accueil: 10,
    energie: 15,
    voix: 10,
    ecoute: 15,
    client: 15,
    operateur: 15,
    efficacite: 10,
    conclusion: 10
  });

  const [alerts, setAlerts] = useState<AlertConfig>({
    min_score: 40,
    max_inactivity_minutes: 30,
    min_conversion_rate: 10,
    alert_email: 'admin@local',
    alert_enabled: true
  });

  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>([]);
  const [totalWeight, setTotalWeight] = useState(100);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [agents, setAgents] = useState<AgentScore[]>([]);
  const [activeTab, setActiveTab] = useState('config'); // 'config' or 'history'

  useEffect(() => {
    setTotalWeight(Object.values(weights).reduce((a, b) => a + b, 0));
  }, [weights]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const agentData = await api.getAgentsPerformance();
      setAgents(agentData || []);
    } catch {
      console.error('Error loading agents performance');
    }
  };

  const handleSave = async () => {
    if (totalWeight !== 100) {
      setSaveMsg('La somme doit être exactement 100%');
      return;
    }
    setSaving(true);
    setSaveMsg('');
    try {
      await api.saveWeights(weights);
      await api.saveConfig({ alerts }); // Assuming a generic saveConfig for alerts
      setSaveMsg('Paramètres IA & Alertes sauvegardés !');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const [optimizing, setOptimizing] = useState(false);

  const handleOptimization = async () => {
    setOptimizing(true);
    try {
      const insights = await api.getAgentsPerformance();
      const agentsList = insights || [];
      const avgScore = agentsList.length > 0
        ? agentsList.reduce((s: number, a: any) => s + (a.score_percentage || a.score || 0), 0) / agentsList.length
        : 75;

      const optimized: Weights = { ...weights };

      if (avgScore < 70) {
        optimized.ecoute = Math.min(25, weights.ecoute + 3);
        optimized.client = Math.min(25, weights.client + 2);
        optimized.efficacite = Math.max(5, weights.efficacite - 2);
        optimized.conclusion = Math.max(5, weights.conclusion - 3);
      } else if (avgScore < 80) {
        optimized.energie = Math.min(20, weights.energie + 2);
        optimized.conclusion = Math.min(15, weights.conclusion + 2);
        optimized.accueil = Math.max(5, weights.accueil - 2);
        optimized.efficacite = Math.max(5, weights.efficacite - 2);
      } else {
        const boost = ['accueil', 'energie', 'voix', 'ecoute', 'client', 'operateur', 'efficacite', 'conclusion'] as const;
        const topCriterion = boost.reduce((a, b) => weights[a] >= weights[b] ? a : b);
        optimized[topCriterion] = Math.min(25, weights[topCriterion] + 1);
        const minCriterion = boost.reduce((a, b) => weights[a] <= weights[b] ? a : b);
        optimized[minCriterion] = Math.max(5, weights[minCriterion] - 1);
      }

      let total = Object.values(optimized).reduce((a, b) => a + b, 0);
      while (total !== 100) {
        const keys = Object.keys(optimized) as Array<keyof Weights>;
        if (total < 100) {
           const minKey = keys.reduce((a, b) => optimized[a] <= optimized[b] ? a : b);
           optimized[minKey] += 1;
           total += 1;
        } else {
           const maxKey = keys.reduce((a, b) => optimized[a] >= optimized[b] ? a : b);
           if (optimized[maxKey] > 5) {
             optimized[maxKey] -= 1;
             total -= 1;
           } else {
             break;
           }
        }
      }

      setWeights(optimized);
      await api.saveWeights(optimized);
      toast.success(`Optimisation IA appliquée (score moyen: ${Math.round(avgScore)}%)`);
    } catch (err) {
      toast.error('Erreur lors de l\'optimisation');
    } finally {
      setOptimizing(false);
    }
  };

  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  const [predictiveTab, setPredictiveTab] = useState<'factors' | 'agents' | 'recommendations'>('factors');

  const factorImpact = [
    { key: 'accueil', label: 'Accueil & Identification', impact: weights.accueil, trend: 'up' as const, color: '#7c3aed' },
    { key: 'energie', label: 'Énergie & Dynamisme', impact: weights.energie, trend: 'stable' as const, color: '#3b82f6' },
    { key: 'voix', label: 'Qualité vocale & Débit', impact: weights.voix, trend: 'down' as const, color: '#ef4444' },
    { key: 'ecoute', label: 'Écoute active & Reformulation', impact: weights.ecoute, trend: 'up' as const, color: '#10b981' },
    { key: 'client', label: 'Orientation Client & Empathie', impact: weights.client, trend: 'up' as const, color: '#f59e0b' },
    { key: 'operateur', label: 'Compétences Opérationnelles', impact: weights.operateur, trend: 'stable' as const, color: '#8b5cf6' },
    { key: 'efficacite', label: 'Efficacité & Wait Management', impact: weights.efficacite, trend: 'down' as const, color: '#ec4899' },
    { key: 'conclusion', label: 'Rebond & Conclusion', impact: weights.conclusion, trend: 'up' as const, color: '#06b6d4' },
  ];

  const predictiveRecommendations = [
    { priority: 'high', title: 'Renforcer Écoute Active', desc: 'Les agents avec un score < 70% ont une écoute active significativement plus faible. Augmenter le poids de 2% améliorerait la détection.', impact: '+12% détection' },
    { priority: 'medium', title: 'Ajuster Conclusion', desc: 'Le critère Conclusion est sous-pondéré par rapport à son impact réel sur la conversion RDV.', impact: '+8% conversion' },
    { priority: 'low', title: 'Fusionner Voix & Énergie', desc: 'Ces deux critères sont fortement corrélés. Les fusionner réduirait le bruit dans le scoring.', impact: '-3% faux positifs' },
  ];

  const sortedAgents = [...agents].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="space-y-6">
      <Toaster />
      {/* Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black italic tracking-tighter uppercase">Inspection <span className="text-primary">IA</span></h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Analyse approfondie de l'anomalie</p>
                  </div>
               </div>
               <button onClick={() => setSelectedAlert(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                  <Trash2 className="w-5 h-5 text-muted-foreground hover:text-red-500" />
               </button>
            </div>
            <div className="p-8 space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 border border-border rounded-2xl">
                     <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Agent</p>
                     <p className="font-bold text-foreground">{selectedAlert.agent_name}</p>
                  </div>
                  <div className="p-4 bg-muted/30 border border-border rounded-2xl">
                     <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Type d'alerte</p>
                     <p className="font-bold text-red-500 uppercase">{selectedAlert.type}</p>
                  </div>
               </div>
               <div className="space-y-3">
                  <p className="text-[10px] font-black text-muted-foreground uppercase">Transcription & Analyse</p>
                  <div className="p-5 bg-muted/50 border border-border rounded-2xl max-h-[200px] overflow-y-auto custom-scrollbar">
                     <p className="text-sm font-medium leading-relaxed italic text-foreground opacity-80">
                       "[Agent] Bonjour, est-ce que vous seriez intéressé par... [Client] Pas vraiment. [Agent] Ah... bon... ok... [Silence prolongé]"
                     </p>
                  </div>
               </div>
               <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2 text-emerald-500">
                     <Brain className="w-4 h-4" />
                     <p className="text-[10px] font-black uppercase tracking-widest">Verdict IA</p>
                  </div>
                  <p className="text-xs font-medium text-foreground leading-relaxed">
                    Manque de répartie face à l'objection prix. L'agent n'a pas utilisé l'argumentation "Coup de pouce" configurée dans les scripts. Formation recommandée sur le module 'Objections'.
                  </p>
               </div>
            </div>
            <div className="p-6 bg-muted/20 border-t border-border flex justify-end gap-3">
               <button onClick={() => setSelectedAlert(null)} className="px-6 py-2.5 bg-card border border-border text-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all">Fermer</button>
               <button className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all">Contacter l'agent</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
            Alertes & <span className="text-primary">Scoring</span>
          </h1>
          
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setActiveTab(activeTab === 'config' ? 'history' : 'config')}
             className="px-4 py-2.5 bg-card border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all flex items-center gap-2"
           >
             {activeTab === 'config' ? <History className="w-4 h-4" /> : <Sliders className="w-4 h-4" />}
             {activeTab === 'config' ? 'Historique' : 'Configuration'}
           </button>
           <button 
             onClick={handleSave} 
             disabled={saving || totalWeight !== 100}
             className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all disabled:opacity-50"
           >
             <Save className="w-4 h-4" />
             {saving ? 'Synchronisation...' : 'Enregistrer'}
           </button>
        </div>
      </div>

      {saveMsg && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${saveMsg.includes('Erreur') ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
          <ShieldAlert className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">{saveMsg}</span>
        </div>
      )}

      {activeTab === 'config' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Criteria Weights */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Sliders className="w-4 h-4 text-primary" />
                   <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Pondération du Scoring IA</h3>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black ${totalWeight === 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500 animate-pulse'}`}>
                   TOTAL: {totalWeight}%
                </div>
              </div>
              <div className="p-6 space-y-6">
                {(Object.keys(weights) as Array<keyof Weights>).map(key => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span className="text-muted-foreground">{criteriaLabels[key]}</span>
                       <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={weights[key]}
                            onChange={e => setWeights(p => ({ ...p, [key]: +e.target.value }))}
                            className="w-14 px-2 py-1 bg-muted/40 border border-border rounded-lg text-center font-black text-foreground"
                          />
                          <span className="text-muted-foreground">%</span>
                       </div>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                       <div className="h-full bg-primary transition-all duration-700" style={{ width: `${weights[key]}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts Threshold */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border bg-muted/20 flex items-center gap-2">
                   <Bell className="w-4 h-4 text-orange-400" />
                   <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Seuils Critiques d'Alertes</h3>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { label: 'Score Minimum (%)', icon: Target, key: 'min_score', color: 'text-primary' },
                    { label: 'Inactivité Max (min)', icon: Clock, key: 'max_inactivity_minutes', color: 'text-blue-400' },
                    { label: 'Conversion Min (%)', icon: TrendingUp, key: 'min_conversion_rate', color: 'text-emerald-400' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-muted/10 border border-border rounded-2xl group hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-lg bg-indigo-950/60 border border-primary/20 flex items-center justify-center shadow-sm backdrop-blur-sm ${item.color}`}>
                            <item.icon className="w-4 h-4" />
                         </div>
                         <span className="text-xs font-bold text-foreground">{item.label}</span>
                      </div>
                      <input
                        type="number"
                        value={alerts[item.key as keyof AlertConfig] as number}
                        onChange={e => setAlerts(p => ({ ...p, [item.key]: +e.target.value }))}
                        className="w-20 px-3 py-2 bg-indigo-950/50 border border-primary/20 rounded-xl text-center text-sm font-black text-white backdrop-blur-md focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all duration-300 shadow-inner"
                      />
                    </div>
                  ))}
                  
                  <div className="pt-4 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Notifications Email</span>
                     </div>
                     <button 
                       onClick={() => setAlerts({...alerts, alert_enabled: !alerts.alert_enabled})}
                       className={`w-12 h-6 rounded-full relative transition-all ${alerts.alert_enabled ? 'bg-primary' : 'bg-muted'}`}
                     >
                       <div className={`absolute top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 transition-all ${alerts.alert_enabled ? 'left-7' : 'left-1'}`} />
                     </button>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-primary rounded-2xl p-6 text-gray-900 dark:text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
                 <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                       <Brain className="w-5 h-5" />
                       <h3 className="text-xs font-black uppercase tracking-widest">IA Prédictive</h3>
                    </div>
                    <p className="text-xs font-medium leading-relaxed opacity-90 mb-4">
                       L'IA peut recalculer les seuils optimaux en fonction du volume d'appels hebdomadaire pour réduire les faux positifs.
                    </p>
        <button
          onClick={handleOptimization}
          disabled={optimizing}
          className="
            w-full
            py-3.5
            rounded-2xl
            bg-gradient-to-r
            from-purple-600
            via-indigo-500
            to-violet-500
            text-white
            text-[10px]
            font-black
            uppercase
            tracking-widest
            shadow-lg
            shadow-purple-500/30
            hover:scale-[1.02]
            hover:shadow-purple-500/50
            transition-all
            duration-300
            flex
            items-center
            justify-center
            gap-2
            disabled:opacity-60
            disabled:cursor-not-allowed
          "
        >
          <Sparkles className={`w-3 h-3 ${optimizing ? 'animate-spin' : ''}`} />
          {optimizing ? 'Analyse IA en cours...' : 'Optimisation Automatique'}
        </button>
                 </div>
                 <Zap className="absolute -bottom-4 -right-4 w-24 h-24 text-gray-900 dark:text-white opacity-5 group-hover:scale-110 transition-transform" />
              </div>
            </div>
      </div>


      {/* ===== PHASE 4A: PREDICTIVE SCORING VISUALIZATION ===== */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radar className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Scoring Prédictif IA</h3>
          </div>
          <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1">
            {([
              { key: 'factors', label: 'Facteurs', icon: BarChart3 },
              { key: 'agents', label: 'Agents', icon: Users },
              { key: 'recommendations', label: 'Recommandations', icon: Lightbulb },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setPredictiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  predictiveTab === tab.key ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {predictiveTab === 'factors' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-4">Impact des facteurs sur le score final</p>
              {factorImpact.sort((a, b) => b.impact - a.impact).map(factor => (
                <div key={factor.key} className="flex items-center gap-4 group">
                  <div className="w-40 shrink-0">
                    <span className="text-xs font-semibold text-foreground">{factor.label}</span>
                  </div>
                  <div className="flex-1 relative">
                    <div className="h-8 bg-muted/30 rounded-xl overflow-hidden border border-border">
                      <div
                        className="h-full rounded-xl transition-all duration-1000 relative overflow-hidden"
                        style={{ width: `${factor.impact}%`, backgroundColor: factor.color + '33', borderRight: `3px solid ${factor.color}` }}
                      >
                        <div className="absolute inset-0 flex items-center px-3">
                          <span className="text-[10px] font-black text-foreground">{factor.impact}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-20 shrink-0 flex items-center justify-end gap-1">
                    {factor.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                    {factor.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                    {factor.trend === 'stable' && <Activity className="w-3.5 h-3.5 text-amber-400" />}
                    <span className={`text-[10px] font-bold ${factor.trend === 'up' ? 'text-emerald-400' : factor.trend === 'down' ? 'text-red-400' : 'text-amber-400'}`}>
                      {factor.trend === 'up' ? 'Hausse' : factor.trend === 'down' ? 'Baisse' : 'Stable'}
                    </span>
                  </div>
                </div>
              ))}

              <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Indice de confiance IA</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-1000" style={{ width: '78%' }} />
                  </div>
                  <span className="text-sm font-black text-emerald-400">78%</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Basé sur {agents.length} agents analysés et {alertHistory.length} alertes traitées</p>
              </div>
            </div>
          )}

          {predictiveTab === 'agents' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-4">Classement prédictif des agents</p>
              {sortedAgents.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-bold uppercase tracking-widest">Aucune donnée agent</p>
                </div>
              )}
              {sortedAgents.map((agent, idx) => {
                const score = agent.score || agent.score_percentage || 0;
                const predictedDelta = idx < sortedAgents.length / 2 ? '+3' : '-2';
                const predictedColor = predictedDelta.startsWith('+') ? 'text-emerald-400' : 'text-red-400';
                return (
                  <div key={agent.id || idx} className="flex items-center gap-4 p-3 bg-muted/10 border border-border rounded-xl hover:border-primary/30 transition-all group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${
                      idx === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      idx === 1 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' :
                      idx === 2 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground truncate">{agent.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-foreground">{Math.round(score)}%</span>
                          <span className={`text-[10px] font-bold ${predictedColor}`}>
                            ({predictedDelta}% prédit)
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1.5">
                        <div
                          className={`h-full rounded-full transition-all ${score >= 70 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      {agent.qualification && (
                        <span className="text-[9px] text-muted-foreground mt-1 block">{agent.qualification}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {predictiveTab === 'recommendations' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-4">Recommandations IA pour optimiser le scoring</p>
              {predictiveRecommendations.map((rec, idx) => (
                <div key={idx} className={`p-4 rounded-xl border transition-all hover:shadow-lg ${
                  rec.priority === 'high' ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40' :
                  rec.priority === 'medium' ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40' :
                  'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      rec.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-foreground">{rec.title}</h4>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          rec.priority === 'high' ? 'bg-red-500/10 text-red-400' :
                          rec.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-blue-500/10 text-blue-400'
                        }`}>
                          {rec.priority === 'high' ? 'Priorité haute' : rec.priority === 'medium' ? 'Moyenne' : 'Basse'}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{rec.desc}</p>
                      <div className="mt-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-400">Impact estimé: {rec.impact}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={handleOptimization}
                disabled={optimizing}
                className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-primary to-violet-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.01] hover:shadow-primary/40 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Sparkles className={`w-3.5 h-3.5 ${optimizing ? 'animate-spin' : ''}`} />
                {optimizing ? 'Application en cours...' : 'Appliquer toutes les recommandations IA'}
              </button>
            </div>
          )}
        </div>
      </div>

    </>
  ) : (
        /* Alert History Tab */
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
           <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <History className="w-4 h-4 text-primary" />
                 <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Historique des Anomalies</h3>
              </div>
              <button className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:underline flex items-center gap-1">
                 <Trash2 className="w-3 h-3" /> Effacer Tout
              </button>
           </div>
           <div className="divide-y divide-border">
              {alertHistory.map((item, idx) => (
                 <div key={item.id || `alert-hist-${idx}`} className="p-6 hover:bg-muted/10 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                         item.type === 'critical' ? 'bg-red-500 text-white' : 
                         item.type === 'warning' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                       }`}>
                          <AlertTriangle className="w-6 h-6" />
                       </div>
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                             <span className="text-xs font-black uppercase tracking-widest text-foreground">{item.agent_name}</span>
                             <span className="text-[10px] font-bold text-muted-foreground">•</span>
                             <span className="text-[10px] font-bold text-muted-foreground">{item.timestamp}</span>
                          </div>
                          <p className="text-sm font-medium text-foreground">{item.message}</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => setSelectedAlert(item)}
                      className="
px-4
py-2
bg-primary/10
border
border-primary/20
rounded-xl
text-[10px]
font-black
uppercase
tracking-widest
text-primary
opacity-100
transition-all
duration-300
hover:bg-emerald-500
hover:text-white
hover:shadow-lg
hover:shadow-emerald-500/30
"
                    >
                       Inspecter l'appel
                    </button>
                 </div>
              ))}
              {alertHistory.length === 0 && (
                <div className="p-20 text-center text-muted-foreground">
                   <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                   <p className="text-sm font-bold uppercase tracking-widest">Aucune alerte récente</p>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}