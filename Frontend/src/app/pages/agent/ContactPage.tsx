import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../../components/Layout';
import { agentService, type Contact, type CreateAppelDTO } from '../../../services/agentService';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AiAnalysis {
  sentiment: string;
  sentiment_score: number;
  score_percentage: number;
  performance: string;
  summary: string;
  keywords: string[];
  score_ecoute: number;
  score_persuasion: number;
  score_empathie: number;
  score_argumentation: number;
  score_refus: number;
  score_vente: number;
  agent_talk_ratio: number;
  client_talk_ratio: number;
  labeled_transcript: string;
  script_respected: boolean;
  objections_handled: boolean;
  customer_intent: string | null;
  next_steps: string | null;
  refusal_detected: boolean;
  refusal_motive: string;
  refusal_keywords: string[];
  suggested_response: string;
  inactivity_detected: boolean;
  appointment_detected: boolean;
  qualification_coherent: boolean;
  qualification_details: string;
  postal_code: string | null;
  postal_region: string | null;
}

// ── CircleScore ───────────────────────────────────────────────────────────────
const CircleScore: React.FC<{ value: number; label: string; color?: string; size?: number }> = ({
  value, label, color = '#8B7EF5', size = 60
}) => {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * Math.min(value, 100)) / 100;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <text x={size / 2} y={size / 2 + 5} textAnchor="middle"
          style={{ fontSize: size * 0.22, fontWeight: 700, fill: '#0F172A' }}>
          {Math.round(value)}%
        </text>
      </svg>
      <span className="text-xs text-muted-foreground text-center">{label}</span>
    </div>
  );
};

// ── ScoreBar ──────────────────────────────────────────────────────────────────
const ScoreBar: React.FC<{ label: string; value: number; max?: number; color?: string }> = ({
  label, value, max = 10, color = '#8B7EF5'
}) => (
  <div className="flex items-center gap-2 mb-1.5">
    <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, background: color }} />
    </div>
    <span className="text-xs font-medium w-5 text-right">{value}</span>
  </div>
);

// ── API helper ────────────────────────────────────────────────────────────────
const API_BASE = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:5241') + '/api';

