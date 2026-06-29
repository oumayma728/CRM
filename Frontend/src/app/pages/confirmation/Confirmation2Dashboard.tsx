import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

const API_URL = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:5241') + '/api';

interface Rdv {
  id: number;
  contactNom: string;
  contactPrenom: string;
  telephone: string;
  source: string;
  agentNom: string;
  dateCreation: string;
  dateRendezVous: string;
  statut: string;
}

interface DashboardData {
  totalRdv: number;
  rdvConfirmes: number;
  rdvAnnules: number;
  rdvReportes: number;
  rdvRecents: Rdv[];
}

// Conf2 has access to EBI (via /agenda) and CLIENT1 (via /agenda-client1)
const AGENDA_TABS = [
  { id: 'EBI',     label: 'Agenda EBI',     icon: '🏢', endpoint: 'agenda'         },
  { id: 'CLIENT1', label: 'Agenda Client 1', icon: '👤', endpoint: 'agenda-client1' },
];

export default function Confirmation2Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRdv, setSelectedRdv] = useState<Rdv | null>(null);
  const [selectedStatut, setSelectedStatut] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [myAgendas, setMyAgendas] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [agendaRdvs, setAgendaRdvs] = useState<Rdv[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchMyAgendas();
  }, []);

  useEffect(() => {
    if (activeTab) fetchAgendaRdvs(activeTab);
  }, [activeTab]);

  const token = () => localStorage.getItem('token');

  const fetchMyAgendas = async () => {
    try {
      const res = await fetch(`${API_URL}/confirmatrice/my-agendas`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (!res.ok) return;
      const list: string[] = await res.json();
      setMyAgendas(list);
      const first = AGENDA_TABS.find(t => list.includes(t.id));
      if (first) setActiveTab(first.id);
    } catch {
      setMyAgendas(AGENDA_TABS.map(t => t.id));
      setActiveTab(AGENDA_TABS[0].id);
    }
  };

  const fetchAgendaRdvs = async (tabId: string) => {
    const tab = AGENDA_TABS.find(t => t.id === tabId);
    if (!tab) return;
    setAgendaLoading(true);
    try {
      const res = await fetch(`${API_URL}/confirmation2/${tab.endpoint}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (res.ok) setAgendaRdvs(await res.json());
    } catch {
      setAgendaRdvs([]);
    } finally {
      setAgendaLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const t = token();
      if (!t) { setError('Vous n\'êtes pas connecté.'); setLoading(false); return; }
      const response = await fetch(`${API_URL}/confirmation2/dashboard`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      if (response.status === 401) { setError('Session expirée.'); return; }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setData(await response.json());
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const updateStatut = async (rdvId: number) => {
    try {
      await fetch(`${API_URL}/confirmation2/rdv/${rdvId}/statut`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ statut: selectedStatut, commentaire })
      });
      setSelectedRdv(null); setSelectedStatut(''); setCommentaire('');
      fetchDashboard();
      if (activeTab) fetchAgendaRdvs(activeTab);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const visibleTabs = AGENDA_TABS.filter(t => myAgendas.length === 0 || myAgendas.includes(t.id));

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'CONFIRME': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">✅ Confirmé</span>;
      case 'ANNULE': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">❌ Annulé</span>;
      case 'REPORTER': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">⏰ Reporté</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">📝 Brut</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center text-red-500">
          <p>Erreur: {error}</p>
          <button onClick={fetchDashboard} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold">Service Confirmation</h1>
        <p className="text-gray-500">Bienvenue, {user?.name || 'Confirmatrice'}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200">
          <div className="flex items-center justify-center gap-2 mb-2"><Calendar className="w-5 h-5 text-blue-500" /></div>
          <div className="text-2xl font-bold text-blue-600">{data?.totalRdv || 0}</div>
          <div className="text-sm text-gray-600">Total RDV</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border border-green-200">
          <div className="flex items-center justify-center gap-2 mb-2"><CheckCircle className="w-5 h-5 text-green-500" /></div>
          <div className="text-2xl font-bold text-green-600">{data?.rdvConfirmes || 0}</div>
          <div className="text-sm text-gray-600">Confirmés</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 text-center border border-red-200">
          <div className="flex items-center justify-center gap-2 mb-2"><XCircle className="w-5 h-5 text-red-500" /></div>
          <div className="text-2xl font-bold text-red-600">{data?.rdvAnnules || 0}</div>
          <div className="text-sm text-gray-600">Annulés</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 text-center border border-yellow-200">
          <div className="flex items-center justify-center gap-2 mb-2"><Clock className="w-5 h-5 text-yellow-500" /></div>
          <div className="text-2xl font-bold text-yellow-600">{data?.rdvReportes || 0}</div>
          <div className="text-sm text-gray-600">Reportés</div>
        </div>
      </div>

      {/* Agenda Tabs */}
      {visibleTabs.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex border-b overflow-x-auto">
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
          {agendaLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left text-sm text-gray-500">Contact</th>
                    <th className="p-3 text-left text-sm text-gray-500">Téléphone</th>
                    <th className="p-3 text-left text-sm text-gray-500">Agent</th>
                    <th className="p-3 text-left text-sm text-gray-500">Date RDV</th>
                    <th className="p-3 text-left text-sm text-gray-500">Statut</th>
                    <th className="p-3 text-left text-sm text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {agendaRdvs.length > 0 ? agendaRdvs.map(rdv => (
                    <tr key={rdv.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{rdv.contactPrenom} {rdv.contactNom}</td>
                      <td className="p-3">{rdv.telephone}</td>
                      <td className="p-3">{rdv.agentNom}</td>
                      <td className="p-3">{new Date(rdv.dateRendezVous).toLocaleString()}</td>
                      <td className="p-3">{getStatutBadge(rdv.statut)}</td>
                      <td className="p-3"><button onClick={() => setSelectedRdv(rdv)} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">Qualifier</button></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">Aucun rendez-vous</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal qualification */}
      {selectedRdv && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b"><h3 className="text-lg font-semibold">Qualifier le rendez-vous</h3></div>
            <div className="p-6 space-y-5">
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div><span className="text-xs text-gray-500">Contact</span><p className="text-sm font-medium">{selectedRdv.contactPrenom} {selectedRdv.contactNom}</p></div>
                <div><span className="text-xs text-gray-500">Téléphone</span><p className="text-sm font-medium">{selectedRdv.telephone}</p></div>
                <div><span className="text-xs text-gray-500">Date RDV</span><p className="text-sm font-medium">{new Date(selectedRdv.dateRendezVous).toLocaleString()}</p></div>
              </div>
              <div><label className="block text-sm font-medium mb-2">Statut</label><select value={selectedStatut} onChange={(e) => setSelectedStatut(e.target.value)} className="w-full p-2 border rounded bg-white"><option value="">Sélectionner...</option><option value="CONFIRME">✅ Confirmé</option><option value="ANNULE">❌ Annulé</option><option value="REPORTER">⏰ Reporter</option></select></div>
              <div><label className="block text-sm font-medium mb-2">Commentaire</label><textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} className="w-full p-2 border rounded bg-white" rows={3} /></div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3"><button onClick={() => setSelectedRdv(null)} className="px-4 py-2 border rounded">Annuler</button><button onClick={() => updateStatut(selectedRdv.id)} disabled={!selectedStatut} className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50">Enregistrer</button></div>
          </div>
        </div>
      )}
    </div>
  );
}