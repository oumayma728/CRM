import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useAutoClockIn } from '../hooks/useAutoClockIn';

export type CallState = 'idle' | 'calling' | 'cooldown';

interface CallContextType {
  callState: CallState;
  callDuration: number;
  cooldownRemaining: number;
  startCall: () => void;
  endCall: () => void;
  skipCooldown: () => void;
  isMuted: boolean;
  isOnHold: boolean;
  toggleMute: () => void;
  toggleHold: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const COOLDOWN_SECONDS = 30;

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(COOLDOWN_SECONDS);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (cooldownRef.current) { clearInterval(cooldownRef.current); cooldownRef.current = null; }
  }, []);

  const autoClockIn = useAutoClockIn();

  const startCall = useCallback(() => {
    autoClockIn();
    setCallState('calling');
    setCallDuration(0);
    setIsOnHold(false);
    setIsMuted(false);
    clearTimers();
    timerRef.current = setInterval(() => {
      setCallDuration(d => d + 1);
    }, 1000);
  }, [autoClockIn, clearTimers]);

  const endCall = useCallback(() => {
    setCallState('cooldown');
    setCooldownRemaining(COOLDOWN_SECONDS);
    setIsOnHold(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    cooldownRef.current = setInterval(() => {
      setCooldownRemaining(prev => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          cooldownRef.current = null;
          setCallState('idle');
          setCallDuration(0);
          return COOLDOWN_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimers]);

  const skipCooldown = useCallback(() => {
    if (cooldownRef.current) { clearInterval(cooldownRef.current); cooldownRef.current = null; }
    setCallState('idle');
    setCallDuration(0);
    setCooldownRemaining(COOLDOWN_SECONDS);
  }, []);

  const toggleMute = useCallback(() => setIsMuted(m => !m), []);
  const toggleHold = useCallback(() => setIsOnHold(h => !h), []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return (
    <CallContext.Provider value={{
      callState, callDuration, cooldownRemaining,
      startCall, endCall, skipCooldown,
      isMuted, isOnHold, toggleMute, toggleHold,
    }}>
      {children}
    </CallContext.Provider>
  );
}

export function useCallContext() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCallContext must be used within CallProvider');
  return ctx;
}
