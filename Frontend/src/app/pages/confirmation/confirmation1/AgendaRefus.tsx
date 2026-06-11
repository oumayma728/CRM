import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, XCircle, RefreshCw, User, Phone, Mail, MapPin, Plus, Loader2, CheckCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths, isSameMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { api } from '../../../../services/api';

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

interface Refus {
  id: number;
  contactNom: string;
  contactPrenom: string;
  telephone: string;
  email: string;
  adresse: string;
  source: string;
  agentNom: string;
  dateRefus: string;
  motif: string;
  commentaire?: string;
  aRecontacter: boolean;
}

export default function AgendaRefus() {
  const [refus, setRefus] = useState<Refus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefus, setSelectedRefus] = useState<Refus | null>(null);
  const [aRecontacter, setARecontacter] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRefus();
  }, []);

  const fetchRefus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/confirmation1/agenda-refus');
      setRefus(response.data);
      setError(null);
    } catch (error) {
      console.error('Erreur fetchRefus:', error);
      setError('Erreur de chargement des refus');
    } finally {
      setLoading(false);
    }
  };

  const updateRefus = async () => {
    if (!selectedRefus) return;
    try {
      await api.put(`/confirmation1/refus/${selectedRefus.id}`, {
        aRecontacter,
        commentaire
      });
      setSelectedRefus(null);
      setARecontacter(false);
      setCommentaire('');
      fetchRefus();
    } catch (error) {
      console.error('Erreur updateRefus:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const getMotifColor = (motif: string) => {
    switch (motif) {
      case 'PAS_INTERESSE': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'PAS_DE_PROJET': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
      case 'HC_CONSOMMATION': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'HC_LOGEMENT': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'HC_AGE': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
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
    const dayRefus = refus.filter(r => isSameDay(new Date(r.dateRefus), day));
    if (filter !== 'all') {
      return dayRefus.filter(r => filter === 'a_recontacter' ? r.aRecontacter : !r.aRecontacter);
    }
    return dayRefus;
  };

  const totalRefus = refus.length;
  const toRecontact = refus.filter(r => r.aRecontacter).length;
  const classified = refus.filter(r => !r.aRecontacter).length;

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const formatTime = (dateStr: string) => format(new Date(dateStr), 'HH:mm');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
        <span className="ml-2">Chargement des refus...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center text-red-500">
          <p>{error}</p>
          <button onClick={fetchRefus} className="mt-4 px-4 py-2 bg-primary text-white rounded">Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agenda Refus</h1><p className="text-gray-500 dark:text-gray-400 mt-1">Gestion des rendez-vous refusés</p></div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-4 text-center"><div className="text-2xl font-bold text-red-600 dark:text-red-400">{totalRefus}</div><div className="text-sm text-red-600 dark:text-red-400">Total Refus</div></div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4 text-center"><div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{toRecontact}</div><div className="text-sm text-yellow-600 dark:text-yellow-400">À recontacter</div></div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4 text-center"><div className="text-2xl font-bold text-green-600 dark:text-green-400">{classified}</div><div className="text-sm text-green-600 dark:text-green-400">Classés</div></div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === 'all' ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>📋 Tous ({totalRefus})</button>
        <button onClick={() => setFilter('a_recontacter')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === 'a_recontacter' ? 'bg-yellow-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>🔄 À recontacter ({toRecontact})</button>
        <button onClick={() => setFilter('classe')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === 'classe' ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>✅ Classés ({classified})</button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" /><h2 className="text-lg font-semibold text-gray-900 dark:text-white">{format(currentMonth, 'MMMM yyyy', { locale: fr }).replace(/^\w/, c => c.toUpperCase())}</h2></div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Aujourd'hui</button>
            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">{JOURS.map(day => <div key={day} className="text-center py-3 text-sm font-medium text-gray-500 dark:text-gray-400">{day}</div>)}</div>
        <div className="grid grid-cols-7 auto-rows-fr">
          {calendarDays.map((day, index) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            const isToday = day ? isSameDay(day, new Date()) : false;
            const isSelected = day ? isSameDay(day, selectedDate) : false;
            const isCurrentMonth = day ? isSameMonth(day, currentMonth) : false;
            return (
              <div key={index} onClick={() => day && setSelectedDate(day)} className={`min-h-[100px] p-2 border-r border-b border-gray-200 dark:border-gray-700 transition-colors cursor-pointer ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900/50' : ''} ${isSelected ? 'bg-primary/5 dark:bg-primary/10 ring-1 ring-primary' : ''} hover:bg-gray-50 dark:hover:bg-gray-700/50`}>
                <div className="flex justify-between items-start"><span className={`text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full ${isToday ? 'bg-primary text-white' : 'text-gray-700 dark:text-gray-300'}`}>{day ? format(day, 'd') : ''}</span></div>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div key={event.id} onClick={() => setSelectedRefus(event)} className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition ${getMotifColor(event.motif)}`}>
                      <div className="flex items-center gap-1"><XCircle className="w-3 h-3" /><span className="truncate">{formatTime(event.dateRefus)}</span></div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && <div className="text-xs text-gray-500 dark:text-gray-400 text-center">+{dayEvents.length - 3}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-primary" />{format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr }).replace(/^\w/, c => c.toUpperCase())}</h3>
        {(() => {
          const dayEvents = getEventsForDay(selectedDate);
          if (dayEvents.length === 0) return <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucun refus ce jour</p>;
          return (
            <div className="space-y-3">
              {dayEvents.map(event => (
                <div key={event.id} onClick={() => setSelectedRefus(event)} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /><span className="font-medium">{formatTime(event.dateRefus)}</span></div><span className={`text-xs px-2 py-0.5 rounded-full ${getMotifColor(event.motif)}`}>{event.motif}</span></div>
                  <p className="font-medium text-gray-900 dark:text-white">{event.contactPrenom} {event.contactNom}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{event.source}</p>
                  {event.commentaire && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">📝 {event.commentaire}</p>}
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Modal traitement refus */}
      {selectedRefus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl my-8 mx-4">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-t-xl"><h3 className="text-xl font-semibold text-gray-900 dark:text-white">Traiter le refus</h3><p className="text-sm text-gray-500 dark:text-gray-400">Modifiez le statut du refus</p></div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3"><h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2"><User size={18} /> Informations</h4><div className="grid grid-cols-2 gap-3">
                <div><span className="text-xs text-gray-500 dark:text-gray-400">Contact</span><p className="font-medium">{selectedRefus.contactPrenom} {selectedRefus.contactNom}</p></div>
                <div><span className="text-xs text-gray-500 dark:text-gray-400">Téléphone</span><p className="font-medium">{selectedRefus.telephone}</p></div>
                <div><span className="text-xs text-gray-500 dark:text-gray-400">Source</span><p>{selectedRefus.source}</p></div>
                <div><span className="text-xs text-gray-500 dark:text-gray-400">Agent</span><p>{selectedRefus.agentNom}</p></div>
                <div><span className="text-xs text-gray-500 dark:text-gray-400">Date refus</span><p>{new Date(selectedRefus.dateRefus).toLocaleString()}</p></div>
                <div><span className="text-xs text-gray-500 dark:text-gray-400">Motif</span><p className={`text-xs px-2 py-0.5 rounded-full inline-block ${getMotifColor(selectedRefus.motif)}`}>{selectedRefus.motif}</p></div>
              </div></div>
              <div><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={aRecontacter} onChange={(e) => setARecontacter(e.target.checked)} className="w-4 h-4" /><span className="text-sm">À recontacter</span></label></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Commentaire</label><textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" rows={3} placeholder="Ajouter un commentaire..." /></div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl"><button onClick={() => setSelectedRefus(null)} className="px-4 py-2 border rounded-lg">Annuler</button><button onClick={updateRefus} className="px-4 py-2 bg-blue-500 text-white rounded-lg">Enregistrer</button></div>
          </div>
        </div>
      )}
    </div>
  );
}