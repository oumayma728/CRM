import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Clock, RefreshCw,
  Users, Filter, Eye, ShieldAlert, Search
} from 'lucide-react';
import * as api from '../../services/api';
import { updateAppointmentStatus } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
  pending:       { bg: 'bg-orange-500/20',  text: 'text-orange-400',   border: 'border-orange-500/30',  dot: 'bg-orange-500',   label: 'En attente' },
  confirmed:     { bg: 'bg-emerald-500/20', text: 'text-emerald-400',  border: 'border-emerald-500/30', dot: 'bg-emerald-500',  label: 'Confirmé' },
  cancelled:     { bg: 'bg-red-500/20',     text: 'text-red-400',      border: 'border-red-500/30',     dot: 'bg-red-500',      label: 'Annulé' },
  rescheduled:   { bg: 'bg-blue-500/20',   text: 'text-blue-400',    border: 'border-blue-500/30',    dot: 'bg-blue-500',     label: 'Reprogrammé' },
  nrp:           { bg: 'bg-gray-500/20',   text: 'text-gray-400',    border: 'border-gray-500/30',    dot: 'bg-gray-500',     label: 'NRP' },
  hc:            { bg: 'bg-gray-500/20',   text: 'text-gray-400',    border: 'border-gray-500/30',     dot: 'bg-gray-500',    label: 'HC' },
  not_interested:{ bg: 'bg-gray-500/20',   text: 'text-gray-400',    border: 'border-gray-500/30',     dot: 'bg-gray-500',    label: 'Pas intéressé' },
};

