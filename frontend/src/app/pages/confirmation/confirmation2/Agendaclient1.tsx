import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Loader2, UserCheck, CheckCircle, XCircle,
  AlertCircle, Clock, RefreshCw
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths, isSameMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { api } from '../../../services/crmApi';
import FicheContactPanel, { type RdvDetail } from '../../../components/crm/FicheContactPanel';

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const STATUT_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  CONFIRME:   { label: 'Confirmé',  color: 'bg-success',  icon: <CheckCircle size={10} /> },
  ANNULE:     { label: 'Annulé',    color: 'bg-destructive',    icon: <XCircle size={10} /> },
  REPORTER:   { label: 'Reporté',   color: 'bg-warning', icon: <Clock size={10} /> },
  BRUT:       { label: 'Brut',      color: 'bg-primary',   icon: <AlertCircle size={10} /> },
  NRP:        { label: 'NRP',       color: 'bg-muted-foreground',   icon: <AlertCircle size={10} /> },
  HORS_CIBLE: { label: 'HC',        color: 'bg-warning', icon: <XCircle size={10} /> },
  NON_SIGNE:  { label: 'Pas int.',  color: 'bg-primary', icon: <XCircle size={10} /> },
  PORTE:      { label: 'Porté',     color: 'bg-info',   icon: <Clock size={10} /> },
};

export default function AgendaClient1_2() {
  const location = useLocation();
  const [rdvs, setRdvs] = useState<RdvDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedRdv, setSelectedRdv] = useState<RdvDetail | null>(null);
  const [filterStatut, setFilterStatut] = useState<string>('TOUS');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/confirmation2/agenda-client1');
      const data: RdvDetail[] = (res.data || []).map((r: any) => ({
        ...r,
        id: Number(r.id),
        contactId: Number(r.contactId ?? 0),
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
      console.error('Erreur agenda client1 conf2:', err);
    } finally {
      setLoading(false);
    }
  }, [location.search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startPad = (() => { const d = getDay(startOfMonth(currentMonth)); return d === 0 ? 6 : d - 1; })();
  const rdvsOnDay = (day: Date) => rdvs.filter(r => isSameDay(new Date(r.dateRendezVous), day));
  const rdvsFiltered = selectedDay
    ? rdvs.filter(r => isSameDay(new Date(r.dateRendezVous), selectedDay) && (filterStatut === 'TOUS' || r.statut === filterStatut))
    : [];
  const stats = {
    total: rdvs.length,
    confirme: rdvs.filter(r => r.statut === 'CONFIRME').length,
    annule: rdvs.filter(r => r.statut === 'ANNULE').length,
    reporter: rdvs.filter(r => r.statut === 'REPORTER').length,
  };

  return (
    <div className="min-h-screen bg-muted p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <UserCheck className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Agenda Client 1</h1>
            <p className="text-xs text-muted-foreground">RDV Client Niveau 1</p>
          </div>
        </div>
        <button onClick={fetchData} className="p-2 rounded-lg hover:bg-muted transition">
          <RefreshCw size={16} className="text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total',     value: stats.total,    color: 'bg-primary/10 text-primary' },
          { label: 'Confirmés', value: stats.confirme, color: 'bg-success/10 text-success' },
          { label: 'Annulés',   value: stats.annule,   color: 'bg-destructive/10 text-destructive' },
          { label: 'Reportés',  value: stats.reporter, color: 'bg-warning/10 text-warning' },
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
        <div className="flex gap-4">
          <div className={`${selectedRdv ? 'w-3/5' : 'w-full'} transition-all duration-300`}>
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-muted"><ChevronLeft size={18} /></button>
                <h2 className="font-semibold text-foreground capitalize">{format(currentMonth, 'MMMM yyyy', { locale: fr })}</h2>
                <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-muted"><ChevronRight size={18} /></button>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-7 mb-2">
                  {JOURS.map(j => <div key={j} className="text-center text-xs font-semibold text-muted-foreground py-1">{j}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
                  {daysInMonth.map(day => {
                    const dayRdvs = rdvsOnDay(day);
                    const isSelected = selectedDay && isSameDay(day, selectedDay);
                    const isToday = isSameDay(day, new Date());
                    const inMonth = isSameMonth(day, currentMonth);
                    return (
                      <button key={day.toString()} onClick={() => { setSelectedDay(isSelected ? null : day); setSelectedRdv(null); }}
                        className={`relative rounded-lg p-1 min-h-[52px] text-left transition-all ${!inMonth ? 'opacity-30' : ''} ${isSelected ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1' : isToday ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-muted'}`}>
                        <span className={`text-xs font-medium ${isSelected ? 'text-white' : isToday ? 'text-primary font-bold' : 'text-foreground'}`}>{format(day, 'd')}</span>
                        <div className="mt-0.5 space-y-0.5">
                          {dayRdvs.slice(0, 2).map(r => {
                            const cfg = STATUT_CONFIG[r.statut] || { color: 'bg-muted-foreground', label: r.statut };
                            return <div key={r.id} className={`${cfg.color} text-white text-[9px] rounded px-1 truncate leading-4`}>{r.contactNom}</div>;
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
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <h3 className="font-semibold text-foreground text-sm">
                    {format(selectedDay, 'EEEE d MMMM', { locale: fr })}
                    <span className="ml-2 text-xs text-muted-foreground">({rdvsFiltered.length} RDV)</span>
                  </h3>
                  <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="glass-input text-xs px-2 py-1 rounded-lg">
                    <option value="TOUS">Tous les statuts</option>
                    {Object.entries(STATUT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                {rdvsFiltered.length === 0 ? <p className="text-center py-6 text-muted-foreground text-sm">Aucun RDV ce jour</p> : (
                  <div className="divide-y">
                    {rdvsFiltered.map(rdv => {
                      const cfg = STATUT_CONFIG[rdv.statut] || { color: 'bg-muted-foreground', label: rdv.statut };
                      const isActive = selectedRdv?.id === rdv.id;
                      return (
                        <button key={rdv.id} onClick={() => setSelectedRdv(isActive ? null : rdv)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isActive ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-muted'}`}>
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.color}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{rdv.contactPrenom} {rdv.contactNom}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(rdv.dateRendezVous), 'HH:mm')} — {rdv.agentNom}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full text-white ${cfg.color}`}>{cfg.label}</span>
                          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
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
                agendaType="CLIENT1"
                updateEndpoint="/confirmation2/rdv"
                returnPath="/confirmation2/agenda-client1"
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
