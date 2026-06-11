import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Statistiques {
  totalRdv: number;
  rdvConfirmes: number;
  rdvAnnules: number;
  rdvNonSignes: number;
  rdvSignes: number;
  r2: number;
  okFinancement: number;
  rdvAReporter: number;
  pose: number;
  statistiquesParJour: { date: string; confirmes: number; annules: number }[];
}

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export default function StatistiquesGlobales() {
  const [stats, setStats] = useState<Statistiques | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('mois');

  useEffect(() => {
    fetchStats();
  }, [selectedPeriod]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/confirmation1/statistiques?periode=${selectedPeriod}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = stats ? [
    { name: 'Confirmés', value: stats.rdvConfirmes },
    { name: 'Annulés', value: stats.rdvAnnules },
    { name: 'Non Signés', value: stats.rdvNonSignes },
    { name: 'Signés', value: stats.rdvSignes },
    { name: 'Reportés', value: stats.rdvAReporter }
  ] : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Statistiques Globales</h1>
          <p className="text-gray-500">Analyse des performances globales</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSelectedPeriod('semaine')} className={`px-3 py-1 rounded ${selectedPeriod === 'semaine' ? 'bg-primary text-white' : 'bg-gray-200'}`}>Semaine</button>
          <button onClick={() => setSelectedPeriod('mois')} className={`px-3 py-1 rounded ${selectedPeriod === 'mois' ? 'bg-primary text-white' : 'bg-gray-200'}`}>Mois</button>
          <button onClick={() => setSelectedPeriod('trimestre')} className={`px-3 py-1 rounded ${selectedPeriod === 'trimestre' ? 'bg-primary text-white' : 'bg-gray-200'}`}>Trimestre</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><Calendar size={20} /><span className="text-sm text-gray-500">Total RDV</span></div>
          <div className="text-2xl font-bold">{stats?.totalRdv || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><CheckCircle size={20} /><span className="text-sm text-gray-500">Taux Conversion</span></div>
          <div className="text-2xl font-bold">{stats?.totalRdv ? Math.round(stats.rdvConfirmes / stats.totalRdv * 100) : 0}%</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-purple-500 mb-2"><DollarSign size={20} /><span className="text-sm text-gray-500">Taux Signature</span></div>
          <div className="text-2xl font-bold">{stats?.rdvConfirmes ? Math.round(stats.rdvSignes / stats.rdvConfirmes * 100) : 0}%</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-yellow-500 mb-2"><Clock size={20} /><span className="text-sm text-gray-500">Taux Report</span></div>
          <div className="text-2xl font-bold">{stats?.totalRdv ? Math.round(stats.rdvAReporter / stats.totalRdv * 100) : 0}%</div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-4">Évolution des RDV</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.statistiquesParJour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="confirmes" name="Confirmés" stroke="#22c55e" strokeWidth={2} />
              <Line type="monotone" dataKey="annules" name="Annulés" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-4">Répartition des RDV</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tableau détaillé */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b font-semibold">Détail par statut</div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              <tr className="border-t"><td className="p-3 font-medium">Rendez-vous confirmés</td><td className="p-3 text-right text-green-600 font-bold">{stats?.rdvConfirmes || 0}</td></tr>
              <tr className="border-t"><td className="p-3 font-medium">Rendez-vous annulés</td><td className="p-3 text-right text-red-600 font-bold">{stats?.rdvAnnules || 0}</td></tr>
              <tr className="border-t"><td className="p-3 font-medium">Rendez-vous non signés</td><td className="p-3 text-right text-orange-600 font-bold">{stats?.rdvNonSignes || 0}</td></tr>
              <tr className="border-t"><td className="p-3 font-medium">Rendez-vous signés</td><td className="p-3 text-right text-blue-600 font-bold">{stats?.rdvSignes || 0}</td></tr>
              <tr className="border-t"><td className="p-3 font-medium">Rendez-vous R2</td><td className="p-3 text-right text-purple-600 font-bold">{stats?.r2 || 0}</td></tr>
              <tr className="border-t"><td className="p-3 font-medium">OK Financement</td><td className="p-3 text-right text-green-600 font-bold">{stats?.okFinancement || 0}</td></tr>
              <tr className="border-t"><td className="p-3 font-medium">Rendez-vous à reporter</td><td className="p-3 text-right text-yellow-600 font-bold">{stats?.rdvAReporter || 0}</td></tr>
              <tr className="border-t"><td className="p-3 font-medium">Pose</td><td className="p-3 text-right text-gray-600 font-bold">{stats?.pose || 0}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}