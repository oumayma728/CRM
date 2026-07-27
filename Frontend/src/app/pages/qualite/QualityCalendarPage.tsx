import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, RefreshCw, Users, Search } from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const STATUS_MAP: Record<string, string> = {
  BRUT: 'pending', CONFIRME: 'confirmed', ANNULE: 'cancelled',
  REPORTER: 'rescheduled', NRP: 'nrp', HORS_CIBLE: 'hc',
};
const STATUS_DOT: Record<string, string> = {
  pending: 'bg-orange-500', confirmed: 'bg-emerald-500', cancelled: 'bg-red-500',
  rescheduled: 'bg-blue-500', nrp: 'bg-gray-500',
};

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function QualityCalendarPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [changingId, setChangingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (e) { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;

  const filtered = useMemo(() => appointments.filter(a => {
    if (filterStatus !== 'all') {
      const ms = STATUS_MAP[a.statut] || a.statut?.toLowerCase();
      if (ms !== filterStatus) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (a.clientName || '').toLowerCase().includes(q) || (a.agentName || '').toLowerCase().includes(q);
    }
    return true;
  }), [appointments, filterStatus, searchQuery]);

  const rdvByDate: Record<string, any[]> = {};
  filtered.forEach(a => {
    const d = a.dateRendezVous;
    if (!d) return;
    const key = new Date(d).toISOString().split('T')[0];
    if (!rdvByDate[key]) rdvByDate[key] = [];
    rdvByDate[key].push(a);
  });

  const totalRdv = appointments.length;
  const pendingCount = appointments.filter(a => (STATUS_MAP[a.statut] || a.statut?.toLowerCase()) === 'pending').length;
  const confirmedCount = appointments.filter(a => a.statut === 'CONFIRME').length;
  const cancelledCount = appointments.filter(a => a.statut === 'ANNULE').length;

  const days: (number | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);

  const selectedKey = selectedDate;
  const selectedRdv = selectedKey ? rdvByDate[selectedKey] || [] : [];

  const handleStatusChange = async (id: number, newStatus: string) => {
    setChangingId(id);
    try {
      await api.put(`/appointments/${id}/status`, { status: newStatus });
      toast.success(`RDV #${id} mis à jour`);
      fetchData();
    } catch { toast.error('Erreur mise à jour'); }
    finally { setChangingId(null); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-primary pl-6">
        <h1 className="text-2xl font-bold">Calendrier <span className="text-primary">Qualité</span></h1>
        <p className="text-muted-foreground text-sm mt-1">Vue calendrier des rendez-vous</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total RDV', value: totalRdv, color: 'text-foreground' },
          { label: 'En attente', value: pendingCount, color: 'text-orange-500' },
          { label: 'Confirmés', value: confirmedCount, color: 'text-emerald-500' },
          { label: 'Annulés', value: cancelledCount, color: 'text-red-500' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-card rounded-lg border border-border p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 bg-card rounded-lg border border-border p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Rechercher..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-muted border border-border rounded-lg text-sm px-3 py-2 focus:outline-none focus:border-primary">
          <option value="all">Tous</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmés</option>
          <option value="cancelled">Annulés</option>
        </select>
        <button onClick={fetchData} className="p-2 bg-muted border border-border rounded-lg hover:bg-accent">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-lg border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-muted rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="font-semibold">{MONTHS_FR[month]} {year}</h3>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-muted rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0">
            {DAYS_FR.map(d => (
              <div key={d} className="p-2 text-center text-xs font-bold text-muted-foreground uppercase border-b border-border">{d}</div>
            ))}
            {days.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} className="p-2 min-h-[80px] border-b border-r border-border/30" />;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayRdv = rdvByDate[dateStr] || [];
              const isSelected = selectedDate === dateStr;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;
              return (
                <div key={dateStr} onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                  className={`p-2 min-h-[80px] border-b border-r border-border/30 cursor-pointer transition-colors
                    ${isSelected ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/30'}
                    ${isToday ? 'ring-1 ring-primary/40 ring-inset' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${isToday ? 'text-primary' : ''}`}>{day}</span>
                    {dayRdv.length > 0 && <span className="text-[10px] text-muted-foreground">{dayRdv.length}</span>}
                  </div>
                  <div className="space-y-0.5">
                    {dayRdv.slice(0, 3).map((r, i) => (
                      <div key={i} className={`h-1 rounded-full ${STATUS_DOT[STATUS_MAP[r.statut] || 'pending'] || 'bg-gray-500'}`} />
                    ))}
                    {dayRdv.length > 3 && <span className="text-[10px] text-muted-foreground">+{dayRdv.length - 3}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              {selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Sélectionnez un jour'}
            </h3>
            {selectedRdv.length > 0 && <p className="text-xs text-muted-foreground mt-1">{selectedRdv.length} RDV</p>}
          </div>
          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {selectedDate && selectedRdv.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun RDV ce jour</p>
            )}
            {selectedRdv.map((apt: any) => {
              const dot = STATUS_DOT[STATUS_MAP[apt.statut] || 'pending'] || 'bg-gray-500';
              const isChanging = changingId === apt.id;
              return (
                <div key={apt.id} className="p-3 bg-muted/30 border border-border rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${dot}`} />
                      <span className="text-sm font-semibold">{apt.clientName || 'Inconnu'}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{STATUS_MAP[apt.statut] || apt.statut}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">Agent: {apt.agentName}</div>
                  {apt.statut === 'BRUT' && (
                    <div className="pt-2 mt-2 border-t border-border flex gap-2">
                      <button disabled={isChanging} onClick={() => handleStatusChange(apt.id, 'CONFIRME')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:opacity-80">
                        <CheckCircle className="w-3 h-3" /> Confirmer
                      </button>
                      <button disabled={isChanging} onClick={() => handleStatusChange(apt.id, 'ANNULE')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border bg-red-500/10 text-red-500 border-red-500/20 hover:opacity-80">
                        <XCircle className="w-3 h-3" /> Refuser
                      </button>
                    </div>
                  )}
                  {(apt.statut === 'CONFIRME' || apt.statut === 'ANNULE') && (
                    <div className="pt-2 mt-2 border-t border-border">
                      <button disabled={isChanging} onClick={() => handleStatusChange(apt.id, 'ANNULE')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border bg-red-500/10 text-red-500 border-red-500/20 hover:opacity-80 disabled:opacity-40">
                        <XCircle className="w-3 h-3" /> Annuler
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {!selectedDate && (
              <div className="text-center py-12">
                <CalendarIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Cliquez sur un jour</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
