// frontend/src/app/pages/CreateContactPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Home, Loader2, Save, RotateCcw, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { api } from '../services/crmApi';
import { useAuth } from '../contexts/AuthContext';
import {
  ClientHousingFields, ClientIdentityFields, emptyFiche, ficheToPayload, type ClientFiche,
} from '../components/crm/ClientInfo';

interface Agent {
  id: number;
  nom: string;
  prenom: string;
}

// Identity of the page; everything else (address, logement, energie, foyer) is the shared "fiche client"
interface NewContact {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  source: string;
  agentId: number;
}

const EMPTY_CONTACT = (agentId = 1): NewContact => ({
  nom: '', prenom: '', telephone: '', email: '', source: 'Marketing', agentId,
});

export default function CreateContactPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const navigate = useNavigate();
  const userRole = user?.role?.toLowerCase() || 'agent';
  const currentUserId = user?.id || 1;

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Par défaut : assigner à l'utilisateur connecté
  const [newContact, setNewContact] = useState<NewContact>(EMPTY_CONTACT(currentUserId));
  const [fiche, setFiche] = useState<ClientFiche>(emptyFiche());
  const patchFiche = (patch: Partial<ClientFiche>) => setFiche(f => ({ ...f, ...patch }));

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await api.get('/agent');
      setAgents(response.data);
      // Admin : premier agent par défaut. Agent : toujours lui-même.
      if (isAdmin && response.data.length > 0) {
        setNewContact(EMPTY_CONTACT(response.data[0].id));
      }
      // Pour un agent, on garde currentUserId (déjà initialisé)
    } catch (error) {
      console.error('Erreur fetchAgents:', error);
    }
  };

  // Helper — the identity of the page + the whole fiche client (strings converted to the types the API expects)
  const toPayload = () => ({
    ...ficheToPayload(fiche),
    nom:       newContact.nom,
    prenom:    newContact.prenom,
    telephone: newContact.telephone,
    email:     newContact.email || null,
    source:    newContact.source,
    agentId:   newContact.agentId,
  });

  const handleReset = () => {
    setError(null);
    // Reset : admin → premier agent, agent → lui-même
    setNewContact(EMPTY_CONTACT(isAdmin ? (agents[0]?.id || 1) : currentUserId));
    setFiche(emptyFiche());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.nom.trim() || !newContact.prenom.trim() || !newContact.telephone.trim()) {
      setError('Veuillez remplir les champs obligatoires (Nom, Prénom, Téléphone)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post('/contact', toPayload());
      setSuccess(true);
      setNewContact(EMPTY_CONTACT(agents[0]?.id || 1));
      setFiche(emptyFiche());
      // Redirection vers la liste contacts après 1.5s
      setTimeout(() => {
        const confType = user?.typeConfirmatrice?.toUpperCase();
        const dest =
          userRole === 'admin'        ? '/admin/contacts' :
          userRole === 'superadmin'   ? '/superadmin/contacts' :
          userRole === 'confirmatrice' && confType === 'CONF2'       ? '/confirmation2/contacts' :
          userRole === 'confirmatrice' && confType === 'CONFCLIENT'  ? '/confirmation-client/contacts' :
          userRole === 'confirmatrice' ? '/confirmation1/contacts' :
          '/agent/contacts';
        navigate(dest);
      }, 1500);
    } catch (err) {
      console.error('Erreur création contact:', err);
      setError('Erreur lors de la création du contact. Vérifiez les données saisies.');
    } finally {
      setLoading(false);
    }
  };

  // Nom affiché pour l'agent connecté
  const currentAgentLabel = (() => {
    const a = agents.find(ag => ag.id === currentUserId);
    return a ? `${a.prenom} ${a.nom}` : (user?.name || 'Vous');
  })();

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Créer une fiche contact</h1>
        <p className="text-muted-foreground mt-1">
          Saisissez les informations du prospect qualifié lors de l'appel
        </p>
      </div>

      {/* Message de succès */}
      {success && (
        <div className="flex items-center gap-3 bg-success/10 border border-success/30 rounded-xl p-4 text-success">
          <CheckCircle size={18} className="flex-shrink-0" />
          <span className="font-medium">Contact créé avec succès ! Le formulaire a été réinitialisé.</span>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
        {/* Informations personnelles */}
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <User size={20} className="text-primary" />
            Informations personnelles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Nom <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={newContact.nom}
                onChange={(e) => setNewContact({...newContact, nom: e.target.value})}
                className="glass-card w-full p-2 text-foreground focus:ring-2 focus:ring-primary"
                placeholder="Dupont"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Prénom <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={newContact.prenom}
                onChange={(e) => setNewContact({...newContact, prenom: e.target.value})}
                className="glass-card w-full p-2 text-foreground"
                placeholder="Jean"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Téléphone <span className="text-destructive">*</span>
              </label>
              <input
                type="tel"
                value={newContact.telephone}
                onChange={(e) => setNewContact({...newContact, telephone: e.target.value})}
                className="glass-card w-full p-2"
                placeholder="0612345678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                className="glass-card w-full p-2"
                placeholder="contact@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Source</label>
              <select
                value={newContact.source}
                onChange={(e) => setNewContact({...newContact, source: e.target.value})}
                className="glass-card w-full p-2"
              >
                <option>Marketing</option><option>Web</option><option>Partenaire</option><option>Réseau</option><option>Téléphone</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Agent assigné
              </label>
              {isAdmin ? (
                /* Admin : peut choisir n'importe quel agent */
                <select
                  value={newContact.agentId}
                  onChange={(e) => setNewContact({...newContact, agentId: parseInt(e.target.value)})}
                  className="glass-card w-full p-2"
                >
                  {agents.map(a => <option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>)}
                </select>
              ) : (
                /* Agent : pré-assigné à lui-même, non modifiable */
                <div className="w-full p-2 border border-border rounded-lg bg-muted text-foreground flex items-center gap-2">
                  <Lock size={13} className="text-muted-foreground flex-shrink-0" />
                  <span>{currentAgentLabel}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Assigné à vous</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Adresse, GSM et projet */}
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Home size={20} className="text-primary" />
            Adresse et projet
          </h2>
          <ClientIdentityFields value={fiche} onChange={patchFiche} />
        </div>

        {/* Logement, énergie, travaux, foyer */}
        <div className="p-6">
          <ClientHousingFields value={fiche} onChange={patchFiche} />
        </div>

        {/* Boutons */}
        <div className="px-6 py-4 border-t border-border bg-muted flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            <span className="text-destructive">*</span> Champs obligatoires
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 flex items-center gap-2 border border-border rounded-lg text-muted-foreground hover:bg-muted hover:border-border transition font-medium text-sm"
            >
              <RotateCcw size={15} />
              Réinitialiser
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition flex items-center gap-2 font-medium text-sm"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {loading ? 'Création en cours…' : 'Créer le contact'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}