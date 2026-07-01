import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { adminService } from '../../../services/adminService';
import { Clock, Coffee, LogIn, Calendar, AlertCircle } from 'lucide-react';

interface PointageDetail {
  agentNom: string;
  arrivee: string;
  premierAppel: string;
  dernierAppel: string;
  depart: string;
  pauses: string;
  tempsProductif: string;
  statut: string;
}

interface PointageData {
  presents: number;
  totalAgents: number;
  retards: number;
  tempsMoyen: string;
  pausesMoyennes: string;
  details: PointageDetail[];
}

export default function PointagePage() {
  const [pointage, setPointage] = useState<PointageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchPointage = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminService.getPointage(selectedDate);
        setPointage(response.data);
      } catch (err) {
        console.error('Erreur chargement pointage:', err);
        setError('Impossible de charger les données de pointage. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };
    fetchPointage();
  }, [selectedDate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </Layout>
    );
  }

  if (!pointage) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Aucune donnée de pointage disponible</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rapport de Pointage</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Suivi de la présence et du temps de travail</p>
        </div>

        {/* Sélecteur de date */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Présents</h3>
              <LogIn className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{pointage.presents}/{pointage.totalAgents}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Retards</h3>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{pointage.retards}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Temps moyen</h3>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{pointage.tempsMoyen}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pauses moyennes</h3>
              <Coffee className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{pointage.pausesMoyennes}</p>
          </div>
        </div>

        {/* Tableau détaillé */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Détail du pointage du {new Date(selectedDate).toLocaleDateString('fr-FR')}</h2>
          </div>
          {pointage.details.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              Aucun pointage enregistré pour cette date
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Agent</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Arrivée</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Premier appel</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Dernier appel</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Départ</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Pauses</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Temps productif</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {pointage.details.map((detail, idx) => (
                    <tr key={idx} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="p-4 font-medium text-gray-900 dark:text-white">{detail.agentNom}</td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">{detail.arrivee}</td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">{detail.premierAppel}</td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">{detail.dernierAppel}</td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">{detail.depart}</td>
                      <td className="p-4 text-yellow-600 dark:text-yellow-400">{detail.pauses}</td>
                      <td className="p-4 text-green-600 dark:text-green-400 font-medium">{detail.tempsProductif}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          detail.statut === 'Retard' 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {detail.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}