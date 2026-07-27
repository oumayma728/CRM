import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, CheckCircle, XCircle, Clock, RefreshCw, ChevronDown, ChevronUp,
  Search, Phone, User, Home, Filter
} from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const STATUS_MAP: Record<string, string> = {
  BRUT: 'pending', CONFIRME: 'confirmed', ANNULE: 'cancelled',
  REPORTER: 'rescheduled', NRP: 'nrp', HORS_CIBLE: 'hc',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente', confirmed: 'Confirmé', cancelled: 'Annulé',
  rescheduled: 'Reprogrammé', nrp: 'NRP', hc: 'HC',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-orange-500', confirmed: 'bg-emerald-500', cancelled: 'bg-red-500',
  rescheduled: 'bg-blue-500', nrp: 'bg-gray-500', hc: 'bg-gray-500',
};

const ACTION_STATUSES = ['CONFIRME', 'ANNULE', 'REPORTER', 'NRP', 'HORS_CIBLE'];

export default function QualityAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [changingId, setChangingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (e) { console.error(e); toast.error('Erreur chargement RDV'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    setChangingId(id);
    try {
      await api.put(`/appointments/${id}/status`, { status: newStatus });
      toast.success(`RDV #${id} mis à jour`);
      fetchData();
    } catch { toast.error('Erreur mise à jour'); }
    finally { setChangingId(null); }
  };

  const getLabel = (s: string) => {
    const mapped = STATUS_MAP[s] || s.toLowerCase();
    return STATUS_LABELS[mapped] || s;
  };

  const getDot = (s: string) => {
    const mapped = STATUS_MAP[s] || s.toLowerCase();
    return STATUS_COLORS[mapped] || 'bg-gray-500';
  };

  const filtered = appointments.filter(a => {
    const mappedStatus = STATUS_MAP[a.statut] || a.statut?.toLowerCase() || 'pending';
    if (filterStatus !== 'all' && mappedStatus !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (a.clientName || '').toLowerCase().includes(q) || (a.agentName || '').toLowerCase().includes(q);
    }
    return true;
  });

  const totalRdv = appointments.length;
  const pendingCount = appointments.filter(a => (STATUS_MAP[a.statut] || a.statut?.toLowerCase()) === 'pending').length;
  const confirmedCount = appointments.filter(a => a.statut === 'CONFIRME').length;
  const cancelledCount = appointments.filter(a => a.statut === 'ANNULE').length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-primary pl-6">
        <h1 className="text-2xl font-bold">Validation <span className="text-primary">Rendez-vous</span></h1>
        <p className="text-muted-foreground text-sm mt-1">Service Qualité — Confirmer, annuler ou reprogrammer les RDV</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total RDV', value: totalRdv, color: 'text-primary' },
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

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <span className="font-semibold">{filtered.length} rendez-vous</span>
        </div>
        {filtered.map(apt => {
          const isExpanded = expandedId === apt.id;
          const isChanging = changingId === apt.id;
          return (
            <div key={apt.id} className="border-b border-border last:border-b-0">
              <div className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/30"
                onClick={() => setExpandedId(isExpanded ? null : apt.id)}>
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${getDot(apt.statut)}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold truncate">{apt.clientName || 'Inconnu'}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {getLabel(apt.statut)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{apt.agentName}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(apt.dateRendezVous).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">#{apt.id}</span>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
              {isExpanded && (
                <div className="px-4 pb-4 ml-8 space-y-3">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {apt.typeProjet && <span className="flex items-center gap-1"><Home className="w-3 h-3" />{apt.typeProjet}</span>}
                    {apt.commentaire && <div className="w-full bg-muted rounded-lg p-2 mt-1">{apt.commentaire}</div>}
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Changer le statut</p>
                    <div className="flex flex-wrap gap-2">
                      {ACTION_STATUSES.map(status => {
                        const isCurrent = apt.statut === status;
                        return (
                          <button key={status}
                            disabled={isCurrent || isChanging}
                            onClick={() => handleStatusChange(apt.id, status)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                              ${isCurrent ? 'bg-primary/10 text-primary border-primary/30 opacity-60 cursor-default' : 'bg-muted text-muted-foreground border-border hover:border-primary/30'}`}>
                            {status === 'CONFIRME' && <CheckCircle className="w-3 h-3" />}
                            {status === 'ANNULE' && <XCircle className="w-3 h-3" />}
                            {status === 'REPORTER' && <RefreshCw className="w-3 h-3" />}
                            {getLabel(status)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
