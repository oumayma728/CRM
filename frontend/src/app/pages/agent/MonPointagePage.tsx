import React, { useEffect, useState } from 'react';
import AttendanceWidget from '../../components/crm/AttendanceWidget';
import api from '../../services/crmApi';
import { Calendar, Clock, Coffee, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BreakRecord {
  id: number;
  type: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
}

interface DayRecord {
  id: number;
  date: string;
  clockIn: string;
  clockOut: string;
  status: string;
  tempsProductif: string;
  totalBreakMinutes: number;
  retardMinutes: number;
  estEnRetard: boolean;
  penaliteSalaire: number;
  breaks: BreakRecord[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const BREAK_LABEL: Record<string, string> = {
  cafe: '☕ Café', dejeuner: '🍽️ Déjeuner', priere: '🕌 Prière',
  technique: '🔧 Technique', personnelle: '💭 Permission',
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });

const statusBadge = (status: string) => {
  switch (status) {
    case 'active':    return 'bg-success/15 text-success';
    case 'break':     return 'bg-warning/15 text-warning';
    case 'completed': return 'bg-muted text-muted-foreground';
    default:          return 'bg-muted text-muted-foreground';
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'active':    return 'En activité';
    case 'break':     return 'En pause';
    case 'completed': return 'Terminé';
    default:          return status;
  }
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function MonPointagePage() {
  const [history, setHistory] = useState<DayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    api.get('/attendance/me/history?days=30')
      .then(r => setHistory(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Stats summary
  const completedDays = history.filter(d => d.status === 'completed').length;
  const totalBreakMins = history.reduce((s, d) => s + d.totalBreakMinutes, 0);
  const avgBreak = completedDays > 0 ? Math.round(totalBreakMins / completedDays) : 0;
  const totalRetards = history.filter(d => d.estEnRetard).length;
  const totalPenalites = history.reduce((s, d) => s + (d.penaliteSalaire ?? 0), 0);

  return (
    <><div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">Mon Pointage</h2>
          <p className="text-muted-foreground mt-1 text-sm">Suivi de votre présence et de vos pauses</p>
        </div>

        {/* Pointage widget (today) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <AttendanceWidget />
          </div>

          {/* Summary stats */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Jours</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{completedDays}</p>
              <p className="text-xs text-muted-foreground mt-1">30 derniers jours</p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Coffee className="w-4 h-4 text-warning" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Pause moy.</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{avgBreak}<span className="text-lg font-normal text-muted-foreground ml-1">min</span></p>
              <p className="text-xs text-muted-foreground mt-1">Par journée</p>
            </div>
            <div className={`border rounded-xl p-4 ${totalRetards > 0 ? 'bg-destructive/10 border-destructive/30' : 'bg-card border-border'}`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={`w-4 h-4 ${totalRetards > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Retards</span>
              </div>
              <p className={`text-3xl font-bold ${totalRetards > 0 ? 'text-destructive' : 'text-foreground'}`}>{totalRetards}</p>
              <p className="text-xs text-muted-foreground mt-1">Ce mois</p>
            </div>
            <div className={`border rounded-xl p-4 ${totalPenalites > 0 ? 'bg-warning/10 border-warning/30' : 'bg-card border-border'}`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className={`w-4 h-4 ${totalPenalites > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Pénalités</span>
              </div>
              <p className={`text-2xl font-bold ${totalPenalites > 0 ? 'text-warning' : 'text-foreground'}`}>
                {totalPenalites > 0 ? `${totalPenalites.toFixed(0)} TND` : '--'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Retards cumulés</p>
            </div>
          </div>
        </div>

        {/* History table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Historique des 30 derniers jours</h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center">
              <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground text-sm">Aucune session enregistrée</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {history.map(day => (
                <div key={day.id}>
                  {/* Row */}
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors flex items-center gap-4"
                    onClick={() => setExpanded(expanded === day.id ? null : day.id)}
                  >
                    {/* Date */}
                    <div className="w-28 shrink-0">
                      <p className="font-medium text-sm text-foreground capitalize">{fmtDate(day.date)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(day.date).toLocaleDateString('fr-FR')}</p>
                    </div>

                    {/* Clock in/out */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Arrivée</p>
                        <p className="font-mono text-sm font-bold text-success">{day.clockIn}</p>
                      </div>
                      <div className="h-px w-6 bg-border" />
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Départ</p>
                        <p className={`font-mono text-sm font-bold ${day.clockOut === '--' ? 'text-muted-foreground' : 'text-destructive'}`}>
                          {day.clockOut}
                        </p>
                      </div>
                    </div>

                    {/* Work time */}
                    <div className="hidden sm:block text-center w-20">
                      <p className="text-[10px] text-muted-foreground">Productif</p>
                      <p className="text-sm font-bold text-primary">{day.tempsProductif}</p>
                    </div>

                    {/* Breaks */}
                    <div className="hidden sm:block text-center w-20">
                      <p className="text-[10px] text-muted-foreground">Pauses</p>
                      <p className="text-sm font-bold text-warning">{day.totalBreakMinutes}min</p>
                    </div>

                    {/* Status */}
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(day.status)}`}>
                      {statusLabel(day.status)}
                    </span>

                    {/* Retard badge */}
                    {day.estEnRetard && (
                      <span className="shrink-0 inline-flex items-center gap-1 bg-destructive/15 text-destructive rounded-full px-2 py-0.5 text-xs font-bold">
                        <AlertTriangle className="w-3 h-3" />+{day.retardMinutes}min
                        {day.penaliteSalaire > 0 && <span className="text-[10px]">(-{day.penaliteSalaire.toFixed(0)} TND)</span>}
                      </span>
                    )}

                    {/* Expand icon */}
                    {day.breaks.length > 0 && (
                      <span className="text-muted-foreground text-xs shrink-0">
                        {expanded === day.id ? '▲' : '▼'} {day.breaks.length} pause{day.breaks.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </button>

                  {/* Expanded breaks */}
                  {expanded === day.id && day.breaks.length > 0 && (
                    <div className="bg-muted/20 px-6 py-3 space-y-2">
                      {day.breaks.map(b => (
                        <div key={b.id} className="flex items-center gap-3 text-sm">
                          <span className="w-32 font-medium text-foreground">
                            {BREAK_LABEL[b.type] ?? b.type}
                          </span>
                          <span className="text-muted-foreground font-mono text-xs">
                            {new Date(b.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            {b.endTime && ` → ${new Date(b.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                          </span>
                          <span className="ml-auto text-warning text-xs font-medium">
                            {b.durationMinutes}min
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div></>
  );
}
