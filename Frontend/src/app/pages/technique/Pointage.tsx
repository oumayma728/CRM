import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface PointageAgent {
  agentNom: string;
  jour: string;
  mois: string;
  premierAppel: string;
  dernierAppel: string;
}

interface PointageAdmin {
  nomComplet: string;
  role: string;
  jour: string;
  mois: string;
  sessionConnexion: string | null;
  sessionDeconnexion: string | null;
}

export default function Pointage() {
  const [agents,   setAgents]   = useState<PointageAgent[]>([]);
  const [admins,   setAdmins]   = useState<PointageAdmin[]>([]);
  const [date,     setDate]     = useState(new Date().toISOString().slice(0, 10));
  const [loading,  setLoading]  = useState(true);

  const token = () => localStorage.getItem('token');

  useEffect(() => { fetchPointage(); }, [date]);

  const fetchPointage = async () => {
    setLoading(true);
    try {
      const [resA, resB] = await Promise.all([
        fetch(`/api/technique/pointage?date=${date}`,       { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`/api/technique/pointage/admin?date=${date}`, { headers: { Authorization: `Bearer ${token()}` } }),
      ]);
      const dataA = await resA.json();
      const dataB = await resB.json();
      setAgents(dataA.pointages  || []);
      setAdmins(dataB.membres || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const roleLabel = (role: string) => {
    const map: Record<string, string> = {
      CONFIRMATRICE: 'Confirmatrice',
      ADMIN:         'Administration',
      QUALITE:       'Service qualité',
      TECH:          'Service technique',
      COMMERCIAL:    'Commercial',
    };
    return map[role] || role;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Pointage EBI</h1>
          <p className="text-gray-500 dark:text-gray-400">Suivi des heures d'activité</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">Date :</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {/* Pointage Agents */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="p-4 border-b dark:border-gray-700 font-semibold dark:text-white flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              Pointage agents
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {['Agent', 'Jour', 'Mois', 'Heure 1er appel', 'Heure dernier appel'].map(h => (
                    <th key={h} className="p-3 text-left text-gray-600 dark:text-gray-300 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agents.map((a, i) => (
                  <tr key={i} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40">
                    <td className="p-3 font-medium dark:text-white">{a.agentNom}</td>
                    <td className="p-3 dark:text-gray-300">{a.jour}</td>
                    <td className="p-3 dark:text-gray-300">{a.mois}</td>
                    <td className="p-3 dark:text-gray-300">{a.premierAppel}</td>
                    <td className="p-3 dark:text-gray-300">{a.dernierAppel}</td>
                  </tr>
                ))}
                {agents.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-500 dark:text-gray-400">Aucun pointage agent pour cette date</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pointage Membres Administration */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="p-4 border-b dark:border-gray-700 font-semibold dark:text-white">
              Pointage membres administration
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {['Rôle', 'Jour', 'Mois', 'Session connexion', 'Session déconnexion'].map(h => (
                    <th key={h} className="p-3 text-left text-gray-600 dark:text-gray-300 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {admins.map((m, i) => (
                  <tr key={i} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40">
                    <td className="p-3 font-medium dark:text-white">{roleLabel(m.role)}</td>
                    <td className="p-3 dark:text-gray-300">{m.jour}</td>
                    <td className="p-3 dark:text-gray-300">{m.mois}</td>
                    <td className="p-3 dark:text-gray-300">{m.sessionConnexion || '—'}</td>
                    <td className="p-3 dark:text-gray-300">{m.sessionDeconnexion || '—'}</td>
                  </tr>
                ))}
                {admins.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-500 dark:text-gray-400">Aucun membre trouvé</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
