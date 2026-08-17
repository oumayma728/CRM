import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Phone, PhoneOff, X, Delete, Trash2 } from 'lucide-react';
import { saveCall } from '../../services/api';
import { useAutoClockIn } from '../../hooks/useAutoClockIn';
import toast from 'react-hot-toast';

interface PhoneDialerPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type DialerState = 'idle' | 'calling' | 'connected';

const KEYPAD_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

function formatNumber(num: string): string {
  if (!num) return '';
  const cleaned = num.replace(/[^\d+*#]/g, '');
  if (cleaned.startsWith('+')) {
    const rest = cleaned.slice(1);
    const parts: string[] = [];
    for (let i = 0; i < rest.length; i += 2) {
      parts.push(rest.slice(i, i + 2));
    }
    return '+' + parts.join(' ');
  }
  const parts: string[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    parts.push(cleaned.slice(i, i + 2));
  }
  return parts.join(' ');
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function PhoneDialerPanel({ isOpen, onClose }: PhoneDialerPanelProps) {
  const [number, setNumber] = useState('');
  const [dialerState, setDialerState] = useState<DialerState>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [saving, setSaving] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callStartRef = useRef<Date | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const autoClockIn = useAutoClockIn();

  // Close on outside click (only when idle)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dialerState !== 'idle') return; // Don't close during a call
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, dialerState]);

  // Call duration timer
  useEffect(() => {
    if (dialerState === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [dialerState]);

  // Reset state when panel closes
  useEffect(() => {
    if (!isOpen && dialerState === 'idle') {
      setNumber('');
      setCallDuration(0);
    }
  }, [isOpen, dialerState]);

  const handleKeyPress = useCallback((key: string) => {
    if (number.length < 20) {
      setNumber(prev => prev + key);
    }
  }, [number.length]);

  const handleDeleteLast = useCallback(() => {
    setNumber(prev => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setNumber('');
  }, []);

  // ── Start call ────────────────────────────────────────────
  const handleCall = useCallback(() => {
    if (!number.trim()) return;

    autoClockIn();
    setDialerState('calling');
    callStartRef.current = new Date();
    setCallDuration(0);

    // Simulate ringing for 2 seconds, then connected
    // In production: replace with Twilio/WebRTC/SIP SDK
    setTimeout(() => {
      setDialerState('connected');
    }, 2000);

    toast.success(`Appel vers ${formatNumber(number)}...`, {
      icon: '📞',
      duration: 2000,
    });
  }, [number, autoClockIn]);

  // ── Hang up & save to database ────────────────────────────
  const handleHangUp = useCallback(async () => {
    const duration = callDuration;
    const phone = number.trim();
    const callDate = callStartRef.current?.toISOString() || new Date().toISOString();

    // Reset UI immediately
    setDialerState('idle');
    setCallDuration(0);

    if (!phone || duration < 1) {
      toast('Appel trop court, non enregistré', { icon: 'ℹ️' });
      return;
    }

    // Save to database
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
        notes: `Appel sortant direct depuis le panneau téléphone. Durée: ${formatDuration(duration)}`,
        statut: 'Rappel',
        call_date: callDate,
      });

      toast.success(`Appel sauvegardé (${formatDuration(duration)})`, {
        icon: '✅',
        duration: 3000,
      });
    } catch (err: any) {
      console.error('Erreur sauvegarde appel:', err);
      toast.error(err?.message || 'Erreur lors de la sauvegarde de l\'appel');
    } finally {
      setSaving(false);
    }
  }, [callDuration, number]);

  if (!isOpen) return null;

  const isInCall = dialerState !== 'idle';

  return (
    <div
      ref={panelRef}
      className="absolute right-0 mt-3 w-[340px] bg-[#12122a] border-2 border-white/[0.06] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <Phone size={16} className="text-amber-400" />
          <h3 className="text-xs font-black uppercase tracking-widest text-white">
            Composer un numéro
          </h3>
        </div>
        {isInCall && (
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
            dialerState === 'calling'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/25 animate-pulse'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
          }`}>
            {dialerState === 'calling' ? 'Appel...' : formatDuration(callDuration)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        {/* Number input */}
        <div className="relative">
          <input
            type="text"
            value={formatNumber(number)}
            onChange={(e) => {
              if (isInCall) return;
              const raw = e.target.value.replace(/\s/g, '');
              setNumber(raw);
            }}
            readOnly={isInCall}
            placeholder="+32 __ __ __ __ __"
            className={`w-full px-4 py-3.5 bg-[#1a1a3a] border rounded-2xl text-lg font-mono font-bold text-white placeholder:text-slate-600 focus:outline-none transition-all tracking-widest ${
              isInCall
                ? 'border-emerald-500/30 ring-2 ring-emerald-500/10'
                : 'border-white/[0.08] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30'
            }`}
          />
          {/* Connected call indicator */}
          {dialerState === 'connected' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400">{formatDuration(callDuration)}</span>
            </div>
          )}
          {dialerState === 'calling' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-[10px] font-bold text-amber-400 animate-pulse">Sonnerie...</span>
            </div>
          )}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2">
          {KEYPAD_KEYS.flat().map((key) => (
            <button
              key={key}
              onClick={() => handleKeyPress(key)}
              disabled={isInCall}
              className="h-[56px] rounded-2xl bg-[#1a1a3a] border border-white/[0.06] text-white font-bold text-xl hover:bg-[#252550] hover:border-white/[0.12] active:scale-[0.96] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {key}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        {!isInCall ? (
          /* ── IDLE: Effacer + Appeler ── */
          <div className="grid grid-cols-5 gap-2 mt-1">
            <button
              onClick={handleClear}
              disabled={number.length === 0}
              className="col-span-2 h-[48px] rounded-2xl bg-[#1a1a3a] border border-white/[0.06] text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-[#252550] hover:text-white active:scale-[0.96] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Effacer
            </button>
            <button
              onClick={handleCall}
              disabled={!number.trim()}
              className="col-span-3 h-[48px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.96] transition-all shadow-lg shadow-emerald-600/20"
            >
              <Phone size={15} />
              Appeler
            </button>
          </div>
        ) : (
          /* ── IN CALL: Raccrocher ── */
          <div className="mt-1">
            <button
              onClick={handleHangUp}
              disabled={saving}
              className="w-full h-[48px] rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.96] transition-all shadow-lg shadow-red-600/20 animate-pulse disabled:opacity-60"
            >
              <PhoneOff size={15} />
              {saving ? 'Sauvegarde...' : 'Raccrocher'}
            </button>
          </div>
        )}
      </div>

      {/* Saving indicator */}
      {saving && (
        <div className="px-5 py-2 border-t border-white/[0.06] bg-emerald-500/5 flex items-center justify-center gap-2">
          <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] text-emerald-400 font-medium">Sauvegarde de l'appel en cours...</span>
        </div>
      )}
    </div>
  );
}
