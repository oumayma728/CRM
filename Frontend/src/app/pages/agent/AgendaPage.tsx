import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { agentService } from '../../../services/agentService';
import { useAuth } from '../../../contexts/AuthContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths, isSameMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AgendaEvent {
  id: number;
  dateHeure: string;
  contact: string;
  societe: string;
  statut: string;
  commentaire: string | null;
  type: 'RDV' | 'REFUS';
}

interface AgendaData {
  totalRdv: number;
  rdvConfirmes: number;
  totalRefus: number;
  aRecontacter: number;
  rendezVous: AgendaEvent[];
  refus: AgendaEvent[];
}

const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function AgendaPage() {
  const { user } = useAuth();
  const [agenda, setAgenda] = useState<AgendaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'rdv' | 'refus'>('rdv');

  useEffect(() => {
    const fetchAgenda = async () => {
      try {
        setLoading(true);
        const data = await agentService.getAgenda(user?.id || 1);
        console.log('Agenda chargé:', data);
        setAgenda(data);
      } catch (error) {
        console.error('Erreur chargement agenda:', error);
        // Données mockées pour le développement
        setAgenda({
          totalRdv: 7,
          rdvConfirmes: 7,
          totalRefus: 5,
          aRecontacter: 2,
          rendezVous: [
            { id: 1, dateHeure: '2026-04-02T09:00:00', contact: 'Jean Dupont', societe: 'Société ABC', statut: 'CONFIRME', commentaire: null, type: 'RDV' },
            { id: 2, dateHeure: '2026-04-02T14:30:00', contact: 'Marie Martin', societe: 'Entreprise XYZ', statut: 'CONFIRME', commentaire: null, type: 'RDV' },
            { id: 3, dateHeure: '2026-04-03T10:00:00', contact: 'Pierre Leroy', societe: 'Solutions Pro', statut: 'CONFIRME', commentaire: null, type: 'RDV' },
            { id: 4, dateHeure: '2026-04-10T11:00:00', contact: 'Sophie Bernard', societe: 'Tech Innovate', statut: 'CONFIRME', commentaire: null, type: 'RDV' },
            { id: 5, dateHeure: '2026-04-10T14:00:00', contact: 'Luc Moreau', societe: 'Digital Services', statut: 'CONFIRME', commentaire: null, type: 'RDV' },
          ],
          refus: [
            { id: 1, dateHeure: '2026-04-02T10:30:00', contact: 'Claude Noir', societe: 'Corp Refus', statut: 'Pas intéressé', commentaire: 'Budget insuffisant', type: 'REFUS' },
            { id: 2, dateHeure: '2026-04-03T11:30:00', contact: 'Anne Blanc', societe: 'PME Refus', statut: 'Pas intéressé', commentaire: null, type: 'REFUS' },
            { id: 3, dateHeure: '2026-04-10T15:00:00', contact: 'Marc Durand', societe: 'Digital Pro', statut: 'Déjà équipé', commentaire: null, type: 'REFUS' },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchAgenda();
    }
  }, [user]);

  const events = activeTab === 'rdv' ? agenda?.rendezVous || [] : agenda?.refus || [];

  // Construire les jours du calendrier
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startOffset = getDay(monthStart);

  // Événements du jour sélectionné
  const eventsOfSelectedDay = events.filter(event =>
    isSameDay(new Date(event.dateHeure), selectedDate)
  );

  // Événements par jour pour affichage dans le calendrier
  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(new Date(event.dateHeure), day));
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), 'HH:mm');
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'd MMMM yyyy', { locale: fr });
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">Mes Agendas</h2>
          <p className="text-muted-foreground mt-1">Gérez vos rendez-vous pris et vos refus</p>
        </div>

        {/* Onglets */}
        <div className="flex gap-4 border-b border-border">
          <button
            onClick={() => setActiveTab('rdv')}
            className={`pb-2 px-4 font-medium transition-colors ${
              activeTab === 'rdv'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            RDV Pris ({agenda?.totalRdv || 0})
          </button>
          <button
            onClick={() => setActiveTab('refus')}
            className={`pb-2 px-4 font-medium transition-colors ${
              activeTab === 'refus'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Refus ({agenda?.totalRefus || 0})
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendrier */}
          <div className="lg:col-span-2 bg-card rounded-lg border border-border p-4">
            {/* En-tête du calendrier */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold">
                {format(currentMonth, 'MMMM yyyy', { locale: fr }).replace(/^\w/, c => c.toUpperCase())}
              </h3>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {JOURS.map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendrier */}
            <div className="grid grid-cols-7 gap-1">
              {/* Cases vides avant le 1er jour */}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px] bg-muted/20 rounded-lg" />
              ))}

              {/* Jours du mois */}
              {days.map(day => {
                const dayEvents = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[80px] p-1 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                    } ${!isCurrentMonth ? 'opacity-50' : ''} hover:bg-muted/50`}
                  >
                    <div className={`text-right text-sm p-1 ${
                      isToday ? 'bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center ml-auto' : ''
                    }`}>
                      {format(day, 'd')}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs p-0.5 rounded truncate ${
                            activeTab === 'rdv'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {formatTime(event.dateHeure)}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{dayEvents.length - 2}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panneau latéral */}
          <div className="space-y-4">
            {/* Détail du jour */}
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">
                  {format(selectedDate, 'd MMMM yyyy', { locale: fr }).replace(/^\w/, c => c.toUpperCase())}
                </h3>
              </div>

              {eventsOfSelectedDay.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Aucun {activeTab === 'rdv' ? 'RDV' : 'refus'} ce jour</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {eventsOfSelectedDay.map(event => (
                    <div key={event.id} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{formatTime(event.dateHeure)}</span>
                        </div>
                        {activeTab === 'rdv' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <p className="font-medium">{event.societe}</p>
                      <p className="text-sm text-muted-foreground">{event.contact}</p>
                      {event.commentaire && (
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="font-medium">Note:</span> {event.commentaire}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Statistiques */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="font-semibold mb-3">
                {activeTab === 'rdv' ? 'Statistiques RDV' : 'Statistiques Refus'}
              </h3>
              <div className="space-y-2">
                {activeTab === 'rdv' ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total RDV</span>
                      <span className="font-semibold">{agenda?.totalRdv || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Confirmés</span>
                      <span className="font-semibold text-green-600">{agenda?.rdvConfirmes || 0}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Refus</span>
                      <span className="font-semibold text-red-600">{agenda?.totalRefus || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">À recontacter</span>
                      <span className="font-semibold text-yellow-600">{agenda?.aRecontacter || 0}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}