async function analyzeTranscript(transcript: string, callDuration: number, qualification?: string): Promise<AiAnalysis> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/analyze/transcript`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ transcript, callDuration, qualification }),
  });
  if (!res.ok) throw new Error('Analyse echouee');
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function ContactPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactId, setContactId] = useState<string | null>(null);
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [rdvId, setRdvId] = useState<string | null>(null);
  const [appelDone, setAppelDone] = useState(false);

  // call
  const [enAppel, setEnAppel] = useState(false);
  const [duree, setDuree] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [transcriptLines] = useState([
    { role: 'agent', text: 'Bonjour, je suis de EBI. Puis-je parler a vous ?', sentiment: 'Neutre' },
    { role: 'client', text: "Oui, c'est moi. De quoi s'agit-il ?", sentiment: 'Neutre' },
    { role: 'agent', text: "Je vous appelle concernant les solutions de renovation energetique eligibles aux aides d'etat.", sentiment: 'Positif' },
    { role: 'client', text: 'Ah oui, je suis interesse. Quels sont vos tarifs ?', sentiment: 'Positif' },
  ]);

  // qualification form
  const [besoin, setBesoin] = useState('');
  const [budget, setBudget] = useState('');
  const [niveauInteret, setNiveauInteret] = useState('');
  const [notes, setNotes] = useState('');
  const [dateRappel, setDateRappel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // AI
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTab, setAiTab] = useState<'scores' | 'analysis' | 'refusal'>('scores');

  // ── Load contact ──────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const rt = params.get('returnTo');
    const rid = params.get('rdvId');
    setContactId(id);
    setReturnTo(rt);
    setRdvId(rid);
    if (!id) { setLoading(false); return; }
    agentService.getContactById(parseInt(id))
      .then(data => setContact(data))
      .catch(() => toast.error('Impossible de charger le contact'))
      .finally(() => setLoading(false));
  }, []);

  // ── Call timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (enAppel && !isOnHold) {
      intervalRef.current = setInterval(() => setDuree(d => d + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [enAppel, isOnHold]);

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ── Call controls ─────────────────────────────────────────────────────────
  const handleStartCall = () => { setEnAppel(true); setDuree(0); toast.info('Appel demarre'); };

  const handleStopCall = async () => {
    setEnAppel(false);
    setIsOnHold(false);
    if (duree > 5) await triggerAiAnalysis();
    toast.info('Appel termine');
  };

  const triggerAiAnalysis = async () => {
    const transcript = transcriptLines
      .map(l => `${l.role === 'agent' ? 'Agent' : 'Client'}: ${l.text}`)
      .join('\n');
    setAiLoading(true);
    try {
      const result = await analyzeTranscript(transcript, duree, besoin || 'PAC');
      setAiAnalysis(result);
      toast.success('Analyse IA terminee');
    } catch {
      toast.warning('Analyse IA non disponible');
    } finally {
      setAiLoading(false);
    }
  };

  // ── Qualification ─────────────────────────────────────────────────────────
  const handleQualification = async (action: 'converti' | 'rappel' | 'refuse') => {
    if (!contact) return;
    setSubmitting(true);
    const isConf = !!(returnTo && rdvId);
    try {
      if (isConf) {
        const prefix = returnTo!.split('/').filter(Boolean)[0];
        const rdvStatut = action === 'converti' ? 'CONFIRME' : action === 'rappel' ? 'REPORTER' : 'ANNULE';
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE}/${prefix}/rdv/${rdvId}/statut`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ statut: rdvStatut, commentaire: notes }),
        });
        if (action === 'converti') toast.success('RDV confirme !');
        else if (action === 'rappel') toast.success('RDV reporte !');
        else toast.info('RDV annule');
        setAppelDone(true);
      } else {
        let qualification = '';
        let dateRappelPlanifie: string | undefined = undefined;
        switch (action) {
          case 'converti': qualification = 'RENDEZ_VOUS'; toast.success('RDV enregistre !'); break;
          case 'rappel': qualification = 'RAPPEL'; dateRappelPlanifie = dateRappel || new Date().toISOString(); toast.success('Rappel planifie !'); break;
          case 'refuse': qualification = 'REFUS_PAS_INTERESSE'; toast.info('Refus enregistre'); break;
        }
        const appelData: CreateAppelDTO = {
          agentId: user?.id || 1,
          contactId: contact.id,
          dureeSecondes: duree,
          qualification,
          dateRappelPlanifie,
        };
        await agentService.enregistrerAppel(appelData);
        setAppelDone(true);
        setTimeout(() => { window.location.href = '/agent/contacts'; }, 1500);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetourAgenda = () => {
    if (returnTo && rdvId) navigate(`${returnTo}?calledRdvId=${rdvId}`);
  };

  const sentimentStyle = (s: string) =>
    s === 'POSITIVE' ? 'text-green-700 bg-green-50 border-green-200' :
    s === 'NEGATIVE' ? 'text-red-700 bg-red-50 border-red-200' :
    'text-yellow-700 bg-yellow-50 border-yellow-200';

  const sentimentLabel = (s: string) =>
    s === 'POSITIVE' ? 'Positif' : s === 'NEGATIVE' ? 'Negatif' : 'Neutre';

  // ── Guards ────────────────────────────────────────────────────────────────
  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    </Layout>
  );

  if (!contactId) return (
    <Layout>
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">Aucun contact selectionne</p>
        <button onClick={() => { window.location.href = '/agent/contacts'; }} className="px-4 py-2 bg-primary text-white rounded">
          Retour a la liste
        </button>
      </div>
    </Layout>
  );

  if (!contact) return (
    <Layout>
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">Contact non trouve</p>
        <button onClick={() => { window.location.href = '/agent/contacts'; }} className="px-4 py-2 bg-primary text-white rounded">
          Retour a la liste
        </button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      {/* Confirmatrice banner */}
      {returnTo && rdvId && (
        <div className={`mb-4 flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium ${
          appelDone ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          <span>{appelDone ? 'Appel enregistre — retournez a l agenda' : 'Appel depuis agenda confirmatrice'}</span>
          {appelDone && (
            <button onClick={handleRetourAgenda} className="ml-4 px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium">
              Retourner a l agenda
            </button>
          )}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h2>Appel en direct</h2>
          <p className="text-muted-foreground mt-1">Gerez vos appels et qualifications en temps reel</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* LEFT — Console + Transcript */}
          <div className="space-y-4">

            <div className="bg-card rounded-xl border border-border p-5">
              <div className="text-center mb-4">
                <div className="text-4xl font-mono font-bold text-foreground mb-1">{fmt(duree)}</div>
                <div className={`text-xs font-medium px-3 py-1 rounded-full inline-block ${
                  enAppel && !isOnHold ? 'bg-green-100 text-green-700' :
                  enAppel ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
                }`}>
                  {enAppel && !isOnHold ? 'En ligne' : enAppel ? 'En attente' : 'Inactif'}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4 p-3 bg-muted/30 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                  {(contact.prenom?.[0] || '?').toUpperCase()}{(contact.nom?.[0] || '').toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">{contact.prenom} {contact.nom}</div>
                  <div className="text-xs text-muted-foreground">{contact.telephone || 'Pas de telephone'}</div>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {!enAppel ? (
                  <button onClick={handleStartCall}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm">
                    Demarrer l appel
                  </button>
                ) : (
                  <>
                    <button onClick={() => setIsOnHold(!isOnHold)}
                      className={`p-2.5 rounded-lg border text-sm ${isOnHold ? 'bg-amber-100 border-amber-300 text-amber-700' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                      {isOnHold ? 'Resume' : 'Pause'}
                    </button>
                    <button onClick={() => setIsMuted(!isMuted)}
                      className={`p-2.5 rounded-lg border text-sm ${isMuted ? 'bg-red-100 border-red-300 text-red-700' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                      {isMuted ? 'Muted' : 'Mic'}
                    </button>
                    <button onClick={handleStopCall}
                      className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm">
                      Raccrocher
                    </button>
                  </>
                )}
              </div>

              {!enAppel && duree > 0 && !aiAnalysis && (
                <button onClick={triggerAiAnalysis} disabled={aiLoading}
                  className="mt-3 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium disabled:opacity-50">
                  {aiLoading ? 'Analyse en cours...' : 'Analyser la conversation IA'}
                </button>
              )}
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-semibold">Transcription IA</span>
                {aiLoading && <span className="text-xs text-purple-500 animate-pulse">Analyse...</span>}
              </div>
              <div ref={scrollRef} className="p-4 space-y-3 max-h-64 overflow-y-auto">
                {transcriptLines.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col gap-1 ${msg.role === 'agent' ? 'items-end' : 'items-start'}`}>
                    <span className={`text-xs font-medium ${msg.role === 'agent' ? 'text-purple-600' : 'text-green-600'}`}>
                      {msg.role === 'agent' ? 'Agent' : 'Client'}
                    </span>
                    <div className={`max-w-xs px-3 py-2 rounded-xl text-sm leading-relaxed ${
                      msg.role === 'agent'
                        ? 'bg-purple-50 text-purple-900 border border-purple-100'
                        : 'bg-muted text-foreground border border-border'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MIDDLE — Contact + Form + Actions */}
          <div className="space-y-4">

            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-3 text-sm">Fiche Prospect</h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Nom', val: `${contact.prenom || ''} ${contact.nom || ''}`.trim() },
                  { label: 'Tel', val: contact.telephone || 'Non renseigne' },
                  { label: 'Email', val: contact.email || 'Non renseigne' },
                  { label: 'Adresse', val: contact.adresse || 'Non renseignee' },
                  { label: 'Source', val: contact.source || 'Non renseignee' },
                ].map(({ label, val }) => (
                  <div key={label} className="flex gap-2">
                    <span className="text-muted-foreground w-16 shrink-0">{label}</span>
                    <span className="font-medium text-foreground truncate">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-3 text-sm">Qualification</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Besoin identifie</label>
                  <select value={besoin} onChange={e => setBesoin(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm">
                    <option value="">Selectionner...</option>
                    <option value="PAC">PAC — Pompe a chaleur</option>
                    <option value="PV">PV — Panneaux solaires</option>
                    <option value="ISOLATION">Isolation thermique</option>
                    <option value="CCE">Chauffe-eau</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Budget estime</label>
                  <input type="text" value={budget} onChange={e => setBudget(e.target.value)}
                    placeholder="Ex: 15 000 EUR"
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Niveau d interet</label>
                  <div className="flex gap-1 flex-wrap">
                    {['Faible', 'Moyen', 'Eleve', 'Tres eleve'].map(n => (
                      <button key={n} onClick={() => setNiveauInteret(n)}
                        className={`px-2.5 py-1 rounded-lg text-xs ${niveauInteret === n ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                    placeholder="Notes..."
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg resize-none text-sm" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-3 text-sm">Action</h3>
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => handleQualification('converti')} disabled={submitting}
                  className="py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm disabled:opacity-50">
                  Converti
                </button>
                <button onClick={() => {
                  const date = prompt('Date de rappel (YYYY-MM-DD HH:MM):');
                  if (date) setDateRappel(date);
                  handleQualification('rappel');
                }} disabled={submitting}
                  className="py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium text-sm disabled:opacity-50">
                  Rappel
                </button>
                <button onClick={() => handleQualification('refuse')} disabled={submitting}
                  className="py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm disabled:opacity-50">
                  Refuse
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT — AI Panel */}
          <div className="space-y-4">

            {aiLoading && (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <div className="text-3xl mb-3 animate-spin inline-block">*</div>
                <p className="text-sm font-medium text-foreground">Analyse IA en cours...</p>
                <p className="text-xs text-muted-foreground mt-1">Diarisation · Sentiment · Refus · Qualification</p>
              </div>
            )}

            {!aiAnalysis && !aiLoading && (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <p className="text-4xl mb-3">🤖</p>
                <p className="text-sm font-semibold text-foreground mb-1">Analyse IA</p>
                <p className="text-xs text-muted-foreground">
                  Demarrez et terminez un appel pour obtenir l analyse automatique de la conversation.
                </p>
              </div>
            )}

            {aiAnalysis && !aiLoading && (
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground text-sm">Analyse IA</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sentimentStyle(aiAnalysis.sentiment)}`}>
                    {sentimentLabel(aiAnalysis.sentiment)}
                  </span>
                </div>

                <div className="flex justify-around mb-4">
                  <CircleScore value={aiAnalysis.score_percentage} label="Score global" color="#8B7EF5" />
                  <CircleScore value={aiAnalysis.agent_talk_ratio * 100} label="Parole agent" color="#2DCF7F" />
                  <CircleScore value={aiAnalysis.client_talk_ratio * 100} label="Parole client" color="#5D9BFF" />
                </div>

                <div className={`text-center py-2 rounded-lg text-xs font-semibold mb-4 ${
                  aiAnalysis.performance === 'Excellent' ? 'bg-green-50 text-green-700' :
                  aiAnalysis.performance === 'Bon' ? 'bg-blue-50 text-blue-700' :
                  aiAnalysis.performance === 'Moyen' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                }`}>
                  Performance : {aiAnalysis.performance}
                </div>

                <div className="flex border-b border-border mb-4">
                  {(['scores', 'analysis', 'refusal'] as const).map(tab => (
                    <button key={tab} onClick={() => setAiTab(tab)}
                      className={`flex-1 py-2 text-xs font-medium transition-colors ${
                        aiTab === tab ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
                      }`}>
                      {tab === 'scores' ? 'Scores' : tab === 'analysis' ? 'Analyse' : 'Refus'}
                    </button>
                  ))}
                </div>

                {aiTab === 'scores' && (
                  <div>
                    <ScoreBar label="Ecoute" value={aiAnalysis.score_ecoute} color="#8B7EF5" />
                    <ScoreBar label="Persuasion" value={aiAnalysis.score_persuasion} color="#5D9BFF" />
                    <ScoreBar label="Empathie" value={aiAnalysis.score_empathie} color="#2DCF7F" />
                    <ScoreBar label="Argumentation" value={aiAnalysis.score_argumentation} color="#F0B34B" />
                    <ScoreBar label="Gestion refus" value={aiAnalysis.score_refus} color="#FB923C" />
                    <ScoreBar label="Vente" value={aiAnalysis.score_vente} color="#F87171" />
                  </div>
                )}

                {aiTab === 'analysis' && (
                  <div className="space-y-3">
                    {aiAnalysis.summary && (
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Resume</div>
                        <p className="text-xs bg-muted/50 p-3 rounded-lg leading-relaxed">{aiAnalysis.summary}</p>
                      </div>
                    )}
                    {aiAnalysis.keywords.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Mots-cles</div>
                        <div className="flex flex-wrap gap-1">
                          {aiAnalysis.keywords.map(k => (
                            <span key={k} className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{k}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`p-2 rounded-lg border ${aiAnalysis.script_respected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        {aiAnalysis.script_respected ? 'Script OK' : 'Script non suivi'}
                      </div>
                      <div className={`p-2 rounded-lg border ${aiAnalysis.appointment_detected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-muted border-border text-muted-foreground'}`}>
                        {aiAnalysis.appointment_detected ? 'RDV detecte' : 'Pas de RDV'}
                      </div>
                      <div className={`p-2 rounded-lg border col-span-2 ${aiAnalysis.qualification_coherent ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                        {aiAnalysis.qualification_details || 'Qualification verifiee'}
                      </div>
                      {aiAnalysis.postal_code && (
                        <div className="p-2 rounded-lg border bg-blue-50 border-blue-200 text-blue-700 col-span-2">
                          {aiAnalysis.postal_code} — {aiAnalysis.postal_region}
                        </div>
                      )}
                    </div>
                    {aiAnalysis.next_steps && (
                      <div className="text-xs p-2 bg-blue-50 rounded-lg text-blue-800">
                        <span className="font-semibold">Prochaine etape : </span>{aiAnalysis.next_steps}
                      </div>
                    )}
                  </div>
                )}

                {aiTab === 'refusal' && (
                  <div className="space-y-3">
                    <div className={`p-3 rounded-lg border text-sm font-medium ${
                      aiAnalysis.refusal_detected ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
                    }`}>
                      {aiAnalysis.refusal_detected ? 'Refus detecte' : 'Aucun refus detecte'}
                    </div>
                    {aiAnalysis.refusal_detected && (
                      <>
                        {aiAnalysis.refusal_keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {aiAnalysis.refusal_keywords.map(k => (
                              <span key={k} className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">{k}</span>
                            ))}
                          </div>
                        )}
                        {aiAnalysis.suggested_response && (
                          <div className="text-xs p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                            <div className="font-semibold mb-1">Reponse suggere</div>
                            {aiAnalysis.suggested_response}
                          </div>
                        )}
                      </>
                    )}
                    {aiAnalysis.inactivity_detected && (
                      <div className="text-xs p-2 bg-orange-50 border border-orange-200 rounded-lg text-orange-700">
                        Inactivite detectee — appel trop court ou peu de parole
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}
