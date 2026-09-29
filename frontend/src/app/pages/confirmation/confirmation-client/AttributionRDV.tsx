import { API_BASE, getToken } from '../../../services/api';
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
      const response = await fetch(`${API_BASE}/confirmation2/agenda`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setRdvs(data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchCommerciaux = async () => {
    try {
      const response = await fetch(`${API_BASE}/confirmation2/commerciaux`, {
        headers: { Authorization: `Bearer ${getToken()}` }
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
      await fetch(`${API_BASE}/confirmation2/rdv/${selectedRdv}/assigner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
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
        <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Attribution des rendez-vous</h1>
        <p className="text-muted-foreground">Assigner les rendez-vous aux commerciaux</p>
      </div>

      <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left text-foreground">Contact</th>
                <th className="p-3 text-left text-foreground">Téléphone</th>
                <th className="p-3 text-left text-foreground">Date RDV</th>
                <th className="p-3 text-left text-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {rdvs.map((rdv) => (
                <tr key={rdv.id} className="border-t hover:bg-muted">
                  <td className="p-3 font-medium">{rdv.contactPrenom} {rdv.contactNom}</td>
                  <td className="p-3">{rdv.telephone}</td>
                  <td className="p-3">{new Date(rdv.dateRendezVous).toLocaleString()}</td>
                  <td className="p-3">
                    <button
                      onClick={() => setSelectedRdv(rdv.id)}
                      className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm hover:bg-primary/90"
                    >
                      Assigner
                    </button>
                  </td>
                </tr>
              ))}
              {rdvs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
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
          <div className="glass-card p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Assigner à un commercial</h3>
            <select
              value={selectedCommercial}
              onChange={(e) => setSelectedCommercial(e.target.value)}
              className="w-full p-2 border border-border rounded mb-4 bg-card text-foreground"
            >
              <option value="">Sélectionner...</option>
              {commerciaux.map((c) => (
                <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedRdv(null)}
                className="px-4 py-2 border border-border rounded text-foreground hover:bg-muted"
              >
                Annuler
              </button>
              <button
                onClick={assigner}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Assigner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
