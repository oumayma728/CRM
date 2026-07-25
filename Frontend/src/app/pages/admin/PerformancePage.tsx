import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Phone, Calendar, Target, AlertCircle, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../../../services/api';

interface PerfData {
  currentMonth: { totalCalls: number; conversions: number; conversionRate: number; refusals: number; refusalRate: number; avgDuration: number };
  previousMonth: { totalCalls: number; conversions: number; conversionRate: number; refusals: number; refusalRate: number; avgDuration: number };
  evolution: { totalCalls: number; conversions: number; conversionRate: number; refusalRate: number; avgDuration: number };
  monthlyData: { month: string; calls: number; conversions: number; refusals: number }[];
  rendementStatus: string;
  mistakes: string[];
}

export default function PerformancePage() {
  const [data, setData] = useState<PerfData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/performance/comparison')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  const statCard = (label: string, current: number, previous: number, evo: number, unit = '') => (
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold">{current}{unit}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-muted-foreground">Mois préc. {previous}{unit}</span>
        <span className={`text-xs font-medium flex items-center gap-0.5 ${evo >= 0 ? 'text-success' : 'text-destructive'}`}>
          {evo >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(evo)}%
        </span>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Performance des appels</h1>
        {data && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${data.rendementStatus === 'augmenté' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
            Rendement {data.rendementStatus}
          </span>
        )}
      </div>

      {data?.mistakes.map((m, i) => (
        <div key={i} className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-sm text-destructive">{m}</p>
        </div>
      ))}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data && (
          <>
            {statCard('Appels', data.currentMonth.totalCalls, data.previousMonth.totalCalls, data.evolution.totalCalls)}
            {statCard('Conversions', data.currentMonth.conversions, data.previousMonth.conversions, data.evolution.conversions)}
            {statCard('Taux conversion', data.currentMonth.conversionRate, data.previousMonth.conversionRate, data.evolution.conversionRate, '%')}
            {statCard('Refus', data.currentMonth.refusalRate, data.previousMonth.refusalRate, data.evolution.refusalRate, '%')}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Phone className="w-4 h-4" /> Appels mensuels</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data?.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="calls" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Target className="w-4 h-4" /> Conversions mensuelles</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data?.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="conversions" stroke="var(--color-success)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