function getStatusStyle(status: string) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
}

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function QualityCalendarPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [changingId, setChangingId] = useState<number | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [showFakeRdvPanel, setShowFakeRdvPanel] = useState(false);
  const [fakeRdvResults, setFakeRdvResults] = useState<any[]>([]);
  const [scanningFakes, setScanningFakes] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [appointmentsData, agentsData] = await Promise.all([
        api.getAppointments(),
        api.getAgents(),
      ]);
      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      setAgents(Array.isArray(agentsData) ? agentsData : []);
    } catch (e) {
      console.error('Failed to fetch data', e);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;

  const agentNames = useMemo(() => {
    const map: Record<number, string> = {};
    agents.forEach((a: any) => { map[a.id] = a.name || a.username || `Agent #${a.id}`; });
    return map;
  }, [agents]);

  const filtered = useMemo(() => {
    return appointments.filter(a => {
      if (filterStatus !== 'all' && a.status !== filterStatus) return false;
      if (filterAgent !== 'all' && String(a.agent_id) !== filterAgent) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          (a.client_name || '').toLowerCase().includes(q) ||
          (agentNames[a.agent_id] || '').toLowerCase().includes(q) ||
          (a.client_phone || '').includes(q) ||
          String(a.id).includes(q)
        );
      }
      return true;
    });
  }, [appointments, filterStatus, filterAgent, searchQuery, agentNames]);

  const rdvByDate: Record<string, any[]> = {};
  filtered.forEach(a => {
    const d = a.appointment_date;
    if (!d) return;
    const key = new Date(d).toISOString().split('T')[0];
    if (!rdvByDate[key]) rdvByDate[key] = [];
    rdvByDate[key].push(a);
  });

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    appointments.forEach(a => {
      const s = a.status || 'pending';
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [appointments]);

  const totalRdv = appointments.length;
  const pendingCount = statusCounts['pending'] || 0;
  const confirmedCount = statusCounts['confirmed'] || 0;
  const cancelledCount = statusCounts['cancelled'] || 0;

  const days: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);

  const selectedKey = selectedDate;
  const selectedRdv = selectedKey ? rdvByDate[selectedKey] || [] : [];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleStatusChange = async (appointmentId: number, newStatus: string) => {
    setChangingId(appointmentId);
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      toast.success(`RDV #${appointmentId} → ${getStatusStyle(newStatus).label}`);
      fetchData();
    } catch (e: any) {
      const msg = e?.message || 'Erreur lors du changement de statut';
      toast.error(msg);
    } finally {
      setChangingId(null);
    }
  };

  const handleScanFakeRdv = async () => {
    setScanningFakes(true);
    setFakeRdvResults([]);
    try {
      const aptData = await api.getAppointments();
      const results = await Promise.all(
        (aptData || []).slice(0, 20).map(async (apt: any) => {
          try {
            return await api.aiDetectFakeRdv({
              id: apt.id, agent_id: apt.agent_id, quality_score: apt.quality_score,
              client_phone: apt.client_phone, appointment_time: apt.appointment_time,
              revenus: apt.revenus, chauffage: apt.chauffage, toiture: apt.toiture
            });
          } catch { return null; }
        })
      );
      const flagged = results.filter((r: any) => r && r.risk_score >= 30).sort((a: any, b: any) => b.risk_score - a.risk_score);
      setFakeRdvResults(flagged);
      setShowFakeRdvPanel(true);
      toast.success(`${flagged.length} RDV suspects détectés sur ${Math.min(aptData.length, 20)} analysés`);
    } catch { toast.error('Erreur scan faux RDV'); }
    finally { setScanningFakes(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Calendrier <span className="text-primary">Qualité</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Vue calendrier des rendez-vous — filtrer, confirmer ou annuler</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-muted/40 border border-border rounded-xl text-xs font-semibold text-foreground hover:bg-muted/70 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button
              onClick={handleScanFakeRdv}
              disabled={scanningFakes}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:from-red-500/30 hover:to-orange-500/30 transition-all disabled:opacity-50"
            >
              <ShieldAlert className={`w-3.5 h-3.5 ${scanningFakes ? 'animate-pulse' : ''}`} />
              {scanningFakes ? 'Scan...' : 'Scan Faux RDV'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-primary/20 to-indigo-500/20 border border-primary/30 rounded-xl p-4">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total RDV</p>
            <p className="text-2xl font-bold text-foreground">{totalRdv}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-xl p-4">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">En attente</p>
            <p className="text-2xl font-bold text-orange-400">{pendingCount}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl p-4">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Confirmés</p>
            <p className="text-2xl font-bold text-emerald-400">{confirmedCount}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30 rounded-xl p-4">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Annulés</p>
            <p className="text-2xl font-bold text-red-400">{cancelledCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-card border border-border rounded-2xl p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par client, agent, téléphone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-background/50 border border-border rounded-xl text-xs text-foreground px-3 py-2 focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
            >
              <option value="all" className="bg-card">Tous les statuts</option>
              <option value="pending" className="bg-card">En attente</option>
              <option value="confirmed" className="bg-card">Confirmés</option>
              <option value="cancelled" className="bg-card">Annulés</option>
              <option value="rescheduled" className="bg-card">Reprogrammés</option>
              <option value="nrp" className="bg-card">NRP</option>
              <option value="hc" className="bg-card">HC</option>
              <option value="not_interested" className="bg-card">Pas intéressé</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterAgent}
              onChange={e => setFilterAgent(e.target.value)}
              className="bg-background/50 border border-border rounded-xl text-xs text-foreground px-3 py-2 focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
            >
              <option value="all" className="bg-card">Tous les agents</option>
              {agents.map((a: any) => (
                <option key={a.id} value={String(a.id)} className="bg-card">{a.name || a.username || `Agent #${a.id}`}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Calendar + Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Calendar */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <button onClick={prevMonth} className="p-2 hover:bg-muted/40 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              <h3 className="text-sm font-bold text-foreground">
                {MONTHS_FR[month]} {year}
              </h3>
              <button onClick={nextMonth} className="p-2 hover:bg-muted/40 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0">
              {DAYS_FR.map(d => (
                <div key={d} className="p-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border">
                  {d}
                </div>
              ))}
              {days.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="p-2 min-h-[80px] border-b border-r border-border" />;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                const dayRdv = rdvByDate[dateStr] || [];
                const isSelected = selectedDate === dateStr;
                const isToday = new Date().toISOString().split('T')[0] === dateStr;

                const pendingDay = dayRdv.filter(r => r.status === 'pending').length;

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                    className={`p-2 min-h-[80px] border-b border-r border-border cursor-pointer transition-colors
                      ${isSelected ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/40'}
                      ${isToday ? 'ring-1 ring-primary/40 ring-inset' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${isToday ? 'text-primary' : 'text-foreground/80'}`}>
                        {day}
                      </span>
                      {dayRdv.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[8px] text-muted-foreground">{dayRdv.length}</span>
                          {pendingDay > 0 && (
                            <span className="text-[8px] text-orange-400 font-bold">{pendingDay}!</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      {dayRdv.slice(0, 3).map((r, i) => {
                        const s = getStatusStyle(r.status);
                        return <div key={i} className={`h-1 rounded-full ${s.dot}`} />;
                      })}
                      {dayRdv.length > 3 && (
                        <p className="text-[8px] text-muted-foreground pl-1">+{dayRdv.length - 3}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                {selectedDate
                  ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
                  : 'Sélectionnez un jour'}
              </h3>
              {selectedRdv.length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">{selectedRdv.length} RDV ce jour</p>
              )}
            </div>
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin">
              {selectedDate && selectedRdv.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">Aucun RDV ce jour</p>
              )}
              {selectedRdv.map((apt: any) => {
                const s = getStatusStyle(apt.status);
                const isChanging = changingId === apt.id;
                return (
                  <div
                    key={apt.id}
                    className="p-3 bg-muted/40 border border-border rounded-xl hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                        <span className="text-xs font-semibold text-foreground">{apt.client_name || 'Client inconnu'}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
                        {s.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
                      <span>Agent: {apt.agent_name || agentNames[apt.agent_id] || '-'}</span>
                      {apt.appointment_time && <span>{apt.appointment_time}</span>}
                    </div>
                    {apt.client_phone && (
                      <p className="text-[10px] text-muted-foreground/70 truncate">📞 {apt.client_phone}</p>
                    )}

                    <div className="pt-2 mt-2 border-t border-border">
                      <div className="flex flex-wrap gap-1.5">
                        {apt.status === 'pending' && (
                          <>
                            <button
                              disabled={isChanging}
                              onClick={() => handleStatusChange(apt.id, 'confirmed')}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:opacity-80 disabled:opacity-40"
                            >
                              <CheckCircle className="w-3 h-3" /> Confirmer
                            </button>
                            <button
                              disabled={isChanging}
                              onClick={() => handleStatusChange(apt.id, 'cancelled')}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border bg-red-500/10 text-red-400 border-red-500/20 hover:opacity-80 disabled:opacity-40"
                            >
                              <XCircle className="w-3 h-3" /> Refuser
                            </button>
                          </>
                        )}
                        {apt.status === 'confirmed' && (
                          <button
                            disabled={isChanging}
                            onClick={() => handleStatusChange(apt.id, 'cancelled')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border bg-red-500/10 text-red-400 border-red-500/20 hover:opacity-80 disabled:opacity-40"
                          >
                            <XCircle className="w-3 h-3" /> Annuler
                          </button>
                        )}
                        {apt.status !== 'pending' && apt.status !== 'confirmed' && (
                          <span className="text-[9px] text-muted-foreground italic">Aucune action disponible</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {!selectedDate && (
                <div className="text-center py-12">
                  <CalendarIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-xs text-muted-foreground">Cliquez sur un jour du calendrier</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fake RDV Detection Panel */}
        {showFakeRdvPanel && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowFakeRdvPanel(false)}>
            <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Détection Faux RDV</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{fakeRdvResults.length} RDV suspects détectés</p>
                  </div>
                </div>
                <button onClick={() => setShowFakeRdvPanel(false)} className="p-2 hover:bg-muted/40 rounded-lg transition-colors">
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="p-6 space-y-3 overflow-y-auto flex-1 scrollbar-thin">
                {fakeRdvResults.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-40" />
                    <p className="text-sm text-emerald-400 font-bold">Aucun faux RDV détecté</p>
                    <p className="text-xs text-muted-foreground mt-1">Tous les RDV analysés semblent valides</p>
                  </div>
                )}
                {fakeRdvResults.map((result: any, i: number) => (
                  <div key={i} className={`p-4 rounded-xl border transition-all ${
                    result.risk_score >= 60 ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          result.risk_score >= 60 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {result.verdict}
                        </div>
                        <span className="text-[10px] text-muted-foreground">RDV #{result.appointment_id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${result.risk_score >= 60 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${result.risk_score}%` }} />
                        </div>
                        <span className={`text-xs font-bold ${result.risk_score >= 60 ? 'text-red-400' : 'text-amber-400'}`}>{result.risk_score}%</span>
                      </div>
                    </div>
                    {result.flags && result.flags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {result.flags.map((flag: string, j: number) => (
                          <span key={j} className="text-[9px] px-2 py-0.5 bg-muted/40 border border-border rounded-full text-muted-foreground">{flag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <style>{`
          .scrollbar-thin::-webkit-scrollbar { width: 4px; }
          .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
          .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(var(--primary-rgb), 0.3); border-radius: 4px; }
        `}</style>
      </div>
    </div>
  );
}
