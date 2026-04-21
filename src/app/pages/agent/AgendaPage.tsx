import React, { useState } from 'react';
import { Layout } from '../../components/Layout';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Phone, CheckCircle, XCircle, Clock } from 'lucide-react';

const appointments = [
  { id: 1, date: '2026-04-01', time: '09:00', company: 'Société ABC', contact: 'Jean Dupont', status: 'confirmé', type: 'rdv' },
  { id: 2, date: '2026-04-01', time: '14:30', company: 'Tech Innovate', contact: 'Sophie Bernard', status: 'confirmé', type: 'rdv' },
  { id: 3, date: '2026-04-02', time: '10:00', company: 'Startup Alpha', contact: 'Emma Dubois', status: 'confirmé', type: 'rdv' },
  { id: 4, date: '2026-04-02', time: '15:00', company: 'Digital Pro', contact: 'Marc Durand', status: 'confirmé', type: 'rdv' },
  { id: 5, date: '2026-04-03', time: '11:00', company: 'Industries Beta', contact: 'Thomas Petit', status: 'confirmé', type: 'rdv' },
  { id: 6, date: '2026-04-03', time: '16:00', company: 'Solutions Gamma', contact: 'Julie Roux', status: 'confirmé', type: 'rdv' },
  { id: 7, date: '2026-04-04', time: '09:30', company: 'Commerce Delta', contact: 'Paul Martin', status: 'confirmé', type: 'rdv' }
];

const refusals = [
  { id: 1, date: '2026-04-01', time: '10:30', company: 'Société Refus 1', contact: 'Marie Dubois', reason: 'Pas intéressé', notes: 'Budget insuffisant' },
  { id: 2, date: '2026-04-01', time: '16:00', company: 'Entreprise Refus 2', contact: 'Luc Martin', reason: 'Déjà équipé', notes: 'Contrat en cours' },
  { id: 3, date: '2026-04-02', time: '11:30', company: 'Tech Refus', contact: 'Sophie Leroy', reason: 'Pas le bon moment', notes: 'À recontacter dans 6 mois' },
  { id: 4, date: '2026-04-03', time: '14:00', company: 'Services Refus', contact: 'Pierre Bernard', reason: 'Prix trop élevé', notes: 'Attend une promo' },
  { id: 5, date: '2026-04-04', time: '10:00', company: 'Digital Refus', contact: 'Emma Roux', reason: 'Pas de budget', notes: 'Reprise contact Q3' }
];

export default function AgendaPage() {
  const [currentDateRdv, setCurrentDateRdv] = useState(new Date(2026, 3, 1));
  const [selectedDateRdv, setSelectedDateRdv] = useState(new Date(2026, 3, 1));
  const [currentDateRefus, setCurrentDateRefus] = useState(new Date(2026, 3, 1));
  const [selectedDateRefus, setSelectedDateRefus] = useState(new Date(2026, 3, 1));
  const [activeTab, setActiveTab] = useState<'rdv' | 'refus'>('rdv');

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === dateStr);
  };

  const getRefusalsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return refusals.filter(ref => ref.date === dateStr);
  };

  const renderCalendar = (currentDate: Date, selectedDate: Date, setSelectedDate: (date: Date) => void, dataType: 'rdv' | 'refus') => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-muted/30"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = dataType === 'rdv' ? getAppointmentsForDate(date) : getRefusalsForDate(date);
      const isSelected = selectedDate.toISOString().split('T')[0] === dateStr;
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`h-24 p-2 border border-border hover:bg-muted/50 transition-colors ${
            isSelected ? 'bg-primary/10 border-primary' : ''
          } ${isToday ? 'ring-2 ring-accent' : ''}`}
        >
          <div className="flex flex-col h-full">
            <span className={`font-medium ${isToday ? 'text-accent' : 'text-foreground'}`}>{day}</span>
            {dayData.length > 0 && (
              <div className="flex-1 mt-1 space-y-1">
                {dayData.slice(0, 2).map(item => (
                  <div
                    key={item.id}
                    className={`text-xs px-1 py-0.5 rounded truncate ${
                      dataType === 'rdv' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                    }`}
                  >
                    {item.time}
                  </div>
                ))}
                {dayData.length > 2 && (
                  <div className="text-xs text-muted-foreground">+{dayData.length - 2}</div>
                )}
              </div>
            )}
          </div>
        </button>
      );
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="capitalize">{monthName}</h3>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (dataType === 'rdv') {
                  setCurrentDateRdv(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
                } else {
                  setCurrentDateRefus(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
                }
              }}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={() => {
                if (dataType === 'rdv') {
                  setCurrentDateRdv(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
                } else {
                  setCurrentDateRefus(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
                }
              }}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-border">
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
            <div key={day} className="bg-muted/50 p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2>Mes Agendas</h2>
          <p className="text-muted-foreground mt-1">Gérez vos rendez-vous pris et vos refus</p>
        </div>

        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('rdv')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'rdv'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            RDV Pris ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('refus')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'refus'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Refus ({refusals.length})
          </button>
        </div>

        {activeTab === 'rdv' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card rounded-lg border border-border p-6">
              {renderCalendar(currentDateRdv, selectedDateRdv, setSelectedDateRdv, 'rdv')}
            </div>

            <div className="space-y-4">
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  <h3>{selectedDateRdv.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</h3>
                </div>

                {getAppointmentsForDate(selectedDateRdv).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Aucun RDV ce jour</p>
                ) : (
                  <div className="space-y-3">
                    {getAppointmentsForDate(selectedDateRdv).map(apt => (
                      <div key={apt.id} className="p-4 rounded-lg border bg-success/5 border-success/20">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-primary" />
                            <span className="font-medium text-foreground">{apt.time}</span>
                          </div>
                          <CheckCircle className="w-4 h-4 text-success" />
                        </div>
                        <p className="font-medium text-foreground">{apt.company}</p>
                        <p className="text-sm text-muted-foreground">{apt.contact}</p>
                        <div className="mt-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">
                            Confirmé
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="mb-4">Statistiques RDV</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total RDV</span>
                    <span className="font-medium text-foreground">{appointments.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Confirmés</span>
                    <span className="font-medium text-success">
                      {appointments.filter(a => a.status === 'confirmé').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card rounded-lg border border-border p-6">
              {renderCalendar(currentDateRefus, selectedDateRefus, setSelectedDateRefus, 'refus')}
            </div>

            <div className="space-y-4">
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="w-5 h-5 text-destructive" />
                  <h3>{selectedDateRefus.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</h3>
                </div>

                {getRefusalsForDate(selectedDateRefus).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Aucun refus ce jour</p>
                ) : (
                  <div className="space-y-3">
                    {getRefusalsForDate(selectedDateRefus).map(ref => (
                      <div key={ref.id} className="p-4 rounded-lg border bg-destructive/5 border-destructive/20">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-destructive" />
                            <span className="font-medium text-foreground">{ref.time}</span>
                          </div>
                          <XCircle className="w-4 h-4 text-destructive" />
                        </div>
                        <p className="font-medium text-foreground">{ref.company}</p>
                        <p className="text-sm text-muted-foreground">{ref.contact}</p>
                        <div className="mt-2 space-y-1">
                          <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                            {ref.reason}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">{ref.notes}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="mb-4">Statistiques Refus</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Refus</span>
                    <span className="font-medium text-foreground">{refusals.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">À recontacter</span>
                    <span className="font-medium text-warning">
                      {refusals.filter(r => r.notes.includes('recontacter') || r.notes.includes('Reprise')).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
