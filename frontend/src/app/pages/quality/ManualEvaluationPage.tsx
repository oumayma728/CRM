import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, User, Calendar, Phone, 
  Star, Save, AlertCircle, CheckCircle2, 
  TrendingUp, MessageSquare, Info, FileDown
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface EvaluationCriterion {
  id: string;
  category: string;
  label: string;
  score: number;
}

export default function ManualEvaluationPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | string>('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    callDate: new Date().toISOString().split('T')[0],
    callRef: '',
    comment: '',
    decision: 'conforme', // conforme, non-conforme, coaching
  });

  const [criteria, setCriteria] = useState<EvaluationCriterion[]>([
    { id: 'accueil_formule', category: 'ACCUEIL', label: 'Formule d\'accueil respectée', score: 0 },
    { id: 'accueil_sourire', category: 'ACCUEIL', label: 'Sourire s\'entend à la voix', score: 0 },
    { id: 'decouverte_besoin', category: 'DÉCOUVERTE', label: 'Identification des besoins', score: 0 },
    { id: 'decouverte_ecoute', category: 'DÉCOUVERTE', label: 'Écoute active et reformulation', score: 0 },
    { id: 'argumentaire_maitrise', category: 'ARGUMENTAIRE', label: 'Maitrise du produit/service', score: 0 },
    { id: 'argumentaire_objection', category: 'ARGUMENTAIRE', label: 'Traitement des objections', score: 0 },
    { id: 'closing_recap', category: 'CLOSING', label: 'Récapitulatif de l\'offre', score: 0 },
    { id: 'closing_conge', category: 'CLOSING', label: 'Prise de congé professionnelle', score: 0 },
  ]);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const data = await api.getAgents();
      setAgents(data.filter((u: any) => u.role === 'agent'));
    } catch (e) {
      toast.error("Erreur de chargement des agents");
    }
  };

  const handleScoreChange = (id: string, score: number) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, score } : c));
  };

  const calculateTotalScore = () => {
    const total = criteria.reduce((acc, c) => acc + c.score, 0);
    return ((total / (criteria.length * 5)) * 100).toFixed(1);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF() as any;
      const selectedAgent = agents.find(a => a.id == selectedAgentId);
      const agentName = selectedAgent ? (selectedAgent.name || selectedAgent.username) : 'Inconnu';

      // Header
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('FICHE D\'ÉVALUATION QUALITÉ', 105, 25, { align: 'center' });

      // Info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text(`Agent: ${agentName}`, 20, 50);
      doc.text(`Date: ${formData.callDate}`, 20, 60);
      doc.text(`Référence: ${formData.callRef || 'N/A'}`, 20, 70);
      doc.text(`Score Global: ${calculateTotalScore()}%`, 150, 50);
      doc.text(`Décision: ${formData.decision.toUpperCase()}`, 150, 60);

      // Table
      const tableData = criteria.map(c => [c.category, c.label, `${c.score}/5`]);
      autoTable(doc, {
        startY: 80,
        head: [['Catégorie', 'Critère', 'Note']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }
      });

      // Comment
      const finalY = (doc as any).lastAutoTable?.finalY || 150;
      doc.text('Observations & Synthèse:', 20, finalY + 15);
      doc.setFontSize(10);
      const splitComment = doc.splitTextToSize(formData.comment || 'Aucun commentaire.', 170);
      doc.text(splitComment, 20, finalY + 25);

      doc.save(`Evaluation_${agentName}_${formData.callDate}.pdf`);
      toast.success("PDF généré !");
    } catch (error) {
      console.error("PDF Error:", error);
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId) {
      toast.error("Veuillez sélectionner un agent");
      return;
    }

    setLoading(true);
    try {
      const evaluationPayload = {
        agent_id: Number(selectedAgentId),
        call_date: formData.callDate,
        call_ref: formData.callRef,
        decision: formData.decision,
        commentaires: formData.comment,
        scores: criteria.reduce((acc, c) => ({ ...acc, [c.id]: c.score }), {}),
        global_score: calculateTotalScore()
      };

      await api.saveQualityEvaluation(evaluationPayload);
      toast.success("Évaluation enregistrée avec succès !");
      
      // Reset form optionnel ou rester pour export PDF
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 shadow-lg">
            <ClipboardCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
              Grille d'Évaluation <span className="text-amber-500">Manuelle</span>
            </h2>
      
          </div>
        </div>
        <div className="px-6 py-3 bg-card border border-border rounded-2xl shadow-sm text-center min-w-[140px]">
          <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Score Global</p>
          <p className={`text-2xl font-black ${Number(calculateTotalScore()) > 75 ? 'text-emerald-500' : 'text-amber-500'}`}>
            {calculateTotalScore()}%
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Colonne Gauche: Infos & Paramètres */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-[32px] p-6 shadow-sm">
            <h3 className="font-black text-xs uppercase tracking-widest text-foreground mb-6 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" /> Informations de l'Appel
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Agent à évaluer</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select 
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                  >
                    <option value="">Sélectionner un agent...</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.name || a.username}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Date de l'appel</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="date"
                    value={formData.callDate}
                    onChange={(e) => setFormData({...formData, callDate: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Référence Appel (Audio)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text"
                    placeholder="ex: CALL-2024-001"
                    value={formData.callRef}
                    onChange={(e) => setFormData({...formData, callRef: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-[32px] p-6 shadow-sm">
            <h3 className="font-black text-xs uppercase tracking-widest text-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Décision Finale
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'conforme', label: 'Conforme', color: 'bg-emerald-500', icon: CheckCircle2, active: 'border-emerald-500 bg-emerald-500/5', iconActive: 'text-emerald-500' },
                { id: 'coaching', label: 'À Coacher', color: 'bg-amber-500', icon: MessageSquare, active: 'border-amber-500 bg-amber-500/5', iconActive: 'text-amber-500' },
                { id: 'non-conforme', label: 'Non-Conforme', color: 'bg-rose-500', icon: AlertCircle, active: 'border-rose-500 bg-rose-500/5', iconActive: 'text-rose-500' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setFormData({...formData, decision: d.id})}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                    formData.decision === d.id 
                    ? d.active
                    : 'border-transparent bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <d.icon className={`w-5 h-5 ${
                    formData.decision === d.id 
                    ? d.iconActive
                    : 'text-slate-400'
                  }`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    formData.decision === d.id ? 'text-foreground' : 'text-slate-500'
                  }`}>{d.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne Droite: Grille de scores & Commentaires */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-[32px] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border bg-muted/20">
              <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Éléments de Maîtrise</h3>
            </div>
            
            <div className="p-0">
              {['ACCUEIL', 'DÉCOUVERTE', 'ARGUMENTAIRE', 'CLOSING'].map((cat) => (
                <div key={cat} className="border-b border-border last:border-0">
                  <div className="px-6 py-3 bg-muted/10">
                    <span className="text-[9px] font-black text-primary tracking-[0.2em]">{cat}</span>
                  </div>
                  <div className="divide-y divide-border/50">
                    {criteria.filter(c => c.category === cat).map((criterion) => (
                      <div key={criterion.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/5 transition-colors">
                        <span className="text-xs font-bold text-foreground">{criterion.label}</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleScoreChange(criterion.id, star)}
                              className={`transition-all ${star <= criterion.score ? 'text-amber-500 scale-110' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
                            >
                              <Star className={`w-5 h-5 ${star <= criterion.score ? 'fill-current' : ''}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 block flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Synthèse & Recommandations
            </label>
            <textarea 
              value={formData.comment}
              onChange={(e) => setFormData({...formData, comment: e.target.value})}
              placeholder="Points forts, axes d'amélioration et plan d'action..."
              className="w-full bg-background/50 border border-border rounded-2xl p-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 min-h-[150px] transition-all resize-none shadow-inner"
            />
          </div>

          {/* Cadre de Validation - Design Corrigé */}
          <div className="bg-card border border-primary/20 rounded-3xl p-10 shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0"></div>
            
            <div className="flex flex-col gap-8">
              <div className="text-center space-y-1">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Validation Finale</h4>
                <p className="text-lg font-black text-foreground italic tracking-tight">Vérifiez les scores avant de valider l'évaluation.</p>
                <p className="text-xs text-muted-foreground">Une fois validée, l'évaluation sera ajoutée à l'historique de l'agent.</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 border-t border-border pt-8">
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); exportToPDF(); }}
                  className="px-8 py-4 bg-background/50 border border-primary/30 text-primary rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-primary/20 transition-all active:scale-95"
                >
                  <FileDown className="w-4 h-4" />
                  GÉNÉRER RAPPORT PDF
                </button>

                <button 
                  type="submit"
                  disabled={loading}
                  className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {loading ? "TRAITEMENT..." : "ENREGISTRER L'ÉVALUATION"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
