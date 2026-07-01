import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../../components/Layout';
import { agentService, Contact, CreateAppelDTO } from '../../../services/agentService';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';

export default function ContactPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactId, setContactId] = useState<string | null>(null);
  // Paramètres de retour (depuis agenda confirmatrice)
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [rdvId, setRdvId] = useState<string | null>(null);
  const [appelDone, setAppelDone] = useState(false);
  
  // État de l'appel
  const [enAppel, setEnAppel] = useState(false);
  const [duree, setDuree] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);  
  // Formulaire de qualification
  const [besoin, setBesoin] = useState('');
  const [budget, setBudget] = useState('');
  const [niveauInteret, setNiveauInteret] = useState('');
  const [notes, setNotes] = useState('');
  const [dateRappel, setDateRappel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Transcription simulée
  const [transcriptions] = useState([
    { role: 'agent', text: 'Bonjour, je suis Sarah de EBI Call Center. Puis-je parler à M. Dupont ?', sentiment: 'Positif' },
    { role: 'client', text: 'Oui, c\'est moi. De quoi s\'agit-il ?', sentiment: 'Neutre' },
    { role: 'agent', text: 'Je vous appelle concernant votre demande de devis pour nos services de téléphonie...', sentiment: 'Positif' },
    { role: 'client', text: 'Ah oui, je suis intéressé. Quels sont vos tarifs ?', sentiment: 'Positif' },
  ]);

  // Récupérer l'ID du contact + paramètres de retour depuis l'URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const rt = params.get('returnTo');
    const rid = params.get('rdvId');
    console.log('ID récupéré:', id);
    setContactId(id);
    setReturnTo(rt);
    setRdvId(rid);

    if (!id) {
      setLoading(false);
      return;
    }

    const fetchContact = async () => {
      try {
        const data = await agentService.getContactById(parseInt(id));
        setContact(data);
      } catch (err) {
        console.error('Erreur:', err);
        toast.error('Impossible de charger le contact');
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, []);

  // Timer
  useEffect(() => {
    if (enAppel) {
      intervalRef.current = setInterval(() => {
        setDuree(d => d + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enAppel]);

  const formatDuree = (secondes: number) => {
    const mins = Math.floor(secondes / 60);
    const secs = secondes % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = () => {
    setEnAppel(true);
    toast.info('Appel démarré');
  };

  const handleStopCall = () => {
    setEnAppel(false);
    toast.info('Appel terminé');
  };

  const handleQualification = async (action: 'converti' | 'rappel' | 'refuse') => {
    if (!contact) return;
    
    setSubmitting(true);
    
    let qualification = '';
    let dateRappelPlanifie = undefined;
    
    switch (action) {
      case 'converti':
        qualification = 'RENDEZ_VOUS';
        toast.success('✅ RDV enregistré avec succès !');
        break;
      case 'rappel':
        qualification = 'RAPPEL';
        dateRappelPlanifie = dateRappel || new Date().toISOString();
        toast.success('📅 Rappel planifié !');
        break;
      case 'refuse':
        qualification = 'REFUS_PAS_INTERESSE';
        toast.info('❌ Refus enregistré');
        break;
    }
    
    const appelData: CreateAppelDTO = {
      agentId: user?.id || 1,
      contactId: contact.id,
      dureeSecondes: duree,
      qualification: qualification,
      dateRappelPlanifie: dateRappelPlanifie,
    };
    
    try {
      await agentService.enregistrerAppel(appelData);
      setAppelDone(true);
      if (returnTo && rdvId) {
        // Depuis l'agenda confirmatrice : marquer l'appel et proposer le retour
        toast.success('✅ Appel enregistré — retournez à l\'agenda pour qualifier le RDV');
      } else {
        // Depuis l'agent : redirection classique
        setTimeout(() => {
          window.location.href = '/agent/contacts';
        }, 1500);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetourAgenda = () => {
    if (returnTo && rdvId) {
      navigate(`${returnTo}?calledRdvId=${rdvId}`);
    }
  };

  const handleRetour = () => {
    window.location.href = '/agent/contacts';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!contactId) {
    return (
      <Layout>
        <div className="text-center p-8">
          <p className="text-red-500 mb-4">Aucun contact sélectionné</p>
          <button onClick={handleRetour} className="px-4 py-2 bg-primary text-white rounded">
            Retour à la liste
          </button>
        </div>
      </Layout>
    );
  }

  if (!contact) {
    return (
      <Layout>
        <div className="text-center p-8">
          <p className="text-red-500 mb-4">Contact non trouvé</p>
          <button onClick={handleRetour} className="px-4 py-2 bg-primary text-white rounded">
            Retour à la liste
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Bannière de retour agenda confirmatrice */}
      {returnTo && rdvId && (
        <div className={`mb-4 flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium ${
          appelDone
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
        }`}>
          <span>
            {appelDone
              ? '✅ Appel enregistré — retournez à l\'agenda pour qualifier ce RDV'
              : '📋 Appel depuis l\'agenda confirmatrice — enregistrez l\'appel avant de qualifier le RDV'}
          </span>
          {appelDone && (
            <button
              onClick={handleRetourAgenda}
              className="ml-4 px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-xs"
            >
              Retourner à l'agenda →
            </button>
          )}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h2>Appel en direct</h2>
          <p className="text-muted-foreground mt-1">Gérez vos appels et qualifications en temps réel</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colonne gauche - Timer et Transcription */}
          <div className="space-y-6">
            {/* Timer */}
            <div className="bg-card rounded-lg border border-border p-6 text-center">
              <div className="text-5xl font-mono font-bold text-foreground mb-4">
                {formatDuree(duree)}
              </div>
              {!enAppel ? (
                <button
                  onClick={handleStartCall}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Démarrer l'appel
                </button>
              ) : (
                <button
                  onClick={handleStopCall}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Raccrocher
                </button>
              )}
            </div>
            
            {/* Transcription */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="mb-4">Transcription en temps réel</h3>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {transcriptions.map((msg, idx) => (
                  <div key={idx} className={`p-3 rounded-lg ${
                    msg.role === 'agent' ? 'bg-primary/10 ml-8' : 'bg-muted/30 mr-8'
                  }`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-foreground">
                        {msg.role === 'agent' ? 'Agent' : 'Client'}
                      </span>
                      <span className={`text-xs ${
                        msg.sentiment === 'Positif' ? 'text-green-600' :
                        msg.sentiment === 'Neutre' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {msg.sentiment}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Colonne droite - Infos Contact et Qualification */}
          <div className="space-y-6">
            {/* Informations Contact */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="mb-4">Informations Contact</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-muted-foreground text-sm">Société</span>
                  <p className="font-medium text-foreground">{contact.source}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Contact</span>
                  <p className="font-medium text-foreground">{contact.prenom} {contact.nom}</p>
                  <p className="text-sm text-muted-foreground">Directeur Commercial</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Email</span>
                  <p className="text-foreground">{contact.email || 'Non renseigné'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Adresse</span>
                  <p className="text-foreground">{contact.adresse || 'Non renseignée'}</p>
                </div>
              </div>
            </div>

            {/* Formulaire de qualification */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="mb-4">Formulaire de qualification</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Besoin identifié</label>
                  <select
                    value={besoin}
                    onChange={(e) => setBesoin(e.target.value)}
                    className="w-full px-3 py-2 bg-input-background border border-input rounded-lg"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Telephonie">Téléphonie d'entreprise</option>
                    <option value="Fibre">Fibre optique</option>
                    <option value="Cloud">Cloud / Hébergement</option>
                    <option value="Cybersecurite">Cybersécurité</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Budget estimé</label>
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="Ex: 5000€"
                    className="w-full px-3 py-2 bg-input-background border border-input rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Niveau d'intérêt</label>
                  <div className="flex gap-2">
                    {['Faible', 'Moyen', 'Élevé', 'Très élevé'].map((niveau) => (
                      <button
                        key={niveau}
                        type="button"
                        onClick={() => setNiveauInteret(niveau)}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                          niveauInteret === niveau
                            ? 'bg-primary text-white'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {niveau}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Ajouter des notes..."
                    className="w-full px-3 py-2 bg-input-background border border-input rounded-lg resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => handleQualification('converti')}
              disabled={submitting}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
            >
              Converti
            </button>
            <button
              onClick={() => {
                const date = prompt("Date de rappel (YYYY-MM-DD HH:MM):");
                if (date) setDateRappel(date);
                handleQualification('rappel');
              }}
              disabled={submitting}
              className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium disabled:opacity-50"
            >
              Rappel
            </button>
            <button
              onClick={() => handleQualification('refuse')}
              disabled={submitting}
              className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
            >
              Refusé
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
