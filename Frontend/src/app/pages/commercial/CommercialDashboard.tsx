import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Stats {
  mois: number; annee: number; totalRdv: number;
  signes: number; nonSignes: number; installes: number;
  r2: number; nRP: number; portes: number; annules: number; reportes: number;
  tauxSignature: number;
}
interface StatMois { mois: number; total: number; signes: number; nonSignes: number; installes: number; r2: number; }

const MONTH_NAMES = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

export default function CommercialDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [historique, setHistorique] = useState<StatMois[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${API_URL}/api/commercial/stats`, { headers: h }),
      axios.get(`${API_URL}/api/commercial/stats/historique`, { headers: h }),
    ])
      .then(([sRes, hRes]) => { setStats(sRes.data); setHistorique(hRes.data); })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    </Layout>
  );

  if (error || !stats) return (
    <Layout>
      <div className="flex items-center gap-2 text-destructive p-4">
        <AlertCircle className="w-5 h-5" /> {error || 'Erreur'}
      </div>
    </Layout>
  );

  const chartData = historique.map(h => ({
    name: MONTH_NAMES[h.mois - 1],
    Signés: h.signes, 'Non signés': h.nonSignes, Installés: h.installes, R2: h.r2
  }));

  const statCards = [
    { label: 'RDV ce mois', value: stats.totalRdv, color: 'text-primary', bg: 'bg-primary/10', icon: <RefreshCw className="w-5 h-5 text-primary" /> },
    { label: 'Signés', value: stats.signes, color: 'text-green-600', bg: 'bg-green-500/10', icon: <CheckCircle className="w-5 h-5 text-green-600" /> },
    { label: 'Non signés', value: stats.nonSignes, color: 'text-red-600', bg: 'bg-red-500/10', icon: <XCircle className="w-5 h-5 text-red-600" /> },
    { label: 'Installés', value: stats.installes, color: 'text-blue-600', bg: 'bg-blue-500/10', icon: <TrendingUp className="w-5 h-5 text-blue-600" /> },
    { label: 'Taux signature', value: `${stats.tauxSignature}%`, color: 'text-yellow-600', bg: 'bg-yellow-500/10', icon: <TrendingUp className="w-5 h-5 text-yellow-600" /> },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Bonjour, {user?.prenom} {user?.nom}
          </h1>
          <p className="text-muted-foreground">Tableau de bord commercial — {MONTH_NAMES[(stats.mois || 1) - 1]} {stats.annee}</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statCards.map(c => (
            <div key={c.label} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${c.bg}`}>{c.icon}</div>
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Détail statuts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'R2', value: stats.r2 },
            { label: 'NRP', value: stats.nRP },
            { label: 'Porte', value: stats.portes },
            { label: 'Annulés', value: stats.annules },
          ].map(c => (
            <div key={c.label} className="bg-card border border-border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="text-sm text-muted-foreground">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Historique graphe */}
        {chartData.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="font-semibold mb-4">Évolution annuelle</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="Signés" fill="#22c55e" radius={[3,3,0,0]} />
                <Bar dataKey="Non signés" fill="#ef4444" radius={[3,3,0,0]} />
                <Bar dataKey="Installés" fill="#3b82f6" radius={[3,3,0,0]} />
                <Bar dataKey="R2" fill="#f59e0b" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Layout>
  );
}
