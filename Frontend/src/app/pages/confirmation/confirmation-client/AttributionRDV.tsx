import React, { useEffect, useState } from 'react';

interface Rdv {
  id: number;
  contactNom: string;
  contactPrenom: string;
  telephone: string;
  dateRendezVous: string;
}

interface Commercial {
  id: number;
  nom: string;
  prenom: string;
}

export default function AttributionRDV() {
  const [rdvs, setRdvs] = useState<Rdv[]>([]);
  const [commerciaux, setCommerciaux] = useState<Commercial[]>([]);
  const [selectedRdv, setSelectedRdv] = useState<number | null>(null);
  const [selectedCommercial, setSelectedCommercial] = useState('');

  useEffect(() => {
    fetchRdvs();
    fetchCommerciaux();
  }, []);

  const fetchRdvs = async () => {
    try {
      const response = await fetch('/api/confirmation2/agenda', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setRdvs(data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchCommerciaux = async () => {
    try {
      const response = await fetch('/api/confirmation2/commerciaux', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setCommerciaux(data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const assigner = async () => {
    if (!selectedRdv || !selectedCommercial) return;
    try {
      await fetch(`/api/confirmation2/rdv/${selectedRdv}/assigner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ commercialId: parseInt(selectedCommercial) })
      });
      setSelectedRdv(null);
      setSelectedCommercial('');
      fetchRdvs();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attribution des rendez-vous</h1>
        <p className="text-gray-500">Assigner les rendez-vous aux commerciaux</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-left">Téléphone</th>
                <th className="p-3 text-left">Date RDV</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {rdvs.map((rdv) => (
                <tr key={rdv.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{rdv.contactPrenom} {rdv.contactNom}</td>
                  <td className="p-3">{rdv.telephone}</td>
                  <td className="p-3">{new Date(rdv.dateRendezVous).toLocaleString()}</td>
                  <td className="p-3">
                    <button
                      onClick={() => setSelectedRdv(rdv.id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Assigner
                    </button>
                  </td>
                </tr>
              ))}
              {rdvs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    Aucun rendez-vous à assigner
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedRdv && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Assigner à un commercial</h3>
            <select
              value={selectedCommercial}
              onChange={(e) => setSelectedCommercial(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            >
              <option value="">Sélectionner...</option>
              {commerciaux.map((c) => (
                <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setSelectedRdv(null)} className="px-4 py-2 border rounded">Annuler</button>
              <button onClick={assigner} className="px-4 py-2 bg-blue-500 text-white rounded">Assigner</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}