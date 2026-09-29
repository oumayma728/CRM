import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2, XCircle, RefreshCw } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths, isSameMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { api } from '../../../services/crmApi';
import FicheContactPanel, { type RdvDetail } from '../../../components/crm/FicheContactPanel';

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const STATUT_CONFIG: Record<string, { label: string; color: string }> = {
  ANNULE:     { label: 'Annulé',   color: 'bg-destructive' },
  HORS_CIBLE: { label: 'HC',       color: 'bg-warning' },
  NON_SIGNE:  { label: 'Pas int.', color: 'bg-primary' },
  NRP:        { label: 'NRP',      color: 'bg-muted-foreground' },
  REPORTER:   { label: 'Reporté',  color: 'bg-warning' },
};

export default function AgendaRefus() {
  const location = useLocation();
  const [rdvs, setRdvs] = useState<RdvDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedRdv, setSelectedRdv] = useState<RdvDetail | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/confirmation1/agenda-refus');
      const data: RdvDetail[] = (res.data || []).map((r: any) => ({
        ...r,
        id: Number(r.id),
        contactId: Number(r.contactId),
      }));
      setRdvs(data);

      const params = new URLSearchParams(location.search);
      const calledRdvId = params.get('calledRdvId');
      if (calledRdvId) {
        const rdv = data.find(r => r.id === Number(calledRdvId));
        if (rdv) {
          setSelectedRdv(rdv);
          setSelectedDay(new Date(rdv.dateRendezVous));
          sessionStorage.setItem(`called_rdv_${rdv.id}`, 'true');
        }
      }
    } catch (err) {
      console.error('Erreur chargement agenda Refus:', err);
    } finally {
      setLoading(false);
    }
  }, [location.search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDayOfMonth = getDay(startOfMonth(currentMonth));
  const startPad = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const rdvsOnDay = (day: Date) => rdvs.filter(r => isSameDay(new Date(r.dateRendezVous), day));
  const rdvsFiltered = selectedDay
    ? rdvs.filter(r => isSameDay(new Date(r.dateRendezVous), selectedDay))
    : [];

  const stats = {
    total: rdvs.length,
    annule: rdvs.filter(r => r.statut === 'ANNULE').length,
    hc: rdvs.filter(r => r.statut === 'HORS_CIBLE').length,
    nrp: rdvs.filter(r => r.statut === 'NRP').length,
  };

  return (
    <div className="min-h-screen bg-muted p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <XCircle className="w-7 h-7 text-destructive" />
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Agenda Refus</h1>
            <p className="text-xs text-muted-foreground">RDV Annulés — relancer les contacts</p>
          </div>
        </div>
        <button onClick={fetchData} className="p-2 rounded-lg hover:bg-muted transition">
          <RefreshCw size={16} className="text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Refus', value: stats.total, color: 'bg-destructive/10 text-destructive' },
          { label: 'Annulés', value: stats.annule, color: 'bg-destructive/15 text-destructive' },
          { label: 'Hors Cible', value: stats.hc, color: 'bg-warning/10 text-warning' },
          { label: 'NRP', value: stats.nrp, color: 'bg-muted text-muted-foreground' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 ${s.color} text-center`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="flex gap-4 transition-all duration-300">
          <div className={`${selectedRdv ? 'w-3/5' : 'w-full'} transition-all duration-300`}>
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-muted transition">
                  <ChevronLeft size={18} />
                </button>
                <h2 className="font-semibold text-foreground capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                </h2>
                <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-muted transition">
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="p-3">
                <div className="grid grid-cols-7 mb-2">
                  {JOURS.map(j => (
                    <div key={j} className="text-center text-xs font-semibold text-muted-foreground py-1">{j}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
                  {daysInMonth.map(day => {
                    const dayRdvs = rdvsOnDay(day);
                    const isSelected = selectedDay && isSameDay(day, selectedDay);
                    const isToday = isSameDay(day, new Date());
                    const inMonth = isSameMonth(day, currentMonth);

                    return (
                      <button
                        key={day.toString()}
                        onClick={() => { setSelectedDay(isSelected ? null : day); setSelectedRdv(null); }}
                        className={`relative rounded-lg p-1 min-h-[52px] text-left transition-all ${!inMonth ? 'opacity-30' : ''} ${
                          isSelected ? 'bg-destructive text-destructive-foreground ring-2 ring-destructive/40 ring-offset-1'
                          : isToday ? 'bg-destructive/10'
                          : 'hover:bg-muted'
                        }`}
                      >
                        <span className={`text-xs font-medium ${isSelected ? 'text-white' : isToday ? 'text-destructive font-bold' : 'text-foreground'}`}>
                          {format(day, 'd')}
                        </span>
                        <div className="mt-0.5 space-y-0.5">
                          {dayRdvs.slice(0, 2).map(r => {
                            const cfg = STATUT_CONFIG[r.statut] || { color: 'bg-muted-foreground' };
                            return (
                              <div key={r.id} className={`${cfg.color} text-white text-[9px] rounded px-1 truncate leading-4`}>
                                {r.contactNom}
                              </div>
                            );
                          })}
                          {dayRdvs.length > 2 && <div className="text-[9px] text-muted-foreground">+{dayRdvs.length - 2}</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {selectedDay && (
              <div className="mt-3 bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="px-4 py-3 border-b">
                  <h3 className="font-semibold text-foreground text-sm">
                    {format(selectedDay, 'EEEE d MMMM', { locale: fr })}
                    <span className="ml-2 text-xs text-muted-foreground">({rdvsFiltered.length} RDV annulés)</span>
                  </h3>
                </div>

                {rdvsFiltered.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground text-sm">Aucun refus ce jour</p>
                ) : (
                  <div className="divide-y">
                    {rdvsFiltered.map(rdv => {
                      const cfg = STATUT_CONFIG[rdv.statut] || { color: 'bg-muted-foreground', label: rdv.statut };
                      const isActive = selectedRdv?.id === rdv.id;
                      return (
                        <button
                          key={rdv.id}
                          onClick={() => setSelectedRdv(isActive ? null : rdv)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                            isActive ? 'bg-destructive/10' : 'hover:bg-muted'
                          }`}
                        >
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.color}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">
                              {rdv.contactPrenom} {rdv.contactNom}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Agent: {rdv.agentNom}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full text-white ${cfg.color}`}>{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedRdv && (
            <div className="w-2/5 bg-card rounded-2xl shadow-sm border border-border overflow-y-auto sticky top-4 self-start max-h-[calc(100vh-8rem)]">
              <FicheContactPanel
                rdv={selectedRdv}
                agendaType="REFUS"
                updateEndpoint="/confirmation1/rdv"
                returnPath="/confirmation1/agenda-refus"
                onClose={() => setSelectedRdv(null)}
                onSaved={fetchData}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
