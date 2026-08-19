import React, { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../../../services/api';
import { toast } from 'react-toastify';
import {
  CalendarDays, ChevronLeft, ChevronRight, CheckCircle, XCircle,
  RefreshCw, Users, Filter, Search
} from 'lucide-react';

interface RdvCalendrier {
  id: number;
  dateRendezVous: string;
  statut: string;
  typeRendezVous?: string;
  commentaire?: string;
  commentaireConfirmation?: string;
  contact: { id: number; nom: string; prenom: string; telephone: string; numGSM?: string } | null;
  agent: { id: number; nom: string; prenom: string } | null;
}

const STATUT_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
  BRUT:               { bg: 'bg-blue-500/10',    text: 'text-blue-600',    border: 'border-blue-500/20',    dot: 'bg-blue-500',    label: 'Brut' },
  CONFIRME:           { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20', dot: 'bg-emerald-500', label: 'Confirmé' },
  CONFIRME_CONF_CALL: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20', dot: 'bg-emerald-500', label: 'Confirmé (conf call)' },
  CONFIRME_TOTAL:     { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20', dot: 'bg-emerald-500', label: 'Confirmé total' },
  ANNULE:             { bg: 'bg-red-500/10',     text: 'text-red-600',     border: 'border-red-500/20',     dot: 'bg-red-500',     label: 'Annulé' },
  REPORTER:           { bg: 'bg-amber-500/10',   text: 'text-amber-600',   border: 'border-amber-500/20',   dot: 'bg-amber-500',   label: 'Reporté' },
  HORS_CIBLE:         { bg: 'bg-muted',          text: 'text-muted-foreground', border: 'border-border',    dot: 'bg-muted-foreground', label: 'Hors cible' },
  SIGNE:              { bg: 'bg-teal-500/10',    text: 'text-teal-600',    border: 'border-teal-500/20',    dot: 'bg-teal-500',    label: 'Signé' },
  NON_SIGNE:          { bg: 'bg-orange-500/10',  text: 'text-orange-600',  border: 'border-orange-500/20',  dot: 'bg-orange-500',  label: 'Non signé' },
  INSTALLE:           { bg: 'bg-purple-500/10',  text: 'text-purple-600',  border: 'border-purple-500/20',  dot: 'bg-purple-500',  label: 'Installé' },
  R2:                 { bg: 'bg-indigo-500/10',  text: 'text-indigo-600',  border: 'border-indigo-500/20',  dot: 'bg-indigo-500',  label: 'R2' },
  NRP:                { bg: 'bg-muted',          text: 'text-muted-foreground', border: 'border-border',    dot: 'bg-muted-foreground', label: 'NRP' },
  PORTE:              { bg: 'bg-muted',          text: 'text-muted-foreground', border: 'border-border',    dot: 'bg-muted-foreground', label: 'Porte' },
};

const getStatutStyle = (s: string) => STATUT_CONFIG[s] || STATUT_CONFIG.BRUT;
const CONFIRMED_STATUSES = ['CONFIRME', 'CONFIRME_CONF_CALL', 'CONFIRME_TOTAL', 'SIGNE', 'INSTALLE'];

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function QualityCalendarPage() {
  const [rdvs, setRdvs] = useState<RdvCalendrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [changingId, setChangingId] = useState<number | null>(null);

  const [filterStatut, setFilterStatut] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');
  const [search, setSearch] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const debut = new Date(year, month - 1, 1).toISOString();
      const fin = new Date(year, month + 2, 0).toISOString();
      const res = await api.get('/qualite/rdv-calendrier', { params: { debut, fin } });
      setRdvs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Erreur chargement calendrier qualité:', err);
      toast.error('Erreur de chargement du calendrier');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const agents = useMemo(() => {
    const map = new Map<number, string>();
    rdvs.forEach(r => { if (r.agent) map.set(r.agent.id, `${r.agent.prenom} ${r.agent.nom}`); });
    return Array.from(map.entries()).map(([id, nom]) => ({ id, nom }));
  }, [rdvs]);

  const filtered = useMemo(() => {
    return rdvs.filter(r => {
      if (filterStatut !== 'all' && r.statut !== filterStatut) return false;
      if (filterAgent !== 'all' && String(r.agent?.id) !== filterAgent) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (r.contact?.nom || '').toLowerCase().includes(q) ||
          (r.contact?.prenom || '').toLowerCase().includes(q) ||
          (r.contact?.telephone || '').includes(q) ||
          (`${r.agent?.prenom ?? ''} ${r.agent?.nom ?? ''}`).toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rdvs, filterStatut, filterAgent, search]);

  const rdvByDate = useMemo(() => {
    const map: Record<string, RdvCalendrier[]> = {};
    filtered.forEach(r => {
      const key = new Date(r.dateRendezVous).toISOString().split('T')[0];
      (map[key] ||= []).push(r);
    });
    return map;
  }, [filtered]);

  const totalRdv = filtered.length;
  const confirmedCount = filtered.filter(r => CONFIRMED_STATUSES.includes(r.statut)).length;
  const cancelledCount = filtered.filter(r => r.statut === 'ANNULE').length;
  const brutCount = filtered.filter(r => r.statut === 'BRUT').length;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const days: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: lastDay.getDate() }, (_, i) => i + 1)];

  const selectedRdv = selectedDate ? rdvByDate[selectedDate] || [] : [];

  const handleStatutChange = async (id: number, statut: string) => {
    setChangingId(id);
    try {
      await api.put(`/qualite/rdv-calendrier/${id}/statut`, { statut });
      toast.success(`RDV #${id} → ${getStatutStyle(statut).label}`);
      await fetchData();
    } catch (err) {
      console.error('Erreur changement statut:', err);
      toast.error('Erreur lors du changement de statut');
    } finally {
      setChangingId(null);
    }
  };

  return (
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Calendrier Qualité</h1>
            <p className="text-sm text-muted-foreground mt-1">Vue calendrier des rendez-vous — filtrer, confirmer ou annuler</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 w-fit"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total RDV</p>
            <p className="text-2xl font-bold text-foreground">{totalRdv}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Brut</p>
            <p className="text-2xl font-bold text-blue-600">{brutCount}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Confirmés</p>
            <p className="text-2xl font-bold text-emerald-600">{confirmedCount}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Annulés</p>
            <p className="text-2xl font-bold text-red-600">{cancelledCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-card border border-border rounded-xl p-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par client, agent, téléphone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
              className="bg-background border border-border rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="all">Tous les statuts</option>
              {Object.entries(STATUT_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground shrink-0" />
            <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
              className="bg-background border border-border rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="all">Tous les agents</option>
              {agents.map(a => <option key={a.id} value={String(a.id)}>{a.nom}</option>)}
            </select>
          </div>
        </div>

        {/* Calendar + Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Calendar grid */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              <h2 className="text-sm font-bold text-foreground">{MONTHS_FR[month]} {year}</h2>
              <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-7">
              {DAYS_FR.map(d => (
                <div key={d} className="p-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border">{d}</div>
              ))}
              {days.map((day, idx) => {
                if (!day) return <div key={`e-${idx}`} className="p-2 min-h-[80px] border-b border-r border-border" />;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayRdv = rdvByDate[dateStr] || [];
                const isSelected = selectedDate === dateStr;
                const isToday = new Date().toISOString().split('T')[0] === dateStr;

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                    className={`p-2 min-h-[80px] border-b border-r border-border cursor-pointer transition-colors
                      ${isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'}
                      ${isToday ? 'ring-1 ring-primary/40 ring-inset' : ''}`}
                  >
                    <span className={`text-xs font-bold ${isToday ? 'text-primary' : 'text-foreground/80'}`}>{day}</span>
                    {dayRdv.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {dayRdv.slice(0, 3).map((r, i) => (
                          <div key={i} className={`h-1 rounded-full ${getStatutStyle(r.statut).dot}`} />
                        ))}
                        {dayRdv.length > 3 && <p className="text-[9px] text-muted-foreground">+{dayRdv.length - 3}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail panel */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                {selectedDate
                  ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
                  : 'Sélectionnez un jour'}
              </h3>
              {selectedRdv.length > 0 && <p className="text-xs text-muted-foreground mt-1">{selectedRdv.length} RDV ce jour</p>}
            </div>
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
              {!selectedDate && (
                <div className="text-center py-12">
                  <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-xs text-muted-foreground">Cliquez sur un jour du calendrier</p>
                </div>
              )}
              {selectedDate && selectedRdv.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">Aucun RDV ce jour</p>
              )}
              {selectedRdv.map(rdv => {
                const s = getStatutStyle(rdv.statut);
                const isChanging = changingId === rdv.id;
                return (
                  <div key={rdv.id} className="p-3 bg-muted/40 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-foreground">
                        {rdv.contact ? `${rdv.contact.prenom} ${rdv.contact.nom}` : 'Contact inconnu'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}>{s.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      <span>Agent: {rdv.agent ? `${rdv.agent.prenom} ${rdv.agent.nom}` : '—'}</span>
                      <span>{new Date(rdv.dateRendezVous).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {rdv.contact?.telephone && <p className="text-xs text-muted-foreground/70">📞 {rdv.contact.telephone}</p>}

                    <div className="pt-2 mt-2 border-t border-border flex flex-wrap gap-1.5">
                      {rdv.statut === 'BRUT' && (
                        <>
                          <button disabled={isChanging} onClick={() => handleStatutChange(rdv.id, 'CONFIRME')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:opacity-80 disabled:opacity-40">
                            <CheckCircle className="w-3 h-3" /> Confirmer
                          </button>
                          <button disabled={isChanging} onClick={() => handleStatutChange(rdv.id, 'ANNULE')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border bg-red-500/10 text-red-600 border-red-500/20 hover:opacity-80 disabled:opacity-40">
                            <XCircle className="w-3 h-3" /> Refuser
                          </button>
                        </>
                      )}
                      {CONFIRMED_STATUSES.includes(rdv.statut) && (
                        <button disabled={isChanging} onClick={() => handleStatutChange(rdv.id, 'ANNULE')}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border bg-red-500/10 text-red-600 border-red-500/20 hover:opacity-80 disabled:opacity-40">
                          <XCircle className="w-3 h-3" /> Annuler
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
  );
}
