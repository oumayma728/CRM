import React from 'react';
import { Phone, PhoneOff, Clock, SkipForward } from 'lucide-react';
import { useCallContext } from '../../contexts/CallContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function CallButton() {
  const { callState, callDuration, cooldownRemaining, startCall, endCall, skipCooldown } = useCallContext();
  const { user } = useAuth();
  const navigate = useNavigate();

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Admin & Qualité: navigate to CallWorkspace ────────────
  const isAdminOrQualite = user?.role === 'admin' || user?.role === 'qualite';

  if (isAdminOrQualite) {
    return (
      <div className="relative">
        <button
          onClick={() => navigate(user?.role === 'admin' ? '/admin/calls' : '/qualite/calls')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all shadow-lg shadow-emerald-500/10"
          title="Centre d'appels"
        >
          <Phone size={16} />
          <span className="text-xs font-black uppercase tracking-wider">Appeler</span>
        </button>
      </div>
    );
  }

  // ── Agent: original behaviour (kept intact) ───────────────
  if (callState === 'idle') {
    return (
      <button
        onClick={startCall}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all shadow-lg shadow-emerald-500/10"
        title="Lancer un appel"
      >
        <Phone size={16} />
        <span className="text-xs font-black uppercase tracking-wider">Appeler</span>
      </button>
    );
  }

  if (callState === 'calling') {
    return (
      <button
        onClick={endCall}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all shadow-lg shadow-red-500/10 animate-pulse"
        title="Terminer l'appel"
      >
        <PhoneOff size={16} />
        <span className="text-xs font-black uppercase tracking-wider">{fmt(callDuration)}</span>
      </button>
    );
  }

  const progress = ((30 - cooldownRemaining) / 30) * 100;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 shadow-lg shadow-amber-500/10">
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1.5">
          <Clock size={14} className="text-amber-400" />
          <span className="text-xs font-black text-amber-400 tabular-nums">{cooldownRemaining}s</span>
        </div>
        <div className="w-16 h-1 bg-amber-500/20 rounded-full mt-1 overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <button
        onClick={skipCooldown}
        className="p-1.5 rounded-lg hover:bg-amber-500/20 transition-colors text-amber-400"
        title="Passer maintenant"
      >
        <SkipForward size={14} />
      </button>
    </div>
  );
}
