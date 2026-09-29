import { API_BASE, getToken } from '../../../services/api';
import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

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

const COLORS = ['var(--color-chart-4)', 'var(--color-chart-5)', 'var(--color-chart-3)', 'var(--color-chart-1)', 'var(--color-chart-1)'];

export default function StatistiquesGlobales() {
  const [stats, setStats]           = useState<Statistiques | null>(null);
  const [loading, setLoading]       = useState(true);
  const [selectedPeriod, setPeriod] = useState('mois');

  useEffect(() => { fetchStats(); }, [selectedPeriod]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/confirmation1/statistiques?periode=${selectedPeriod}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setStats(await res.json());
    } catch (e) { console.error('Erreur:', e); }
    finally { setLoading(false); }
  };

  const pieData = stats ? [
    { name: 'Confirmés',  value: stats.rdvConfirmes  },
    { name: 'Annulés',    value: stats.rdvAnnules    },
    { name: 'Non Signés', value: stats.rdvNonSignes  },
    { name: 'Signés',     value: stats.rdvSignes     },
    { name: 'Reportés',   value: stats.rdvAReporter  },
  ] : [];

  const PERIODS = [
    { key: 'semaine', label: 'Semaine' },
    { key: 'mois',    label: 'Mois'    },
    { key: 'trimestre', label: 'Trimestre' },
  ];

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Statistiques Globales</h1>
          <p className="text-muted-foreground">Analyse des performances globales</p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                selectedPeriod === p.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted'
              }`}
            >{p.label}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Calendar size={18}/>, color:'text-primary',   label:'Total RDV',
            value: stats?.totalRdv || 0 },
          { icon: <CheckCircle size={18}/>, color:'text-success', label:'Taux Conversion',
            value: stats?.totalRdv ? Math.round(stats.rdvConfirmes/stats.totalRdv*100)+'%' : '0%' },
          { icon: <DollarSign size={18}/>, color:'text-primary', label:'Taux Signature',
            value: stats?.rdvConfirmes ? Math.round(stats.rdvSignes/stats.rdvConfirmes*100)+'%' : '0%' },
          { icon: <Clock size={18}/>, color:'text-warning', label:'Taux Report',
            value: stats?.totalRdv ? Math.round((stats.rdvAReporter||0)/stats.totalRdv*100)+'%' : '0%' },
        ].map(({ icon, color, label, value }) => (
          <div key={label} className="glass-card p-4">
            <div className={`flex items-center gap-2 ${color} mb-2`}>
              {icon}
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
            <div className="text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-4">
          <h3 className="font-semibold mb-4">Évolution des RDV</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats?.statistiquesParJour}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, color: '#fff' }} />
              <Legend />
              <Line type="monotone" dataKey="confirmes" name="Confirmés" stroke="var(--color-chart-4)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="annules"   name="Annulés"   stroke="var(--color-chart-5)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-4">
          <h3 className="font-semibold mb-4">Répartition des RDV</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%" cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }) => percent > 0 ? `${name}: ${(percent*100).toFixed(0)}%` : ''}
              >
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, color: '#fff' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tableau détaillé */}
      <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
        <div className="p-4 border-b font-semibold">Détail par statut</div>
        <table className="w-full text-sm">
          <tbody>
            {[
              { label: 'Rendez-vous confirmés',   val: stats?.rdvConfirmes, cls: 'text-success'  },
              { label: 'Rendez-vous annulés',     val: stats?.rdvAnnules,   cls: 'text-destructive'    },
              { label: 'Rendez-vous non signés',  val: stats?.rdvNonSignes, cls: 'text-warning' },
              { label: 'Rendez-vous signés',      val: stats?.rdvSignes,    cls: 'text-primary'   },
              { label: 'Rendez-vous R2',          val: stats?.r2,           cls: 'text-primary' },
              { label: 'OK Financement',          val: stats?.okFinancement,cls: 'text-success'  },
              { label: 'Rendez-vous à reporter',  val: stats?.rdvAReporter, cls: 'text-warning' },
              { label: 'Pose',                    val: stats?.pose,         cls: 'text-muted-foreground'   },
            ].map(({ label, val, cls }) => (
              <tr key={label} className="border-t hover:bg-muted">
                <td className="p-3 font-medium">{label}</td>
                <td className={`p-3 text-right font-bold ${cls}`}>{val ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
