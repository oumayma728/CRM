import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/crmApi';
import { Clock, Coffee, LogIn, Calendar, AlertCircle, AlertTriangle, Info, UserCheck, UserX, PlayCircle, WifiOff, DoorOpen, Timer, RefreshCw } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TeamAgentLive {
  userId: number;
  userName: string;
  userRole: string;
  status: string;
  clockIn?: string;
  workDurationMinutes?: number;
  currentBreakType?: string;
  totalBreakMinutes?: number;
}

interface PointageDetail {
  agentNom: string;
  arrivee: string;
  depart: string;
  pauses: string;
  tempsProductif: string;
  statut: string;
  retardMinutes: number;
  estEnRetard: boolean;
  penaliteSalaire: number;
}

interface PointageData {
  presents: number;
  totalAgents: number;
  retards: number;
  tempsMoyen: string;
  pausesMoyennes: string;
  heureDebutTravail: string;
  heureFinTravail: string;
  toleranceMinutes: number;
  details: PointageDetail[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const statusBadge = (statut: string) => {
  switch (statut) {
    case 'En activité': return 'bg-success/15 text-success';
    case 'En pause':    return 'bg-warning/15 text-warning';
    default:            return 'bg-muted text-muted-foreground';
  }
};

const statusDot = (statut: string) => {
  switch (statut) {
    case 'En activité': return 'bg-success animate-pulse';
    case 'En pause':    return 'bg-warning animate-pulse';
    default:            return 'bg-muted-foreground';
  }
};

const formatLiveTime = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const formatLiveDuration = (minutes?: number) => {
  if (minutes == null || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}` : `${m} min`;
};

const LiveStatusBadge = ({ status }: { status: string }) => {
  if (status === 'active')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/15 text-success"><PlayCircle className="w-3 h-3" /> En poste</span>;
  if (status === 'break')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/15 text-warning"><Coffee className="w-3 h-3" /> Pause</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground"><WifiOff className="w-3 h-3" /> Hors ligne</span>;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PointagePage() {
  const [pointage, setPointage] = useState<PointageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // ── Pointage en direct (temps réel, auto-refresh 30s) ─────────────────────
  const [liveAgents, setLiveAgents] = useState<TeamAgentLive[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchLive = useCallback(async () => {
    try {
      const res = await api.get('/attendance/team-detail');
      setLiveAgents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Erreur chargement pointage en direct:', err);
    } finally {
      setLiveLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 30000);
    return () => clearInterval(interval);
  }, [fetchLive]);

  const presentLive = liveAgents.filter(a => a.status === 'active' || a.status === 'break');
  const onBreakLive = liveAgents.filter(a => a.status === 'break');
  const absentLive = liveAgents.filter(a => a.status !== 'active' && a.status !== 'break');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/attendance/admin/daily?date=${selectedDate}`);
        const d = response.data;
        setPointage({
          presents: d.presents,
          totalAgents: d.totalAgents,
          retards: d.retards,
          tempsMoyen: d.tempsMoyen,
          pausesMoyennes: d.pausesMoyennes,
          heureDebutTravail: d.heureDebutTravail ?? '08:00',
          heureFinTravail: d.heureFinTravail ?? '20:00',
          toleranceMinutes: d.toleranceMinutes ?? 10,
          details: (d.details ?? []).map((x: any) => ({
            agentNom: x.agentNom,
            arrivee: x.arrivee,
            depart: x.depart,
            pauses: x.pauses,
            tempsProductif: x.tempsProductif,
            statut: x.statut,
            retardMinutes: x.retardMinutes ?? 0,
            estEnRetard: x.estEnRetard ?? false,
            penaliteSalaire: x.penaliteSalaire ?? 0,
          })),
        });
      } catch (err) {
        console.error('Erreur chargement pointage:', err);
        setError('Impossible de charger les données de pointage. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDate]);

  if (loading) return (
    <><div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div></>
  );

  if (error) return (
    <><div className="bg-destructive/10 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
        <p className="text-destructive">{error}</p>
      </div></>
  );

  const retardAgents = pointage?.details.filter(d => d.estEnRetard) ?? [];
  const totalPenalites = retardAgents.reduce((s, d) => s + d.penaliteSalaire, 0);

  return (
    <><div className="space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Rapport de Pointage</h1>
            <p className="text-muted-foreground mt-1">Suivi de la présence et du temps de travail</p>
          </div>
          {pointage && (
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-3 py-2 text-sm">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <span className="text-primary">
                Horaires : <strong>{pointage.heureDebutTravail}</strong> → <strong>{pointage.heureFinTravail}</strong>
                <span className="ml-2 text-primary">(tolérance {pointage.toleranceMinutes}min)</span>
              </span>
            </div>
          )}
        </div>

        {/* ── Pointage en direct ──────────────────────────────────────────── */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <h2 className="font-semibold text-foreground text-sm">
                Pointage en direct
              </h2>
              <span className="text-xs text-muted-foreground">
                · màj {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <button
              onClick={fetchLive}
              disabled={liveLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-lg text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${liveLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>

          <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
            <div className="p-4 flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-success shrink-0" />
              <div>
                <p className="text-xl font-bold text-foreground">{presentLive.length}</p>
                <p className="text-xs text-muted-foreground">Présents</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <Coffee className="w-5 h-5 text-warning shrink-0" />
              <div>
                <p className="text-xl font-bold text-foreground">{onBreakLive.length}</p>
                <p className="text-xs text-muted-foreground">En pause</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <UserX className="w-5 h-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xl font-bold text-foreground">{absentLive.length}</p>
                <p className="text-xs text-muted-foreground">Hors ligne</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  {['Agent', 'Statut', 'Arrivée', 'Durée', 'Pause'].map(h => (
                    <th key={h} className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {liveLoading && liveAgents.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">Chargement...</td></tr>
                ) : liveAgents.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">Aucune donnée de pointage disponible</td></tr>
                ) : liveAgents.map(agent => (
                  <tr key={agent.userId} className="hover:bg-muted transition-colors">
                    <td className="p-3 font-medium text-foreground text-sm">{agent.userName}</td>
                    <td className="p-3"><LiveStatusBadge status={agent.status} /></td>
                    <td className="p-3 text-sm font-mono text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><DoorOpen className="w-3.5 h-3.5" />{formatLiveTime(agent.clockIn)}</span>
                    </td>
                    <td className="p-3 text-sm font-mono text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Timer className="w-3.5 h-3.5" />{formatLiveDuration(agent.workDurationMinutes)}</span>
                    </td>
                    <td className="p-3 text-sm font-mono text-warning">
                      {agent.totalBreakMinutes ? `${agent.totalBreakMinutes} min` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Date picker */}
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="glass-input px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* KPI Cards (rapport historique) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Présents</h3>
              <LogIn className="w-4 h-4 text-success" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {pointage?.presents ?? 0}
              <span className="text-sm font-normal text-muted-foreground">/{pointage?.totalAgents ?? 0}</span>
            </p>
          </div>

          <div className={`glass-card p-5 ${(pointage?.retards ?? 0) > 0 ? 'border-destructive/30' : 'border-border'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Retards</h3>
              <AlertTriangle className={`w-4 h-4 ${(pointage?.retards ?? 0) > 0 ? 'text-destructive' : 'text-muted-foreground/70'}`} />
            </div>
            <p className={`text-2xl font-bold ${(pointage?.retards ?? 0) > 0 ? 'text-destructive' : 'text-foreground'}`}>
              {pointage?.retards ?? 0}
            </p>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Temps moyen</h3>
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{pointage?.tempsMoyen ?? '--'}</p>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pauses moy.</h3>
              <Coffee className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{pointage?.pausesMoyennes ?? '--'}</p>
          </div>

          <div className={`glass-card p-5 ${totalPenalites > 0 ? 'border-warning/30' : 'border-border'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pénalités</h3>
              <AlertTriangle className={`w-4 h-4 ${totalPenalites > 0 ? 'text-warning' : 'text-muted-foreground/70'}`} />
            </div>
            <p className={`text-2xl font-bold ${totalPenalites > 0 ? 'text-warning' : 'text-foreground'}`}>
              {totalPenalites > 0 ? `${totalPenalites.toFixed(0)} TND` : '--'}
            </p>
          </div>

        </div>

        {/* Retard alert banner */}
        {retardAgents.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="font-semibold text-destructive text-sm">
                {retardAgents.length} agent{retardAgents.length > 1 ? 's' : ''} en retard · pénalités cumulées : {totalPenalites.toFixed(0)} TND
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {retardAgents.map((d, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 bg-destructive/15 text-destructive rounded-full px-3 py-1 text-xs font-medium">
                  {d.agentNom}
                  <span className="bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-[10px] font-bold">+{d.retardMinutes}min</span>
                  <span className="text-destructive text-[10px]">-{d.penaliteSalaire.toFixed(0)} TND</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Detail table */}
        {!pointage || pointage.details.length === 0 ? (
          <div className="glass-card p-12 text-center text-muted-foreground">
            Aucun pointage enregistré pour cette date
          </div>
        ) : (
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground text-sm">
                Détail du {new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    {['Agent', 'Arrivée', 'Retard', 'Départ', 'Pauses', 'Productif', 'Pénalité', 'Statut'].map(h => (
                      <th key={h} className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pointage.details.map((detail, idx) => (
                    <tr key={idx} className={`hover:bg-muted transition-colors ${detail.estEnRetard ? 'bg-destructive/50' : ''}`}>

                      {/* Agent */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground">{detail.agentNom}</span>
                          {detail.estEnRetard && <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                        </div>
                      </td>

                      {/* Arrivée */}
                      <td className="p-4 font-mono text-sm text-success font-bold">
                        {detail.arrivee}
                      </td>

                      {/* Retard */}
                      <td className="p-4">
                        {detail.estEnRetard
                          ? <span className="inline-flex items-center bg-destructive/15 text-destructive rounded-full px-2 py-0.5 text-xs font-bold">+{detail.retardMinutes}min</span>
                          : <span className="text-success text-xs font-medium">✓ À l'heure</span>
                        }
                      </td>

                      {/* Départ */}
                      <td className="p-4 font-mono text-sm text-muted-foreground">{detail.depart}</td>

                      {/* Pauses */}
                      <td className="p-4 text-warning text-sm max-w-[180px] truncate" title={detail.pauses}>
                        {detail.pauses}
                      </td>

                      {/* Productif */}
                      <td className="p-4 text-primary font-medium text-sm">{detail.tempsProductif}</td>

                      {/* Pénalité */}
                      <td className="p-4">
                        {detail.penaliteSalaire > 0
                          ? <span className="inline-flex items-center bg-warning/15 text-warning rounded-full px-2 py-0.5 text-xs font-bold">-{detail.penaliteSalaire.toFixed(0)} TND</span>
                          : <span className="text-muted-foreground text-xs">--</span>
                        }
                      </td>

                      {/* Statut */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusBadge(detail.statut)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot(detail.statut)}`} />
                          {detail.statut}
                        </span>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div></>
  );
}
