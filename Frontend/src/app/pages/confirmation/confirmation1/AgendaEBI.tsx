import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle, XCircle, AlertCircle, Building, Phone, Mail, MapPin, User, Plus, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths, isSameMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { api } from '../../../../services/api';

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

interface Rdv {
  id: number;
  contactNom: string;
  contactPrenom: string;
  telephone: string;
  email: string;
  adresse: string;
  source: string;
  agentNom: string;
  dateRendezVous: string;
  statut: string;
  commentaire?: string;
}

interface NewContact {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  source: string;
  agentId: number;
  proprietaireDepuis: number;
  modeChauffage: string;
  consommationChauffage: string;
  ageChaudiere: number;
  etatToiture: string;
  etatIsolation: string;
  surface: number;
  etudePV: boolean;
  equipePV: boolean;
  equipePAC: boolean;
  nbPersonnes: number;
  professionMr: string;
  professionMme: string;
  credits: string;
  revenus: string;
  fichage: string;
}

export default function AgendaEBI() {
  const [rdvs, setRdvs] = useState<Rdv[]>([]);
  const [agents, setAgents] = useState<{ id: number; nom: string; prenom: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRdv, setSelectedRdv] = useState<Rdv | null>(null);
  const [showFicheModal, setShowFicheModal] = useState(false);
  const [selectedStatut, setSelectedStatut] = useState('');
  const [commentaireConfirmation, setCommentaireConfirmation] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newContact, setNewContact] = useState<NewContact>({
    nom: '', prenom: '', telephone: '', email: '', adresse: '', source: 'Marketing', agentId: 1,
    proprietaireDepuis: 0, modeChauffage: '', consommationChauffage: '', ageChaudiere: 0,
    etatToiture: '', etatIsolation: '', surface: 0,
    etudePV: false, equipePV: false, equipePAC: false,
    nbPersonnes: 0, professionMr: '', professionMme: '', credits: '', revenus: '', fichage: ''
  });

  useEffect(() => {
    fetchAgenda();
    fetchAgents();
  }, []);

  const fetchAgenda = async () => {
    try {
      setLoading(true);
      const response = await api.get('/confirmation1/agenda-ebi');
      setRdvs(response.data);
      setError(null);
    } catch (error) {
      console.error('Erreur fetchAgenda:', error);
      setError('Erreur de chargement des rendez-vous');
    } finally {
      setLoading(false);
    }
  };

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

  const updateStatut = async () => {
    if (!selectedRdv) return;
    if (!selectedStatut) {
      alert('Veuillez sélectionner un statut');
      return;
    }
    try {
      await api.put(`/confirmation1/rdv/${selectedRdv.id}/statut`, {
        statut: selectedStatut,
        commentaire: commentaireConfirmation
      });
      setSelectedRdv(null);
      setSelectedStatut('');
      setCommentaireConfirmation('');
      fetchAgenda();
    } catch (error) {
      console.error('Erreur updateStatut:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const createContact = async () => {
    if (!newContact.nom || !newContact.prenom || !newContact.telephone) {
      alert('Veuillez remplir les champs obligatoires (Nom, Prénom, Téléphone)');
      return;
    }
    setCreating(true);
    try {
      await api.post('/contact', newContact);
      setShowFicheModal(false);
      setNewContact({
        nom: '', prenom: '', telephone: '', email: '', adresse: '', source: 'Marketing', agentId: agents[0]?.id || 1,
        proprietaireDepuis: 0, modeChauffage: '', consommationChauffage: '', ageChaudiere: 0,
        etatToiture: '', etatIsolation: '', surface: 0,
        etudePV: false, equipePV: false, equipePAC: false,
        nbPersonnes: 0, professionMr: '', professionMme: '', credits: '', revenus: '', fichage: ''
      });
      alert('Contact créé avec succès !');
      fetchAgenda();
    } catch (error) {
      console.error('Erreur création contact:', error);
      alert('Erreur lors de la création du contact');
    } finally {
      setCreating(false);
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'CONFIRME': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'ANNULE': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'REPORTER': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      default: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'CONFIRME': return <CheckCircle className="w-3 h-3" />;
      case 'ANNULE': return <XCircle className="w-3 h-3" />;
      case 'REPORTER': return <AlertCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startOffset = (getDay(monthStart) + 6) % 7;
  const endOffset = (6 - ((getDay(monthEnd) + 6) % 7));
  const calendarDays = [...Array(startOffset).fill(null), ...daysInMonth, ...Array(endOffset).fill(null)];

  const getEventsForDay = (day: Date | null) => {
    if (!day) return [];
    const dayRdvs = rdvs.filter(rdv => isSameDay(new Date(rdv.dateRendezVous), day));
    if (filter !== 'all') {
      return dayRdvs.filter(rdv => rdv.statut === filter);
    }
    return dayRdvs;
  };

  const totalRdvs = rdvs.length;
  const confirmedRdvs = rdvs.filter(r => r.statut === 'CONFIRME').length;
  const cancelledRdvs = rdvs.filter(r => r.statut === 'ANNULE').length;
  const postponedRdvs = rdvs.filter(r => r.statut === 'REPORTER').length;

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const formatTime = (dateStr: string) => format(new Date(dateStr), 'HH:mm');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Chargement des rendez-vous...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center text-red-500">
          <p>{error}</p>
          <button onClick={fetchAgenda} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* En-tête */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agenda EBI</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestion des rendez-vous de l'équipe</p>
        </div>
        
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalRdvs}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total RDV</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{confirmedRdvs}</div>
          <div className="text-sm text-green-600 dark:text-green-400">Confirmés</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-4 text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{cancelledRdvs}</div>
          <div className="text-sm text-red-600 dark:text-red-400">Annulés</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{postponedRdvs}</div>
          <div className="text-sm text-yellow-600 dark:text-yellow-400">Reportés</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === 'all' ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>📋 Tous ({totalRdvs})</button>
        <button onClick={() => setFilter('CONFIRME')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === 'CONFIRME' ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>✅ Confirmés ({confirmedRdvs})</button>
        <button onClick={() => setFilter('ANNULE')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === 'ANNULE' ? 'bg-red-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>❌ Annulés ({cancelledRdvs})</button>
        <button onClick={() => setFilter('REPORTER')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === 'REPORTER' ? 'bg-yellow-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
          ⏰ Reportés ({postponedRdvs})
        </button>  
        {/*<button
          onClick={() => setShowFicheModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition shadow-sm"
        >
          <Plus size={18} />
          Créer une fiche contact
        </button>*/}     
      </div>

      {/* Calendrier */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {format(currentMonth, 'MMMM yyyy', { locale: fr }).replace(/^\w/, c => c.toUpperCase())}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Aujourd'hui</button>
            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {JOURS.map(day => <div key={day} className="text-center py-3 text-sm font-medium text-gray-500 dark:text-gray-400">{day}</div>)}
        </div>

        <div className="grid grid-cols-7 auto-rows-fr">
          {calendarDays.map((day, index) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            const isToday = day ? isSameDay(day, new Date()) : false;
            const isSelected = day ? isSameDay(day, selectedDate) : false;
            const isCurrentMonth = day ? isSameMonth(day, currentMonth) : false;
            return (
              <div key={index} onClick={() => day && setSelectedDate(day)} className={`min-h-[100px] p-2 border-r border-b border-gray-200 dark:border-gray-700 transition-colors cursor-pointer ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900/50' : ''} ${isSelected ? 'bg-primary/5 dark:bg-primary/10 ring-1 ring-primary' : ''} hover:bg-gray-50 dark:hover:bg-gray-700/50`}>
                <div className="flex justify-between items-start">
                  <span className={`text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full ${isToday ? 'bg-primary text-white' : 'text-gray-700 dark:text-gray-300'}`}>{day ? format(day, 'd') : ''}</span>
                </div>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div key={event.id} onClick={(e) => { e.stopPropagation(); setSelectedRdv(event); }} className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition ${getStatutColor(event.statut)}`}>
                      <div className="flex items-center gap-1">{getStatutIcon(event.statut)}<span className="truncate">{formatTime(event.dateRendezVous)}</span></div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && <div className="text-xs text-gray-500 dark:text-gray-400 text-center">+{dayEvents.length - 3}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Panneau latéral */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-primary" />
          {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr }).replace(/^\w/, c => c.toUpperCase())}
        </h3>
        {(() => {
          const dayEvents = getEventsForDay(selectedDate);
          if (dayEvents.length === 0) return <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucun rendez-vous ce jour</p>;
          return (
            <div className="space-y-3">
              {dayEvents.map(event => (
                <div key={event.id} onClick={() => setSelectedRdv(event)} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /><span className="font-medium">{formatTime(event.dateRendezVous)}</span></div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatutColor(event.statut)}`}>{event.statut}</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">{event.contactPrenom} {event.contactNom}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{event.source}</p>
                  {event.commentaire && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">📝 {event.commentaire}</p>}
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Modal qualification - à garder identique */}
      {/* ... (conserve le code de la modal qualification inchangé) ... */}

      {/* Modal création fiche contact - version complète */}
      {showFicheModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl my-8 mx-4">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-t-xl sticky top-0">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Créer une fiche contact</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ajoutez un nouveau contact</p>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Informations personnelles */}
              <div className="border-b pb-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">👤 Informations personnelles</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Nom *</label><input type="text" value={newContact.nom} onChange={(e) => setNewContact({...newContact, nom: e.target.value})} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700" /></div>
                  <div><label className="block text-sm font-medium mb-1">Prénom *</label><input type="text" value={newContact.prenom} onChange={(e) => setNewContact({...newContact, prenom: e.target.value})} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700" /></div>
                  <div><label className="block text-sm font-medium mb-1">Téléphone *</label><input type="tel" value={newContact.telephone} onChange={(e) => setNewContact({...newContact, telephone: e.target.value})} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700" /></div>
                  <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={newContact.email} onChange={(e) => setNewContact({...newContact, email: e.target.value})} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700" /></div>
                  <div className="col-span-2"><label className="block text-sm font-medium mb-1">Adresse</label><input type="text" value={newContact.adresse} onChange={(e) => setNewContact({...newContact, adresse: e.target.value})} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700" /></div>
                  <div><label className="block text-sm font-medium mb-1">Source</label><select value={newContact.source} onChange={(e) => setNewContact({...newContact, source: e.target.value})} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"><option>Marketing</option><option>Web</option><option>Partenaire</option></select></div>
                  <div><label className="block text-sm font-medium mb-1">Agent</label><select value={newContact.agentId} onChange={(e) => setNewContact({...newContact, agentId: parseInt(e.target.value)})} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700">{agents.map(a => <option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>)}</select></div>
                </div>
              </div>

              {/* Logement */}
              <div className="border-b pb-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">🏠 Logement</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Propriétaire depuis</label><input type="number" value={newContact.proprietaireDepuis} onChange={(e) => setNewContact({...newContact, proprietaireDepuis: parseInt(e.target.value)})} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700" /></div>
                  <div><label className="block text-sm font-medium mb-1">Mode chauffage</label><select value={newContact.modeChauffage} onChange={(e) => setNewContact({...newContact, modeChauffage: e.target.value})} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"><option>Électrique</option><option>Gaz</option><option>Mazout</option><option>Bois</option><option>PAC</option></select></div>
                  <div><label className="block text-sm font-medium mb-1">Consommation chauffage</label><input type="text" value={newContact.consommationChauffage} onChange={(e) => setNewContact({...newContact, consommationChauffage: e.target.value})} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700" /></div>
                  <div><label className="block text-sm font-medium mb-1">Âge chaudière</label><input type="number" value={newContact.ageChaudiere} onChange={(e) => setNewContact({...newContact, ageChaudiere: parseInt(e.target.value)})} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700" /></div>
                  <div><label className="block text-sm font-medium mb-1">État toiture</label><select value={newContact.etatToiture} onChange={(e) => setNewContact({...newContact, etatToiture: e.target.value})} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"><option>Bonne</option><option>Moyenne</option><option>Mauvaise</option></select></div>
                  <div><label className="block text-sm font-medium mb-1">État isolation</label><select value={newContact.etatIsolation} onChange={(e) => setNewContact({...newContact, etatIsolation: e.target.value})} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"><option>Bonne</option><option>Moyenne</option><option>Mauvaise</option></select></div>
                  <div><label className="block text-sm font-medium mb-1">Surface (m²)</label><input type="number" value={newContact.surface} onChange={(e) => setNewContact({...newContact, surface: parseInt(e.target.value)})} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700" /></div>
                </div>
              </div>

              {/* Énergie */}
              <div className="border-b pb-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">⚡ Énergie</h4>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={newContact.etudePV} onChange={(e) => setNewContact({...newContact, etudePV: e.target.checked})} className="w-4 h-4" /><span>Étude PV</span></label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={newContact.equipePV} onChange={(e) => setNewContact({...newContact, equipePV: e.target.checked})} className="w-4 h-4" /><span>Équipé PV</span></label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={newContact.equipePAC} onChange={(e) => setNewContact({...newContact, equipePAC: e.target.checked})} className="w-4 h-4" /><span>Équipé PAC</span></label>
                </div>
              </div>

              {/* Foyer */}
              <div className="pb-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">👨‍👩‍👧‍👦 Foyer</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Nbre de personnes</label><input type="number" value={newContact.nbPersonnes} onChange={(e) => setNewContact({...newContact, nbPersonnes: parseInt(e.target.value)})} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700" /></div>
                  <div><label className="block text-sm font-medium mb-1">Profession Mr</label><input type="text" value={newContact.professionMr} onChange={(e) => setNewContact({...newContact, professionMr: e.target.value})} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700" /></div>
                  <div><label className="block text-sm font-medium mb-1">Profession Mme</label><input type="text" value={newContact.professionMme} onChange={(e) => setNewContact({...newContact, professionMme: e.target.value})} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700" /></div>
                  <div><label className="block text-sm font-medium mb-1">Crédits</label><input type="text" value={newContact.credits} onChange={(e) => setNewContact({...newContact, credits: e.target.value})} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700" /></div>
                  <div><label className="block text-sm font-medium mb-1">Revenus</label><input type="text" value={newContact.revenus} onChange={(e) => setNewContact({...newContact, revenus: e.target.value})} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700" /></div>
                  <div><label className="block text-sm font-medium mb-1">Fichage</label><input type="text" value={newContact.fichage} onChange={(e) => setNewContact({...newContact, fichage: e.target.value})} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700" /></div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
              <button onClick={() => setShowFicheModal(false)} className="px-4 py-2 border rounded-lg">Annuler</button>
              <button onClick={createContact} disabled={creating} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">
                {creating ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}