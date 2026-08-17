import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import { updateAppointmentStatus } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending:       { label: 'En attente',   color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', dot: 'bg-orange-400' },
  confirmed:     { label: 'Confirmé',     color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', dot: 'bg-emerald-400' },
  cancelled:     { label: 'Annulé',       color: 'text-red-400 bg-red-400/10 border-red-400/20', dot: 'bg-red-400' },
  rescheduled:   { label: 'Reprogrammé',  color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', dot: 'bg-blue-400' },
  nrp:           { label: 'NRP',          color: 'text-gray-400 bg-gray-400/10 border-gray-400/20', dot: 'bg-gray-400' },
  hc:            { label: 'HC',           color: 'text-gray-400 bg-gray-400/10 border-gray-400/20', dot: 'bg-gray-400' },
  not_interested:{ label: 'Pas intéressé', color: 'text-gray-400 bg-gray-400/10 border-gray-400/20', dot: 'bg-gray-400' },
};

const ITEMS_PER_PAGE = 10;

function getStatusConf(status: string) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const c = getStatusConf(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const [editModal, setEditModal] = useState<any>(null);
  const [reassignModal, setReassignModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [aptData, agentData] = await Promise.all([
        api.getAppointments(),
        api.getAgents().catch(() => [])
      ]);
      setAppointments(Array.isArray(aptData) ? aptData : []);
      setAgents(Array.isArray(agentData) ? agentData : []);
    } catch (e) {
      console.error('Failed to load', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [search, filterAgent, filterStatus, dateFrom, dateTo]);

  const uniqueAgents = useMemo(() => {
    const names = appointments.map(a => a.agent_name || a.agentName).filter(Boolean);
    return [...new Set(names)].sort();
  }, [appointments]);

  const filtered = useMemo(() => {
    return appointments.filter(a => {
      if (search) {
        const q = search.toLowerCase();
        const cn = (a.client_name || a.clientName || '').toLowerCase();
        const cp = a.client_phone || a.clientPhone || '';
        if (!cn.includes(q) && !cp.includes(q)) return false;
      }
      if (filterAgent && (a.agent_name || a.agentName) !== filterAgent) return false;
      if (filterStatus && a.status !== filterStatus) return false;
      const d = (a.appointment_date || a.appointmentDate || '').toString().split('T')[0];
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    });
  }, [appointments, search, filterAgent, filterStatus, dateFrom, dateTo]);

  const totalRdv = appointments.length;
  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
  const cancelledCount = appointments.filter(a => a.status === 'cancelled').length;

  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer ce rendez-vous ?')) return;
    try {
      await api.deleteAppointment(id);
      toast.success('RDV supprimé');
      fetchData();
    } catch { toast.error('Erreur suppression'); }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateAppointmentStatus(id, status);
      toast.success(`Statut changé → ${getStatusConf(status).label}`);
      fetchData();
    } catch (e: any) {
      toast.error(e?.message || 'Erreur changement statut');
    }
  };

  const handleReassign = async (appointmentId: number, newAgentId: number) => {
    setSaving(true);
    try {
      await api.updateAppointment(appointmentId, { agent_id: newAgentId });
      toast.success('Agent réassigné');
      setReassignModal(null);
      fetchData();
    } catch { toast.error('Erreur réassignation'); }
    finally { setSaving(false); }
  };

  const handleEditSave = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      await api.updateAppointment(editModal.id, {
        client_name: editModal.client_name,
        client_phone: editModal.client_phone,
        client_email: editModal.client_email,
        project_type: editModal.project_type,
        appointment_date: editModal.appointment_date,
        appointment_time: editModal.appointment_time,
        notes: editModal.notes,
      });
      toast.success('RDV modifié');
      setEditModal(null);
      fetchData();
    } catch { toast.error('Erreur modification'); }
    finally { setSaving(false); }
  };

  const formatDate = (d: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR');
  };

  const thClass = 'px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider';
  const tdClass = 'px-4 py-3 text-xs text-gray-300 whitespace-nowrap';

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">

        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#7c3aed]/20 rounded-xl border border-[#7c3aed]/20">
            <svg className="w-5 h-5 text-[#7c3aed]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Agenda <span className="text-[#7c3aed]">Admin</span></h1>
            <p className="text-[10px] text-gray-500">Gestion complète des rendez-vous — Modifier, supprimer, réassigner</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-[#7c3aed]/20 to-purple-500/20 border border-[#7c3aed]/30 rounded-xl p-4">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Total RDV</p>
            <p className="text-2xl font-bold text-white">{totalRdv}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-xl p-4">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">En attente</p>
            <p className="text-2xl font-bold text-orange-400">{pendingCount}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl p-4">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Confirmés</p>
            <p className="text-2xl font-bold text-emerald-400">{confirmedCount}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30 rounded-xl p-4">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Annulés</p>
            <p className="text-2xl font-bold text-red-400">{cancelledCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 bg-[#1a1a2e]/80 backdrop-blur-sm rounded-xl border border-white/5 p-4">
          <div className="relative col-span-2 md:col-span-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Rechercher client…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#7c3aed]/50 transition-all" />
          </div>
          <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#7c3aed]/50 transition-all appearance-none">
            <option value="" className="bg-[#1a1a2e]">Tous les agents</option>
            {uniqueAgents.map(a => <option key={a} value={a} className="bg-[#1a1a2e]">{a}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#7c3aed]/50 transition-all appearance-none">
            <option value="" className="bg-[#1a1a2e]">Tous les statuts</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k} className="bg-[#1a1a2e]">{v.label}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#7c3aed]/50 transition-all" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#7c3aed]/50 transition-all" />
          {(search || filterAgent || filterStatus || dateFrom || dateTo) && (
            <button onClick={() => { setSearch(''); setFilterAgent(''); setFilterStatus(''); setDateFrom(''); setDateTo(''); }}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-400 hover:text-white transition-all">
              ✕ Réinitialiser
            </button>
          )}
        </div>

        <div className="bg-[#1a1a2e]/80 backdrop-blur-sm rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className={thClass}>Client</th>
                  <th className={thClass}>Téléphone</th>
                  <th className={thClass}>Projet</th>
                  <th className={thClass}>Date RDV</th>
                  <th className={thClass}>Heure</th>
                  <th className={thClass}>Agent</th>
                  <th className={thClass}>Statut</th>
                  <th className={thClass}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-16 text-center text-sm text-gray-500">Aucun rendez-vous trouvé</td></tr>
                ) : paginated.map(a => {
                  const cn = a.client_name || a.clientName || '';
                  const cp = a.client_phone || a.clientPhone || '';
                  const an = a.agent_name || a.agentName || '';
                  const ad = a.appointment_date || a.appointmentDate || '';
                  return (
                    <tr key={a.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className={tdClass}>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/20 flex items-center justify-center text-xs font-bold text-[#7c3aed] shrink-0">
                            {cn.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-white">{cn}</span>
                        </div>
                      </td>
                      <td className={`${tdClass} text-gray-400 font-mono text-xs`}>{cp}</td>
                      <td className={tdClass}>
                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs text-gray-300">{a.project_type || a.projectType || '-'}</span>
                      </td>
                      <td className={`${tdClass} text-gray-400`}>{formatDate(ad)}</td>
                      <td className={`${tdClass} text-gray-400 font-mono text-xs`}>{a.appointment_time || a.appointmentTime || '-'}</td>
                      <td className={tdClass}>{an}</td>
                      <td className={tdClass}><StatusBadge status={a.status} /></td>
                      <td className={tdClass}>
                        <div className="flex items-center gap-1">

                          <button onClick={() => setEditModal({
                            id: a.id, client_name: cn, client_phone: cp,
                            client_email: a.client_email || a.clientEmail || '',
                            project_type: a.project_type || a.projectType || 'PV',
                            appointment_date: (ad ? new Date(ad).toISOString().split('T')[0] : ''),
                            appointment_time: a.appointment_time || a.appointmentTime || '09:00',
                            notes: a.notes || '',
                          })} title="Modifier"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-sky-400 hover:bg-sky-400/10 transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          <button onClick={() => setReassignModal({ id: a.id, currentAgent: an })}
                            title="Réassigner"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#7c3aed] hover:bg-[#7c3aed]/10 transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                          </button>

                          <button onClick={() => handleDelete(a.id)} title="Supprimer"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>

                          {a.status === 'pending' && (
                            <button onClick={() => handleStatusChange(a.id, 'confirmed')} title="Confirmer"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}

                          {a.status !== 'cancelled' && (
                            <button onClick={() => handleStatusChange(a.id, 'cancelled')} title="Annuler"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
              <p className="text-[10px] text-gray-500">{Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} sur {filtered.length}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="text-xs text-gray-400 px-2">{page}/{totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {editModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditModal(null)}>
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-bold text-white">Modifier le RDV</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">RDV #{editModal.id}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Nom du client</label>
                <input type="text" value={editModal.client_name} onChange={e => setEditModal({ ...editModal, client_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#7c3aed]/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Téléphone</label>
                  <input type="text" value={editModal.client_phone} onChange={e => setEditModal({ ...editModal, client_phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#7c3aed]/50" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Email</label>
                  <input type="email" value={editModal.client_email} onChange={e => setEditModal({ ...editModal, client_email: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#7c3aed]/50" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Projet</label>
                  <select value={editModal.project_type} onChange={e => setEditModal({ ...editModal, project_type: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#7c3aed]/50 appearance-none">
                    <option value="PV">PV</option>
                    <option value="PAC">PAC</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Date</label>
                  <input type="date" value={editModal.appointment_date} onChange={e => setEditModal({ ...editModal, appointment_date: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#7c3aed]/50" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Heure</label>
                  <input type="time" value={editModal.appointment_time} onChange={e => setEditModal({ ...editModal, appointment_time: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#7c3aed]/50" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Notes</label>
                <textarea value={editModal.notes} onChange={e => setEditModal({ ...editModal, notes: e.target.value })} rows={3}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#7c3aed]/50 resize-none" />
              </div>
            </div>
            <div className="p-6 border-t border-white/5 flex justify-end gap-3">
              <button onClick={() => setEditModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-all">Annuler</button>
              <button onClick={handleEditSave} disabled={saving}
                className="px-6 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] transition-all disabled:opacity-50">
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {reassignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setReassignModal(null)}>
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-bold text-white">Réassigner l'agent</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">RDV #{reassignModal.id} — Agent actuel : {reassignModal.currentAgent}</p>
            </div>
            <div className="p-6 space-y-4">
              <select id="reassign-select" defaultValue=""
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#7c3aed]/50 appearance-none">
                <option value="" className="bg-[#1a1a2e]" disabled>Sélectionner un agent</option>
                {agents.map((ag: any) => (
                  <option key={ag.id || ag.name} value={ag.id} className="bg-[#1a1a2e]">{ag.name || ag.username}</option>
                ))}
              </select>
            </div>
            <div className="p-6 border-t border-white/5 flex justify-end gap-3">
              <button onClick={() => setReassignModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-all">Annuler</button>
              <button onClick={() => {
                const sel = document.getElementById('reassign-select') as HTMLSelectElement;
                if (sel && sel.value) {
                  handleReassign(reassignModal.id, parseInt(sel.value));
                } else {
                  toast.error('Sélectionnez un agent');
                }
              }} disabled={saving}
                className="px-6 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] transition-all disabled:opacity-50">
                {saving ? 'Réassignation…' : 'Réassigner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
