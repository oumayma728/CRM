// frontend/src/app/pages/CreateContactPage.tsx
import React, { useEffect, useState } from 'react';
import { User, Home, Zap, Users, Phone, Mail, MapPin, Building, Loader2, Save, XCircle } from 'lucide-react';
import { api } from '../../services/api';

interface Agent {
  id: number;
  nom: string;
  prenom: string;
}

interface NewContact {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  source: string;
  agentId: number;
  // Logement
  proprietaireDepuis: number;
  modeChauffage: string;
  consommationChauffage: string;
  ageChaudiere: number;
  etatToiture: string;
  etatIsolation: string;
  surface: number;
  // Énergie
  etudePV: boolean;
  equipePV: boolean;
  equipePAC: boolean;
  // Foyer
  nbPersonnes: number;
  professionMr: string;
  professionMme: string;
  credits: string;
  revenus: string;
  fichage: string;
}

export default function CreateContactPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newContact, setNewContact] = useState<NewContact>({
    nom: '', prenom: '', telephone: '', email: '', adresse: '', source: 'Marketing', agentId: 1,
    proprietaireDepuis: 0, modeChauffage: '', consommationChauffage: '', ageChaudiere: 0,
    etatToiture: '', etatIsolation: '', surface: 0,
    etudePV: false, equipePV: false, equipePAC: false,
    nbPersonnes: 0, professionMr: '', professionMme: '', credits: '', revenus: '', fichage: ''
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await api.get('/agent');
      setAgents(response.data);
      if (response.data.length > 0) {
        setNewContact(prev => ({ ...prev, agentId: response.data[0].id }));
      }
    } catch (error) {
      console.error('Erreur fetchAgents:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.nom || !newContact.prenom || !newContact.telephone) {
      setError('Veuillez remplir les champs obligatoires (Nom, Prénom, Téléphone)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post('/contact', newContact);
      setSuccess(true);
      // Réinitialiser le formulaire
      setNewContact({
        nom: '', prenom: '', telephone: '', email: '', adresse: '', source: 'Marketing', agentId: agents[0]?.id || 1,
        proprietaireDepuis: 0, modeChauffage: '', consommationChauffage: '', ageChaudiere: 0,
        etatToiture: '', etatIsolation: '', surface: 0,
        etudePV: false, equipePV: false, equipePAC: false,
        nbPersonnes: 0, professionMr: '', professionMme: '', credits: '', revenus: '', fichage: ''
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur création contact:', error);
      setError('Erreur lors de la création du contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Créer une fiche contact</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Ajoutez un nouveau contact avec toutes ses informations</p>
      </div>

      {/* Message de succès */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-700 dark:text-green-400">
          ✅ Contact créé avec succès !
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          ❌ {error}
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Informations personnelles */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User size={20} className="text-primary" />
            Informations personnelles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newContact.nom}
                onChange={(e) => setNewContact({...newContact, nom: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                placeholder="Dupont"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newContact.prenom}
                onChange={(e) => setNewContact({...newContact, prenom: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Jean"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={newContact.telephone}
                onChange={(e) => setNewContact({...newContact, telephone: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="0612345678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="contact@email.com"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse</label>
              <input
                type="text"
                value={newContact.adresse}
                onChange={(e) => setNewContact({...newContact, adresse: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="15 rue de Paris, 75001 Paris"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source</label>
              <select
                value={newContact.source}
                onChange={(e) => setNewContact({...newContact, source: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option>Marketing</option><option>Web</option><option>Partenaire</option><option>Réseau</option><option>Téléphone</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agent</label>
              <select
                value={newContact.agentId}
                onChange={(e) => setNewContact({...newContact, agentId: parseInt(e.target.value)})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                {agents.map(a => <option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Logement */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Home size={20} className="text-primary" />
            Logement
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Propriétaire depuis</label>
              <input
                type="number"
                value={newContact.proprietaireDepuis}
                onChange={(e) => setNewContact({...newContact, proprietaireDepuis: parseInt(e.target.value)})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="années"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mode chauffage</label>
              <select
                value={newContact.modeChauffage}
                onChange={(e) => setNewContact({...newContact, modeChauffage: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="">Sélectionner</option>
                <option>Électrique</option><option>Gaz</option><option>Mazout</option><option>Bois</option><option>PAC</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Consommation chauffage</label>
              <input
                type="text"
                value={newContact.consommationChauffage}
                onChange={(e) => setNewContact({...newContact, consommationChauffage: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="kWh/an"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Âge chaudière</label>
              <input
                type="number"
                value={newContact.ageChaudiere}
                onChange={(e) => setNewContact({...newContact, ageChaudiere: parseInt(e.target.value)})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="années"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">État toiture</label>
              <select
                value={newContact.etatToiture}
                onChange={(e) => setNewContact({...newContact, etatToiture: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="">Sélectionner</option>
                <option>Bonne</option><option>Moyenne</option><option>Mauvaise</option><option>À refaire</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">État isolation</label>
              <select
                value={newContact.etatIsolation}
                onChange={(e) => setNewContact({...newContact, etatIsolation: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="">Sélectionner</option>
                <option>Bonne</option><option>Moyenne</option><option>Mauvaise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Surface (m²)</label>
              <input
                type="number"
                value={newContact.surface}
                onChange={(e) => setNewContact({...newContact, surface: parseInt(e.target.value)})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="Surface en m²"
              />
            </div>
          </div>
        </div>

        {/* Énergie */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap size={20} className="text-primary" />
            Énergie
          </h2>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newContact.etudePV}
                onChange={(e) => setNewContact({...newContact, etudePV: e.target.checked})}
                className="w-4 h-4 text-primary rounded border-gray-300"
              />
              <span className="text-gray-700 dark:text-gray-300">Étude PV</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newContact.equipePV}
                onChange={(e) => setNewContact({...newContact, equipePV: e.target.checked})}
                className="w-4 h-4 text-primary rounded border-gray-300"
              />
              <span className="text-gray-700 dark:text-gray-300">Équipé PV</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newContact.equipePAC}
                onChange={(e) => setNewContact({...newContact, equipePAC: e.target.checked})}
                className="w-4 h-4 text-primary rounded border-gray-300"
              />
              <span className="text-gray-700 dark:text-gray-300">Équipé PAC</span>
            </label>
          </div>
        </div>

        {/* Foyer */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Foyer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nbre de personnes</label>
              <input
                type="number"
                value={newContact.nbPersonnes}
                onChange={(e) => setNewContact({...newContact, nbPersonnes: parseInt(e.target.value)})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="Nombre de personnes"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profession Mr</label>
              <input
                type="text"
                value={newContact.professionMr}
                onChange={(e) => setNewContact({...newContact, professionMr: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="Profession"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profession Mme</label>
              <input
                type="text"
                value={newContact.professionMme}
                onChange={(e) => setNewContact({...newContact, professionMme: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="Profession"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Crédits</label>
              <input
                type="text"
                value={newContact.credits}
                onChange={(e) => setNewContact({...newContact, credits: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="Crédits"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Revenus</label>
              <input
                type="text"
                value={newContact.revenus}
                onChange={(e) => setNewContact({...newContact, revenus: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="Revenus"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fichage</label>
              <input
                type="text"
                value={newContact.fichage}
                onChange={(e) => setNewContact({...newContact, fichage: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="Fichage"
              />
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setNewContact({
                nom: '', prenom: '', telephone: '', email: '', adresse: '', source: 'Marketing', agentId: agents[0]?.id || 1,
                proprietaireDepuis: 0, modeChauffage: '', consommationChauffage: '', ageChaudiere: 0,
                etatToiture: '', etatIsolation: '', surface: 0,
                etudePV: false, equipePV: false, equipePAC: false,
                nbPersonnes: 0, professionMr: '', professionMme: '', credits: '', revenus: '', fichage: ''
              });
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <XCircle size={16} className="inline mr-2" />
            Réinitialiser
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {loading ? 'Création...' : 'Créer le contact'}
          </button>
        </div>
      </form>
    </div>
  );
}