import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { clockIn } from '../services/api';

export function useAutoClockIn() {
  const { user } = useAuth();

  const autoClockIn = useCallback(() => {
    if (user?.role !== 'agent') return;
    // Non-bloquant : un échec de pointage ne doit jamais bloquer l'appel.
    clockIn().catch((err) => {
      console.error('Échec du pointage automatique :', err?.message || err);
    });
  }, [user?.role]);

  return autoClockIn;
}