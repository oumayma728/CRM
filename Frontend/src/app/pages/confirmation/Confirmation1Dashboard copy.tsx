import React, { useEffect, useState } from 'react';
// NE PAS importer Layout ici car il est déjà dans la route
// import { Layout } from '../../components/Layout';
import { Calendar, Users, Phone, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5241/api';

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

export default function Confirmation1Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRdv, setSelectedRdv] = useState<Rdv | null>(null);
  const [selectedStatut, setSelectedStatut] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token);
      
      if (!token) {
        console.warn('⚠️ Aucun token trouvé dans localStorage');
        setError('Vous n\'êtes pas connecté. Veuillez vous identifier.');
        setLoading(false);
        return;
      }
      
      console.log('URL:', `${API_URL}/confirmation1/dashboard`);
      
      const response = await fetch(`${API_URL}/confirmation1/dashboard`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (response.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        // Optionnel: rediriger vers login
        // window.location.href = '/login';
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Dashboard data:', result);
      setData(result);
      setError(null);
    } catch (error: any) {
      console.error('Erreur:', error);
      setError(error.message || 'Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const updateStatut = async (rdvId: number) => {
    try {
      const response = await fetch(`${API_URL}/confirmation1/rdv/${rdvId}/statut`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ statut: selectedStatut, commentaire })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }
      
      setSelectedRdv(null);
      setSelectedStatut('');
      setCommentaire('');
      fetchDashboard();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'CONFIRME': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Confirmé</span>;
      case 'ANNULE': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">Annulé</span>;
      case 'REPORTER': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">Reporté</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">Brut</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center text-red-500">
          <p>Erreur: {error}</p>
          <button 
            onClick={fetchDashboard}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Service Confirmation</h1>
        <p className="text-gray-500">Bienvenue, {user?.name || 'Confirmatrice'}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span className="text-gray-500">Total RDV</span>
          </div>
          <div className="text-2xl font-bold">{data?.totalRdv || 0}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-gray-500">Confirmés</span>
          </div>
          <div className="text-2xl font-bold">{data?.rdvConfirmes || 0}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-gray-500">Annulés</span>
          </div>
          <div className="text-2xl font-bold">{data?.rdvAnnules || 0}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-gray-500">Reportés</span>
          </div>
          <div className="text-2xl font-bold">{data?.rdvReportes || 0}</div>
        </div>
      </div>

      {/* Tableau des RDV */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 font-semibold">
          Liste des rendez-vous à traiter
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-left">Téléphone</th>
                <th className="p-3 text-left">Agent</th>
                <th className="p-3 text-left">Date RDV</th>
                <th className="p-3 text-left">Statut</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {data?.rdvRecents && data.rdvRecents.length > 0 ? (
                data.rdvRecents.map((rdv) => (
                  <tr key={rdv.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3">{rdv.contactPrenom} {rdv.contactNom}</td>
                    <td className="p-3">{rdv.telephone}</td>
                    <td className="p-3">{rdv.agentNom}</td>
                    <td className="p-3">{new Date(rdv.dateRendezVous).toLocaleString()}</td>
                    <td className="p-3">{getStatutBadge(rdv.statut)}</td>
                    <td className="p-3">
                      <button
                        onClick={() => setSelectedRdv(rdv)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        Qualifier
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Aucun rendez-vous à afficher
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal qualification RDV */}
      {selectedRdv && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Qualifier le rendez-vous</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Statut</label>
                <select
                  value={selectedStatut}
                  onChange={(e) => setSelectedStatut(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">Sélectionner...</option>
                  <option value="CONFIRME">Confirmé</option>
                  <option value="ANNULE">Annulé</option>
                  <option value="REPORTER">Reporter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Commentaire</label>
                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  rows={3}
                  placeholder="Motif du refus ou information complémentaire..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setSelectedRdv(null)}
                  className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={() => updateStatut(selectedRdv.id)}
                  disabled={!selectedStatut}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}