import React, { useEffect, useState } from 'react';
import { Award, TrendingUp, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { api } from '../../../services/crmApi';

interface Commercial {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  totalRdv: number;
  rdvSignes: number;
  rdvNonSignes: number;
  rdvRefixes: number;
  r2: number;
  tauxSignature: number;
  chiffreAffaire: number;
}

export default function SuiviCommerciaux() {
  const [commerciaux, setCommerciaux] = useState<Commercial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommercial, setSelectedCommercial] = useState<Commercial | null>(null);

  useEffect(() => {
    fetchCommerciaux();
  }, []);

  const fetchCommerciaux = async () => {
    try {
      const response = await api.get('/confirmation-client/commerciaux');
      setCommerciaux(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (index: number) => {
    if (index === 0) return 'text-warning';
    if (index === 1) return 'text-muted-foreground';
    if (index === 2) return 'text-warning';
    return 'text-muted-foreground';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Suivi Commerciaux</h1>
        <p className="text-muted-foreground mt-1">Performance et statistiques des commerciaux</p>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary/10 to-primary/10 rounded-xl p-4 text-center border border-primary/30">
          <div className="text-2xl font-bold text-primary">{commerciaux.length}</div>
          <div className="text-sm text-muted-foreground mt-1">👔 Commerciaux</div>
        </div>
        <div className="bg-gradient-to-br from-success/10 to-success/10 rounded-xl p-4 text-center border border-success/30">
          <div className="text-2xl font-bold text-success">{commerciaux.reduce((s, c) => s + c.totalRdv, 0)}</div>
          <div className="text-sm text-muted-foreground mt-1">📋 Total RDV</div>
        </div>
        <div className="bg-gradient-to-br from-primary/10 to-primary/10 rounded-xl p-4 text-center border border-primary/30">
          <div className="text-2xl font-bold text-primary">{commerciaux.reduce((s, c) => s + c.rdvSignes, 0)}</div>
          <div className="text-sm text-muted-foreground mt-1">✅ RDV Signés</div>
        </div>
        <div className="bg-gradient-to-br from-warning/10 to-warning/10 rounded-xl p-4 text-center border border-warning/30">
          <div className="text-2xl font-bold text-warning">{Math.round(commerciaux.reduce((s, c) => s + c.tauxSignature, 0) / commerciaux.length)}%</div>
          <div className="text-sm text-muted-foreground mt-1">📊 Taux moyen</div>
        </div>
      </div>

      {/* Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {commerciaux.slice(0, 3).map((c, idx) => (
          <div key={c.id} className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 text-center">
            <div className="flex justify-center mb-2"><Award className={`w-10 h-10 ${getRankColor(idx)}`} /></div>
            <div className="font-bold text-lg">{c.prenom} {c.nom}</div>
            <div className="text-2xl font-bold text-primary mt-2">{c.tauxSignature}%</div>
            <div className="text-sm text-muted-foreground">Taux de signature</div>
          </div>
        ))}
      </div>

      {/* Tableau complet */}
      <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left">Commercial</th>
                <th className="p-3 text-center">RDV</th>
                <th className="p-3 text-center">Signés</th>
                <th className="p-3 text-center">Non Signés</th>
                <th className="p-3 text-center">À refixer</th>
                <th className="p-3 text-center">R2</th>
                <th className="p-3 text-center">Taux</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {commerciaux.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted transition">
                  <td className="p-3 font-medium">{c.prenom} {c.nom}</td>
                  <td className="p-3 text-center">{c.totalRdv}</td>
                  <td className="p-3 text-center text-success">{c.rdvSignes}</td>
                  <td className="p-3 text-center text-destructive">{c.rdvNonSignes || 0}</td>
                  <td className="p-3 text-center text-warning">{c.rdvRefixes || 0}</td>
                  <td className="p-3 text-center text-primary">{c.r2 || 0}</td>
                  <td className="p-3 text-center"><span className={`font-bold ${c.tauxSignature >= 50 ? 'text-success' : 'text-destructive'}`}>{c.tauxSignature}%</span></td>
                  <td className="p-3 text-center">
                    <button onClick={() => setSelectedCommercial(c)} className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition">Détails</button>
                  </td>
                </tr>
              ))}
              {commerciaux.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Aucun commercial trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal détails */}
      {selectedCommercial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-xl font-semibold text-foreground">{selectedCommercial.prenom} {selectedCommercial.nom}</h3>
              <p className="text-sm text-muted-foreground">Statistiques détaillées</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/10 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-primary">{selectedCommercial.totalRdv}</div><div className="text-xs text-muted-foreground">Total RDV</div></div>
                <div className="bg-success/10 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-success">{selectedCommercial.rdvSignes}</div><div className="text-xs text-muted-foreground">Signés</div></div>
                <div className="bg-destructive/10 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-destructive">{selectedCommercial.rdvNonSignes || 0}</div><div className="text-xs text-muted-foreground">Non Signés</div></div>
                <div className="bg-warning/10 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-warning">{selectedCommercial.rdvRefixes || 0}</div><div className="text-xs text-muted-foreground">À refixer</div></div>
                <div className="bg-primary/10 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-primary">{selectedCommercial.r2 || 0}</div><div className="text-xs text-muted-foreground">R2</div></div>
                <div className="bg-warning/10 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-warning">{selectedCommercial.tauxSignature}%</div><div className="text-xs text-muted-foreground">Taux signature</div></div>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between"><span className="text-muted-foreground">Chiffre d'affaires</span><span className="font-bold text-primary">{selectedCommercial.chiffreAffaire.toLocaleString()} €</span></div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end">
              <button onClick={() => setSelectedCommercial(null)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}