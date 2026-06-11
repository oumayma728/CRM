import React, { useEffect, useState } from 'react';
import { Calendar, Building, Phone, Users, UserCheck, CheckCircle, Briefcase, Banknote, TrendingUp } from 'lucide-react';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5241/api';

interface Rdv {
  id: number;
  contactNom: string;
  contactPrenom: string;
  telephone: string;
  email?: string;
  source: string;
  agentNom: string;
  dateRendezVous: string;
  statut: string;
  commentaire?: string;
  commentaireBanque?: string;
}

interface Commercial {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
}

export default function ConfirmationClientDashboard() {
  const [rdvs, setRdvs] = useState<Rdv[]>([]);
  const [commerciaux, setCommerciaux] = useState<Commercial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRdv, setSelectedRdv] = useState<Rdv | null>(null);
  const [selectedCommercial, setSelectedCommercial] = useState('');
  const [commentaireBanque, setCommentaireBanque] = useState('');

  useEffect(() => {
    fetchAgenda();
    fetchCommerciaux();
  }, []);

  const fetchAgenda = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/confirmation2/agenda`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setRdvs(data);
      setError(null);
    } catch (error: any) {
      console.error('Erreur fetchAgenda:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommerciaux = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/confirmation2/commerciaux`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setCommerciaux(data);
    } catch (error) {
      console.error('Erreur fetchCommerciaux:', error);
    }
  };

  const assignerCommercial = async (rdvId: number) => {
    if (!selectedCommercial) {
      alert('Veuillez sélectionner un commercial');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      await fetch(`${API_URL}/confirmation2/rdv/${rdvId}/assigner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ commercialId: parseInt(selectedCommercial) })
      });
      
      if (commentaireBanque) {
        await fetch(`${API_URL}/confirmation2/rdv/${rdvId}/banque`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ commentaireBanque })
        });
      }
      
      setSelectedRdv(null);
      setSelectedCommercial('');
      setCommentaireBanque('');
      fetchAgenda();
      alert('Rendez-vous assigné avec succès !');
    } catch (error) {
      console.error('Erreur assignerCommercial:', error);
      alert('Erreur lors de l\'assignation');
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'CONFIRME': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle size={12} />Confirmé</span>;
      case 'ANNULE': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">❌ Annulé</span>;
      case 'REPORTER': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">⏰ Reporter</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">{statut}</span>;
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
        <div className="text-center text-red-500 bg-white rounded-lg shadow p-6">
          <p className="font-semibold">⚠️ Erreur de connexion au serveur</p>
          <p className="text-sm mt-2">{error}</p>
          <button 
            onClick={() => { fetchAgenda(); fetchCommerciaux(); }}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
          >
            🔄 Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Service Confirmation Client</h1>
        <p className="text-gray-500 mt-1">Gestion des rendez-vous et attribution aux commerciaux</p>
      </div>

      {/* Statistiques - Version améliorée */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 text-center border border-blue-200 shadow-sm">
          <div className="flex items-center justify-center mb-2">
            <Calendar size={28} className="text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-blue-600">{rdvs.length}</div>
          <div className="text-sm text-gray-600 mt-1">📋 RDV à traiter</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 text-center border border-green-200 shadow-sm">
          <div className="flex items-center justify-center mb-2">
            <Users size={28} className="text-green-500" />
          </div>
          <div className="text-3xl font-bold text-green-600">{commerciaux.length}</div>
          <div className="text-sm text-gray-600 mt-1">👔 Commerciaux actifs</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 text-center border border-purple-200 shadow-sm">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle size={28} className="text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-purple-600">{rdvs.filter(r => r.statut === 'CONFIRME').length}</div>
          <div className="text-sm text-gray-600 mt-1">✅ RDV confirmés</div>
        </div>
      </div>

      {/* Liste des RDV - Version améliorée avec cartes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700">📋 Rendez-vous à traiter</h2>
          <span className="text-sm text-gray-500">{rdvs.length} rendez-vous</span>
        </div>
        
        {rdvs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-md border border-gray-100">
            <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
            <p>Aucun rendez-vous à traiter</p>
            <p className="text-sm mt-1">Tous les rendez-vous ont été assignés</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {rdvs.map((rdv) => (
              <div key={rdv.id} className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-all duration-200 border border-gray-100">
                {/* En-tête */}
                <div className="flex justify-between items-start mb-4 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Building size={18} className="text-primary" />
                    <span className="font-semibold text-gray-800">{rdv.source}</span>
                  </div>
                  {getStatutBadge(rdv.statut)}
                </div>
                
                {/* Informations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Users size={16} className="text-gray-400 mt-0.5" />
                      <div>
                        <span className="text-gray-400 text-xs block">Contact</span>
                        <span className="font-medium text-gray-800">{rdv.contactPrenom} {rdv.contactNom}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone size={16} className="text-gray-400 mt-0.5" />
                      <div>
                        <span className="text-gray-400 text-xs block">Téléphone</span>
                        <span className="text-gray-800">{rdv.telephone}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users size={16} className="text-gray-400 mt-0.5" />
                      <div>
                        <span className="text-gray-400 text-xs block">Agent</span>
                        <span className="text-gray-800">{rdv.agentNom || '-'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Calendar size={16} className="text-gray-400 mt-0.5" />
                      <div>
                        <span className="text-gray-400 text-xs block">Date du rendez-vous</span>
                        <span className="font-medium text-gray-800">{new Date(rdv.dateRendezVous).toLocaleString()}</span>
                      </div>
                    </div>
                    {rdv.commentaireBanque && (
                      <div className="flex items-start gap-2">
                        <Banknote size={16} className="text-gray-400 mt-0.5" />
                        <div>
                          <span className="text-gray-400 text-xs block">Commentaire banque</span>
                          <span className="text-gray-800 text-sm">{rdv.commentaireBanque}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Bouton d'action */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => setSelectedRdv(rdv)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <Briefcase size={16} />
                    Assigner à un commercial
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal assignation commercial - Améliorée */}
      {selectedRdv && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* En-tête */}
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Assigner le rendez-vous</h3>
              <p className="text-sm text-gray-500 mt-1">
                {selectedRdv.contactPrenom} {selectedRdv.contactNom}
              </p>
            </div>

            {/* Corps */}
            <div className="p-6 space-y-5">
              {/* Informations */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">{selectedRdv.telephone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">{new Date(selectedRdv.dateRendezVous).toLocaleString()}</span>
                </div>
              </div>

              {/* Sélection commercial */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  👔 Sélectionner un commercial
                </label>
                <select
                  value={selectedCommercial}
                  onChange={(e) => setSelectedCommercial(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white text-gray-900"
                >
                  <option value="" className="text-gray-500">-- Choisir un commercial --</option>
                  {commerciaux.map((c) => (
                    <option key={c.id} value={c.id} className="text-gray-800">
                      {c.prenom} {c.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Commentaire banque */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💰 Commentaire banque (optionnel)
                </label>
                <textarea
                  value={commentaireBanque}
                  onChange={(e) => setCommentaireBanque(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white text-gray-900"
                  rows={3}
                  placeholder="Ajouter un commentaire pour la banque..."
                />
              </div>
            </div>

            {/* Boutons */}
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedRdv(null);
                  setSelectedCommercial('');
                  setCommentaireBanque('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={() => assignerCommercial(selectedRdv.id)}
                disabled={!selectedCommercial}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                <CheckCircle size={16} />
                Assigner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}