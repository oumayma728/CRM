import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Search,
  History, Clock, TrendingUp, Users, ChevronDown,
  MessageCircle, CheckCircle2, XCircle, AlertCircle,
  ArrowUpRight, ArrowDownRight, MonitorSmartphone, List
} from 'lucide-react';
import { getCalls, getStats, saveCall, type SaveCallRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const KEYPAD_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

type DialerState = 'idle' | 'calling' | 'connected';
type CallFilter = 'all' | 'incoming' | 'outgoing' | 'missed';

interface CallRecord {
  id: number;
  agent_name: string;
  agent_id?: string;
  audio_path?: string;
  sentiment: string;
  sentiment_score: number;
  score_percentage: number;
  performance: string;
  summary: string;
  keywords: string[];
  call_date: string;
  call_type?: string;
  status?: string;
  duration?: number;
  phone?: string;
  contact_name?: string;
}

interface StatsData {
  total_calls: number;
  avg_score: number;
  sentiment_distribution: Record<string, number>;
  performance_distribution: Record<string, number>;
  role: string;
  agent_name?: string;
}

function formatNumber(num: string): string {
  if (!num) return '';
  const cleaned = num.replace(/[^\d+*#]/g, '');
  if (cleaned.startsWith('+')) {
    const rest = cleaned.slice(1);
    const parts: string[] = [];
    for (let i = 0; i < rest.length; i += 2) parts.push(rest.slice(i, i + 2));
    return '+' + parts.join(' ');
  }
  const parts: string[] = [];
  for (let i = 0; i < cleaned.length; i += 2) parts.push(cleaned.slice(i, i + 2));
  return parts.join(' ');
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function formatCallDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateGroup(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function groupByDate(calls: CallRecord[]): Map<string, CallRecord[]> {
  const groups = new Map<string, CallRecord[]>();
  for (const call of calls) {
    const key = new Date(call.call_date).toDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(call);
  }
  return groups;
}

export default function CallWorkspace() {
  const { user } = useAuth();
  const [number, setNumber] = useState('');
  const [dialerState, setDialerState] = useState<DialerState>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [saving, setSaving] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [showKeypad, setShowKeypad] = useState(true);

  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<CallFilter>('all');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callStartRef = useRef<Date | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (dialerState === 'connected') {
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [dialerState]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [callsData, statsData] = await Promise.allSettled([
        getCalls({ limit: 100 }),
        getStats(),
      ]);
      if (callsData.status === 'fulfilled') {
        setCalls((callsData.value.calls || []).map(c => ({ ...c, id: c.call_id })));
      }
      if (statsData.status === 'fulfilled') setStats(statsData.value);
    } catch (err) {
      console.error('Failed to fetch call data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = useCallback((key: string) => {
    if (number.length < 20) setNumber(prev => prev + key);
  }, [number.length]);

  const handleDeleteLast = useCallback(() => setNumber(prev => prev.slice(0, -1)), []);
  const handleClear = useCallback(() => setNumber(''), []);

  const handleCall = useCallback(() => {
    if (!number.trim()) return;
    setDialerState('calling');
    callStartRef.current = new Date();
    setCallDuration(0);
    setShowKeypad(false);
    setTimeout(() => setDialerState('connected'), 2000);
    toast.success(`Appel vers ${formatNumber(number)}...`, { icon: '📞', duration: 2000 });
  }, [number]);

  const handleHangUp = useCallback(async () => {
    const duration = callDuration;
    const phone = number.trim();
    const callDate = callStartRef.current?.toISOString() || new Date().toISOString();

    setDialerState('idle');
    setCallDuration(0);
    setShowKeypad(true);

    if (!phone || duration < 1) {
      toast('Appel trop court, non enregistré', { icon: 'ℹ️' });
      return;
    }

    setSaving(true);
    try {
      await saveCall({
        contact_id: 0,
        contact_name: 'Appel direct',
        contact_company: '',
        phone: phone,
        email: '',
        duration: duration,
        besoin: '',
        budget: '',
        interet: '',
        notes: `Appel sortant direct depuis le workspace. Durée: ${formatDuration(duration)}`,
        statut: 'Rappel',
        call_date: callDate,
      });
      toast.success(`Appel sauvegardé (${formatDuration(duration)})`, { icon: '✅', duration: 3000 });
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [callDuration, number]);

  const filteredCalls = calls.filter(call => {
    const q = searchQuery.toLowerCase();
    if (q && !call.agent_name?.toLowerCase().includes(q) && !call.phone?.toLowerCase().includes(q) && !call.contact_name?.toLowerCase().includes(q)) return false;
    if (activeFilter === 'incoming' && call.call_type !== 'incoming') return false;
    if (activeFilter === 'outgoing' && call.call_type !== 'outgoing') return false;
    if (activeFilter === 'missed' && call.status !== 'missed') return false;
    return true;
  });

  const groupedCalls = groupByDate(filteredCalls);
  const sortedGroups = Array.from(groupedCalls.entries()).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());

  const filteredSentiment = stats?.sentiment_distribution || {};
  const totalSentiment = Object.values(filteredSentiment).reduce((a, b) => a + b, 0);
  const positiveRate = totalSentiment > 0 ? Math.round(((filteredSentiment.POSITIVE || 0) / totalSentiment) * 100) : 0;

  const filters: { key: CallFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Tous', count: calls.length },
    { key: 'incoming', label: 'Entrants', count: calls.filter(c => c.call_type === 'incoming').length },
    { key: 'outgoing', label: 'Sortants', count: calls.filter(c => c.call_type === 'outgoing' || !c.call_type).length },
    { key: 'missed', label: 'Manqués', count: calls.filter(c => c.status === 'missed').length },
  ];

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center">
            <Phone size={18} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-foreground">Centre d'appels</h1>
            <p className="text-xs text-muted-foreground font-medium">
              Gérez vos appels entrants et sortants
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
        >
          <Clock size={14} />
          Actualiser
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* ── LEFT PANEL: Dialer ── */}
        <div className="lg:w-[380px] shrink-0 flex flex-col gap-4">
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-1.5">
                <Phone size={13} className="text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Aujourd'hui</span>
              </div>
              <span className="text-xl font-black text-foreground">{stats?.total_calls || 0}</span>
              <span className="text-[10px] text-muted-foreground ml-1">appels</span>
            </div>
            <div className="p-3 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-1.5">
                <TrendingUp size={13} className="text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Score</span>
              </div>
              <span className="text-xl font-black text-foreground">{stats?.avg_score || 0}%</span>
              <span className="text-[10px] text-muted-foreground ml-1">moyen</span>
            </div>
            <div className="p-3 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Positif</span>
              </div>
              <span className="text-xl font-black text-emerald-400">{positiveRate}%</span>
            </div>
            <div className="p-3 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-1.5">
                <Users size={13} className="text-blue-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Agents</span>
              </div>
              <span className="text-xl font-black text-foreground">
                {new Set(calls.map(c => c.agent_name)).size}
              </span>
              <span className="text-[10px] text-muted-foreground ml-1">actifs</span>
            </div>
          </div>

          {/* Dialer Card */}
          <div className="flex-1 rounded-2xl bg-card border border-border overflow-hidden flex flex-col">
            {/* Dialer Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${dialerState === 'connected' ? 'bg-emerald-400 animate-pulse' : dialerState === 'calling' ? 'bg-amber-400 animate-ping' : 'bg-slate-500'}`} />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {dialerState === 'idle' ? 'Composer' : dialerState === 'calling' ? 'Sonnerie...' : 'En communication'}
                </span>
              </div>
              {dialerState === 'connected' && (
                <span className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
                  {formatDuration(callDuration)}
                </span>
              )}
            </div>

            {/* Phone Input */}
            <div className="px-4 py-3">
              <div className="relative">
                <input
                  type="text"
                  value={formatNumber(number)}
                  onChange={(e) => {
                    if (dialerState !== 'idle') return;
                    setNumber(e.target.value.replace(/\s/g, ''));
                  }}
                  readOnly={dialerState !== 'idle'}
                  placeholder="+32 __ __ __ __ __"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-lg font-mono font-bold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all tracking-widest"
                />
              </div>
            </div>

            {/* Keypad (only visible when idle or showKeypad toggled) */}
            {(showKeypad || dialerState === 'idle') && (
              <div className="px-4 pb-3">
                <div className="grid grid-cols-3 gap-2">
                  {KEYPAD_KEYS.flat().map((key) => (
                    <button
                      key={key}
                      onClick={() => handleKeyPress(key)}
                      disabled={dialerState !== 'idle'}
                      className="h-14 rounded-xl bg-background border border-border text-foreground font-bold text-xl hover:bg-muted hover:border-primary/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {key}
                    </button>
                  ))}
                  <button
                    onClick={handleDeleteLast}
                    className="h-14 rounded-xl bg-background border border-border text-muted-foreground font-bold text-sm hover:bg-muted hover:border-destructive/30 active:scale-95 transition-all uppercase tracking-wider"
                  >
                    Effacer
                  </button>
                  <button
                    onClick={handleCall}
                    disabled={!number.trim() || dialerState !== 'idle'}
                    className="col-span-2 h-14 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-600/20"
                  >
                    <Phone size={16} />
                    Appeler
                  </button>
                </div>
              </div>
            )}

            {/* In-call controls */}
            {dialerState === 'connected' && (
              <div className="px-4 pb-4 space-y-3">
                {/* Call timer */}
                <div className="text-center">
                  <span className="text-3xl font-mono font-black text-emerald-400 tabular-nums">
                    {formatDuration(callDuration)}
                  </span>
                </div>

                {/* Control buttons */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setIsMuted(m => !m)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${isMuted ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-background border border-border text-muted-foreground hover:bg-muted'}`}
                    title={isMuted ? 'Activer le micro' : 'Mettre en sourdine'}
                  >
                    {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                    <span className="text-[9px] font-bold uppercase tracking-wider">{isMuted ? 'Muet' : 'Micro'}</span>
                  </button>
                  <button
                    onClick={() => setShowKeypad(s => !s)}
                    className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-background border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                    title="Pavé numérique"
                  >
                    <MonitorSmartphone size={18} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Clavier</span>
                  </button>
                  <button
                    onClick={() => setIsSpeakerOn(s => !s)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${isSpeakerOn ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-background border border-border text-muted-foreground hover:bg-muted'}`}
                    title={isSpeakerOn ? 'Éteindre le haut-parleur' : 'Activer le haut-parleur'}
                  >
                    {isSpeakerOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    <span className="text-[9px] font-bold uppercase tracking-wider">{isSpeakerOn ? 'HP' : 'Ecoute'}</span>
                  </button>
                </div>

                {/* Hangup button */}
                <button
                  onClick={handleHangUp}
                  disabled={saving}
                  className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-red-600/20"
                >
                  <PhoneOff size={16} />
                  {saving ? 'Sauvegarde...' : 'Raccrocher'}
                </button>
              </div>
            )}

            {/* Calling state */}
            {dialerState === 'calling' && (
              <div className="px-4 pb-6 flex flex-col items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-sm font-bold text-amber-400 animate-pulse">Appel en cours...</span>
                </div>
                <span className="text-lg font-mono font-bold text-foreground">{formatNumber(number)}</span>
                <button
                  onClick={handleHangUp}
                  className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-red-600/20"
                >
                  <PhoneOff size={16} />
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: Call History ── */}
        <div className="flex-1 flex flex-col rounded-2xl bg-card border border-border overflow-hidden min-h-0">
          {/* Search & Filters */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par agent, téléphone..."
                className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {filters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                    activeFilter === f.key
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:border-primary/20'
                  }`}
                >
                  {f.label}
                  <span className="ml-1.5 opacity-60">({f.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Call list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sortedGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <History size={32} className="text-muted-foreground/30 mb-3" />
                <p className="text-xs font-bold text-muted-foreground">Aucun appel trouvé</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sortedGroups.map(([dateKey, groupCalls]) => (
                  <div key={dateKey}>
                    <div className="sticky top-0 z-10 px-4 py-2 bg-card/95 backdrop-blur-sm border-b border-border">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {formatDateGroup(dateKey)}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-2">({groupCalls.length})</span>
                    </div>
                    {groupCalls.map((call) => (
                      <CallRow key={call.id} call={call} />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CallRow({ call }: { call: CallRecord }) {
  const [expanded, setExpanded] = useState(false);

  const sentimentColor = call.sentiment === 'POSITIVE' ? 'text-emerald-400'
    : call.sentiment === 'NEGATIVE' ? 'text-red-400'
    : 'text-amber-400';

  const sentimentBg = call.sentiment === 'POSITIVE' ? 'bg-emerald-500/10 border-emerald-500/30'
    : call.sentiment === 'NEGATIVE' ? 'bg-red-500/10 border-red-500/30'
    : 'bg-amber-500/10 border-amber-500/30';

  return (
    <div className="px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setExpanded(!expanded)}>
      <div className="flex items-center gap-3">
        {/* Call type icon */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          call.call_type === 'incoming'
            ? 'bg-blue-500/10 border border-blue-500/30'
            : 'bg-emerald-500/10 border border-emerald-500/30'
        }`}>
          {call.call_type === 'incoming' ? (
            <ArrowDownRight size={15} className="text-blue-400" />
          ) : (
            <ArrowUpRight size={15} className="text-emerald-400" />
          )}
        </div>

        {/* Call info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground truncate">
              {call.contact_name || call.agent_name || 'Inconnu'}
            </span>
            {call.sentiment && (
              <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${sentimentBg} ${sentimentColor}`}>
                {call.sentiment === 'POSITIVE' ? 'Positif' : call.sentiment === 'NEGATIVE' ? 'Négatif' : 'Neutre'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>{formatCallDate(call.call_date)}</span>
            {call.score_percentage > 0 && (
              <>
                <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40" />
                <span className={call.score_percentage >= 70 ? 'text-emerald-400' : 'text-amber-400'}>
                  {call.score_percentage}%
                </span>
              </>
            )}
          </div>
        </div>

        {/* Score indicator */}
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
          call.score_percentage >= 80 ? 'bg-emerald-500/20 text-emerald-400'
            : call.score_percentage >= 60 ? 'bg-amber-500/20 text-amber-400'
            : 'bg-red-500/20 text-red-400'
        }`}>
          {call.score_percentage || '--'}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && call.summary && (
        <div className="mt-2 ml-12 p-3 rounded-xl bg-background border border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">{call.summary}</p>
          {call.keywords && call.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {call.keywords.map((kw, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
