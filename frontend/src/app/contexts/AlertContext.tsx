import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { AlertCircle, Bell } from 'lucide-react';

interface Alert {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'critical' | 'warning' | 'info';
}

interface AlertContextType {
  alerts: Alert[];
  removeAlert: (id: number) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { isAdmin, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      setAlerts([]);
      return;
    }

    const checkAlerts = async () => {
      try {
        const supervision = await api.getSupervisionData();
        const newAlerts: Alert[] = [];

        supervision.agents?.forEach((a: any) => {
          if (a.is_inactive && a.inactivity_duration > 30) {
            const id = Math.floor(Math.random() * 1000000);
            newAlerts.push({
              id,
              title: 'Alerte Inactivité',
              message: `${a.agent} est inactif depuis ${Math.round(a.inactivity_duration / 60)} min.`,
              time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              type: 'critical'
            });
          }
        });

        if (newAlerts.length > 0) {
          setAlerts(prev => {
            const uniqueNew = newAlerts.filter(na => !prev.some(pa => pa.message === na.message));
            
            // Show real toast for new alerts
            uniqueNew.forEach(alert => {
              toast.custom((t) => (
                <div className={`${t.visible ? 'animate-in fade-in slide-in-from-right-4' : 'animate-out fade-out slide-out-to-right-4'} max-w-md w-full bg-[#1E293B] border border-red-500/30 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden`}>
                  <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                          <AlertCircle className="w-6 h-6 text-red-500" />
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-xs font-black uppercase tracking-widest text-red-400">
                          {alert.title}
                        </p>
                        <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white leading-relaxed">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex border-l border-white/5">
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-xs font-black uppercase tracking-widest text-slate-500 hover:text-gray-900 dark:text-white transition-colors"
                    >
                      OK
                    </button>
                  </div>
                </div>
              ), { duration: 5000, position: 'top-right' });
            });

            return [...uniqueNew, ...prev].slice(0, 10);
          });
        }
      } catch (e) {
        console.error("Alert check failed", e);
      }
    };

    const interval = setInterval(checkAlerts, 15000);
    checkAlerts();
    return () => clearInterval(interval);
  }, [isAdmin, isAuthenticated]);

  const removeAlert = (id: number) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <AlertContext.Provider value={{ alerts, removeAlert }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
}
