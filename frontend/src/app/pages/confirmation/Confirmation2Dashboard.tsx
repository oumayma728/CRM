import SessionAttendanceWidget from '../../components/crm/SessionAttendanceWidget';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, XCircle, Clock, PhoneCall, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/crmApi';

interface Rdv {
  id: number;
  contactId: number;
  contactNom: string;
  contactPrenom: string;
  telephone: string;
  source: string;
  agentNom: string;
  dateRendezVous: string;
  statut: string;
}

interface DashboardData {
  totalRdv: number;
  rdvConfirmes: number;
  rdvAnnules: number;
  rdvReportes: number;
  rdvRecents: Rdv[];
}

const AGENDA_TABS = [
  { id: 'EBI',     label: 'Agenda EBI',     endpoint: 'agenda-ebi'    },
  { id: 'CLIENT1', label: 'Agenda Client 1', endpoint: 'agenda-client1' },
];

const STATUT_BADGE: Record<string, string> = {
  CONFIRME:   'bg-success/15 text-success',
  ANNULE:     'bg-destructive/15 text-destructive',
  REPORTER:   'bg-warning/15 text-warning',
  BRUT:       'bg-primary/15 text-primary',
};

export default function Confirmation2Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('EBI');
  const [agendaRdvs, setAgendaRdvs] = useState<Rdv[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/confirmation2/dashboard');
      setData(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAgendaRdvs = useCallback(async (tabId: string) => {
    const tab = AGENDA_TABS.find(t => t.id === tabId);
    if (!tab) return;
    setAgendaLoading(true);
    try {
      const res = await api.get(`/confirmation2/${tab.endpoint}`);
      setAgendaRdvs(res.data || []);
    } catch {
      setAgendaRdvs([]);
    } finally {
      setAgendaLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
  useEffect(() => { fetchAgendaRdvs(activeTab); }, [activeTab, fetchAgendaRdvs]);

  // Navigate to the dedicated agenda page which has FicheContactPanel + call gating
  const handleQualifier = (rdv: Rdv) => {
    const path = activeTab === 'EBI' ? '/confirmation2/agenda-ebi' : '/confirmation2/agenda-client1';
    navigate(path);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="mb-4">
        <SessionAttendanceWidget />
      </div>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-center text-destructive">
        <p>Erreur: {error}</p>
        <button onClick={fetchDashboard} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded">Réessayer</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Service Confirmation</h1>
        <p className="text-muted-foreground">Bienvenue, {user?.name || 'Confirmatrice'}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: <Calendar className="w-5 h-5 text-primary" />,   label: 'Total RDV',  value: data?.totalRdv || 0,       cls: 'bg-primary/10 text-primary'  },
          { icon: <CheckCircle className="w-5 h-5 text-success" />, label: 'Confirmés',  value: data?.rdvConfirmes || 0,   cls: 'bg-success/10 text-success' },
          { icon: <XCircle className="w-5 h-5 text-destructive" />,      label: 'Annulés',    value: data?.rdvAnnules || 0,     cls: 'bg-destructive/10 text-destructive'   },
          { icon: <Clock className="w-5 h-5 text-warning" />,     label: 'Reportés',   value: data?.rdvReportes || 0,    cls: 'bg-warning/10 text-warning' },
        ].map(k => (
          <div key={k.label} className={`rounded-xl p-4 text-center border ${k.cls} border-transparent`}>
            <div className="flex items-center justify-center gap-2 mb-2">{k.icon}</div>
            <div className="text-2xl font-bold">{k.value}</div>
            <div className="text-sm opacity-80">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs agenda */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="flex border-b border-border">
          {AGENDA_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {agendaLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  {['Contact', 'Téléphone', 'Agent', 'Date RDV', 'Statut', 'Action'].map(h => (
                    <th key={h} className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {agendaRdvs.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Aucun rendez-vous</td></tr>
                ) : agendaRdvs.map(rdv => (
                  <tr key={rdv.id} className="hover:bg-muted transition-colors">
                    <td className="p-3 font-medium text-foreground">{rdv.contactPrenom} {rdv.contactNom}</td>
                    <td className="p-3 text-muted-foreground">{rdv.telephone}</td>
                    <td className="p-3 text-muted-foreground">{rdv.agentNom}</td>
                    <td className="p-3 text-muted-foreground">{new Date(rdv.dateRendezVous).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_BADGE[rdv.statut] || 'bg-muted text-muted-foreground'}`}>
                        {rdv.statut}
                      </span>
                    </td>
                    <td className="p-3">
                      <button onClick={() => handleQualifier(rdv)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition">
                        <PhoneCall size={12} />
                        Qualifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info gating */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-3 border border-border">
        <Lock size={14} />
        <span>La qualification est disponible uniquement après avoir appelé le contact depuis la fiche de l'agenda.</span>
      </div>
    </div>
  );
}
