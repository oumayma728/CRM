import { API_BASE, getToken } from '../../services/api';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, FileText, ClipboardCheck, Clock,
  Shield, Calendar, Star, TrendingUp, AlertCircle
} from 'lucide-react';

const API_URL = API_BASE;

interface DashboardData {
  agentsTotal: number;
  fichiersTotal: number;
  evalTotal: number;
  pointagesAujourd: number;
  evalsRecentes: { agentNom: string; noteGlobale: number; date: string }[];
}

const noteColor = (n: number) =>
  n >= 8 ? 'text-success' : n >= 6 ? 'text-warning' : 'text-destructive';

const quickLinks = [
  { to: '/technique/agents',     icon: Users,         label: 'Liste des Agents',   color: 'bg-primary' },
  { to: '/technique/fichiers',   icon: FileText,      label: 'Fichier des contacts', color: 'bg-primary' },
  { to: '/technique/pointage',   icon: Clock,         label: 'Pointage',           color: 'bg-warning' },
  { to: '/technique/acces',      icon: Shield,        label: 'Gérer accès',        color: 'bg-destructive' },
  { to: '/technique/calendrier', icon: Calendar,      label: 'Compte calendrier',  color: 'bg-success' },
  { to: '/technique/evaluation', icon: Star,          label: 'Évaluation',         color: 'bg-warning' },
];

export default function TechniqueDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    fetch(`${API_URL}/technique/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Service Technique</h1>
        <p className="text-muted-foreground text-sm">
          Vue d'ensemble — infrastructure & supervision
        </p>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-xl p-4">
          <AlertCircle size={18} />
          <span className="text-sm">Erreur de chargement : {error}</span>
        </div>
      ) : data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Agents actifs',     value: data.agentsTotal,      icon: Users,          color: 'text-primary bg-primary/15' },
            { label: 'Fichiers importés', value: data.fichiersTotal,    icon: FileText,       color: 'text-primary bg-primary/15' },
            { label: 'Évaluations',       value: data.evalTotal,        icon: ClipboardCheck, color: 'text-warning bg-warning/15' },
            { label: "Pointages aujourd'hui", value: data.pointagesAujourd, icon: Clock,      color: 'text-warning bg-warning/15 ' },
          ].map(s => (
            <div key={s.label} className="glass-card p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <span className={`p-2 rounded-lg ${s.color}`}>
                  <s.icon size={16} />
                </span>
              </div>
              <p className="text-3xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Accès rapide */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b font-semibold flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            Accès rapide
          </div>
          <div className="grid grid-cols-2 gap-3 p-4">
            {quickLinks.map(q => (
              <Link
                key={q.to}
                to={q.to}
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted transition-colors group"
              >
                <span className={`${q.color} p-2 rounded-lg text-white flex-shrink-0`}>
                  <q.icon size={14} />
                </span>
                <span className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                  {q.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Évaluations récentes */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b font-semibold flex items-center gap-2">
            <Star size={16} className="text-warning" />
            Évaluations récentes
          </div>
          {loading ? (
            <div className="p-6 text-center text-muted-foreground text-sm">Chargement...</div>
          ) : !data?.evalsRecentes?.length ? (
            <div className="p-6 text-center text-muted-foreground text-sm">Aucune évaluation</div>
          ) : (
            <div className="divide-y">
              {data.evalsRecentes.map((e, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium text-sm">{e.agentNom}</p>
                    <p className="text-xs text-muted-foreground">{e.date}</p>
                  </div>
                  <span className={`text-lg font-bold ${noteColor(e.noteGlobale)}`}>
                    {e.noteGlobale}/10
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="p-3 border-t">
            <Link
              to="/technique/evaluation"
              className="text-xs text-primary hover:underline"
            >
              Voir toutes les évaluations →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
