import React, { useState } from 'react';
import {
  Settings, Shield, Bell, Mail, Save,
  Trash2, Download, Upload, CheckCircle, AlertTriangle,
  Lock, Globe, Clock, MessageSquare, ShieldCheck, Mic,
  Users, Target, Brain, Sparkles, Webhook, Sliders,
  FileText, RefreshCw, Calendar
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Weights {
  accueil: number;
  energie: number;
  voix: number;
  ecoute: number;
  client: number;
  operateur: number;
  efficacite: number;
  conclusion: number;
}

const CRITERIA_LABELS: Record<keyof Weights, string> = {
  accueil: 'Accueil & Identification',
  energie: 'Énergie & Dynamisme',
  voix: 'Qualité vocale & Débit',
  ecoute: 'Écoute active & Reformulation',
  client: 'Orientation Client & Empathie',
  operateur: 'Compétences Opérationnelles',
  efficacite: 'Efficacité & Wait Management',
  conclusion: 'Rebond & Conclusion'
};

const ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
  agent: {
    dashboard: true, contacts: true, agenda: true, performance: true,
    messages: true, audio_analysis: true, chatbot: true, scoring: false,
    evaluations: false, supervision: false, settings: false, reports: false,
  },
  qualite: {
    dashboard: true, contacts: false, agenda: true, performance: true,
    messages: true, audio_analysis: true, chatbot: true, scoring: true,
    evaluations: true, supervision: true, settings: false, reports: true,
  },
  admin: {
    dashboard: true, contacts: true, agenda: true, performance: true,
    messages: true, audio_analysis: true, chatbot: true, scoring: true,
    evaluations: true, supervision: true, settings: true, reports: true,
  },
};

const BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
  red: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
};

const PERMISSION_LABELS: Record<string, string> = {
  dashboard: 'Tableau de bord', contacts: 'Contacts & Leads', agenda: 'Agenda',
  performance: 'Performance', messages: 'Messagerie', audio_analysis: 'Analyse Audio',
  chatbot: 'Chatbot IA', scoring: 'Scoring & Alertes', evaluations: 'Évaluations',
  supervision: 'Supervision Live', settings: 'Paramètres', reports: 'Rapports',
};

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  const [config, setConfig] = useState({
    companyName: 'CRM Energie Solaire',
    adminEmail: 'admin@energie.fr',
    timezone: 'Europe/Paris',
    language: 'fr',
    sessionTimeout: 30,
    maxFailedLogin: 3,
    dataRetention: 365,
    backupEnabled: true,
    alertSound: true,
  });

  const [roles, setRoles] = useState(ROLE_PERMISSIONS);
  const [campaigns, setCampaigns] = useState([
    { id: 1, name: 'Campagne PV Printemps', status: 'active', agents: 5, startDate: '2026-03-01' },
    { id: 2, name: 'Campagne PAC Été', status: 'paused', agents: 3, startDate: '2026-06-01' },
    { id: 3, name: 'Campagne Isolation Hiver', status: 'draft', agents: 0, startDate: '' },
  ]);

  const [iaWeights, setIaWeights] = useState<Weights>({
    accueil: 10, energie: 15, voix: 10, ecoute: 15,
    client: 15, operateur: 15, efficacite: 10, conclusion: 10
  });
  const [iaTotalWeight, setIaTotalWeight] = useState(100);

  const [scripts, setScripts] = useState([
    { id: 1, title: 'Script Accueil Standard', content: 'Bonjour, je vous appelle de la part de...', category: 'accueil' },
    { id: 2, title: 'Script Objection Prix', content: 'Je comprends votre préoccupation concernant le prix...', category: 'objection' },
    { id: 3, title: 'Script Conclusion RDV', content: 'Parfait, je peux vous proposer un rendez-vous...', category: 'conclusion' },
  ]);

  const [notifications, setNotifications] = useState({
    emailAlerts: true, pushAlerts: true, scoreDrop: true,
    inactivity: true, fakeRdv: true, dailyReport: true, weeklyReport: true,
    alertEmail: 'admin@energie.fr',
    minScore: 70, maxInactivity: 15,
  });

  const [integrations, setIntegrations] = useState({
    crmSync: false, googleCalendar: false, slackNotif: false,
    webhookUrl: '', smtpHost: 'smtp.gmail.com', smtpPort: 587,
    smtpUser: '', smtpPass: '',
  });

  React.useEffect(() => {
    setIaTotalWeight(Object.values(iaWeights).reduce((a, b) => a + b, 0));
  }, [iaWeights]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      await api.saveConfig(config);
      await api.saveWeights(iaWeights);
      setSaveMsg('Configuration enregistrée !');
      toast.success('Paramètres sauvegardés');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('Erreur lors de l\'enregistrement');
      toast.error('Erreur sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_crm_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      toast.success('Backup exporté');
    } catch { toast.error('Erreur backup'); }
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'roles', label: 'Rôles', icon: Users },
    { id: 'permissions', label: 'Permissions', icon: Shield },
    { id: 'campaigns', label: 'Campagnes', icon: Target },
    { id: 'ia-scoring', label: 'IA Scoring', icon: Brain },
    { id: 'scripts', label: 'Scripts Appels', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Intégrations', icon: Webhook },
  ];

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full transition-all relative ${value ? 'bg-primary' : 'bg-muted'}`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 transition-all ${value ? 'left-7' : 'left-1'}`} />
    </button>
  );

  return (
    <>
      <style>{`
        .dark select, .dark input, .dark textarea { color-scheme: dark; }
      `}</style>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
            Paramètres <span className="text-primary">Système</span>
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Enregistrement...' : 'Enregistrer tout'}
        </button>
      </div>

      {saveMsg && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${saveMsg.includes('Erreur') ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
          <CheckCircle className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">{saveMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-card p-1 rounded-2xl border border-border overflow-x-auto no-scrollbar gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: Général */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border bg-muted/20">
              <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Configuration de base</h3>
            </div>
            <div className="p-8 space-y-6">
              {[
                { label: "Nom de l'entreprise", key: 'companyName', type: 'text' },
                { label: "Email administrateur", key: 'adminEmail', type: 'email' },
              ].map(field => (
                <div key={field.key} className="grid gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{field.label}</label>
                  <input
                    type={field.type}
                    className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={config[field.key as keyof typeof config] as string}
                    onChange={e => setConfig({ ...config, [field.key]: e.target.value })}
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fuseau horaire</label>
                  <select className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={config.timezone} onChange={e => setConfig({ ...config, timezone: e.target.value })}>
                    <option value="Europe/Paris">Europe/Paris</option>
                    <option value="Africa/Tunis">Africa/Tunis</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Langue</label>
                  <select className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={config.language} onChange={e => setConfig({ ...config, language: e.target.value })}>
                    <option value="fr">Francais</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border bg-muted/20">
                <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Securite</h3>
              </div>
              <div className="p-8 space-y-6">
                {[
                  { label: 'Timeout session (min)', key: 'sessionTimeout' },
                  { label: 'Essais max avant verrouillage', key: 'maxFailedLogin' },
                ].map(field => (
                  <div key={field.key} className="grid gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{field.label}</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      value={config[field.key as keyof typeof config] as number}
                      onChange={e => setConfig({ ...config, [field.key]: +e.target.value })}
                    />
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-foreground">Alertes Sonores</p>
                    <p className="text-[10px] font-medium text-muted-foreground">Son lors d'une alerte supervision</p>
                  </div>
                  <Toggle value={config.alertSound} onChange={v => setConfig({ ...config, alertSound: v })} />
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
                <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Maintenance</h3>
                <button onClick={handleBackup} className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                  <Download className="w-3.5 h-3.5" /> Backup
                </button>
              </div>
              <div className="p-8 space-y-4">
                <div className="grid gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Retention des logs (jours)</label>
                  <input type="number" className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={config.dataRetention} onChange={e => setConfig({ ...config, dataRetention: +e.target.value })} />
                </div>
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500">Zone Critique</h4>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-red-600 transition-all">
                    <Trash2 className="w-3 h-3" /> Supprimer tout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Rôles */}
      {activeTab === 'roles' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {(['agent', 'qualite', 'admin'] as const).map(role => (
            <div key={role} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border bg-muted/20 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black ${
                  role === 'admin' ? 'bg-gradient-to-br from-rose-500 to-red-600' :
                  role === 'qualite' ? 'bg-gradient-to-br from-[#7c3aed] to-indigo-600' :
                  'bg-gradient-to-br from-emerald-500 to-teal-600'
                }`}>
                  {role === 'admin' ? 'A' : role === 'qualite' ? 'SQ' : 'AG'}
                </div>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-widest text-foreground">
                    {role === 'admin' ? 'Administrateur' : role === 'qualite' ? 'Service Qualite' : 'Agent'}
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    {role === 'admin' ? 'Acces complet a toutes les fonctionnalites' : role === 'qualite' ? 'Supervision, evaluation et scoring' : 'Acces agent standard'}
                  </p>
                </div>
              </div>
              <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Object.entries(roles[role]).map(([perm, enabled]) => (
                  <div key={perm} className="flex items-center justify-between p-3 bg-muted/10 border border-border rounded-xl">
                    <span className="text-[10px] font-bold text-foreground">{PERMISSION_LABELS[perm] || perm}</span>
                    <Toggle value={enabled} onChange={v => setRoles({ ...roles, [role]: { ...roles[role], [perm]: v } })} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: Permissions */}
      {activeTab === 'permissions' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="p-6 border-b border-border bg-muted/20 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Matrice des Permissions</h3>
              <p className="text-[10px] text-muted-foreground">Vue consolidée par fonctionnalité</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fonctionnalité</th>
                  <th className="text-center p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Agent</th>
                  <th className="text-center p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Qualité</th>
                  <th className="text-center p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Admin</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                  <tr key={key} className="border-b border-border hover:bg-muted/5 transition-colors">
                    <td className="p-4 text-xs font-bold text-foreground">{label}</td>
                    {(['agent', 'qualite', 'admin'] as const).map(role => (
                      <td key={role} className="text-center p-4">
                        {roles[role][key] ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-border mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Campagnes */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Campagnes Actives</h3>
            </div>
            <button
              onClick={() => setCampaigns([...campaigns, { id: Date.now(), name: 'Nouvelle Campagne', status: 'draft', agents: 0, startDate: '' }])}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
            >
              + Campagne
            </button>
          </div>
          {campaigns.map(campaign => (
            <div key={campaign.id} className="bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-[10px] font-black ${
                  campaign.status === 'active' ? 'bg-emerald-500' :
                  campaign.status === 'paused' ? 'bg-amber-500' : 'bg-slate-500'
                }`}>
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <input
                    className="text-sm font-black text-foreground bg-transparent border-none focus:outline-none"
                    value={campaign.name}
                    onChange={e => setCampaigns(campaigns.map(c => c.id === campaign.id ? { ...c, name: e.target.value } : c))}
                  />
                  <p className="text-[10px] text-muted-foreground">{campaign.agents} agents</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={campaign.status}
                  onChange={e => setCampaigns(campaigns.map(c => c.id === campaign.id ? { ...c, status: e.target.value } : c))}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border ${
                    campaign.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    campaign.status === 'paused' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                    'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  <option value="active">Active</option>
                  <option value="paused">En pause</option>
                  <option value="draft">Brouillon</option>
                </select>
                <button
                  onClick={() => setCampaigns(campaigns.filter(c => c.id !== campaign.id))}
                  className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: IA Scoring */}
      {activeTab === 'ia-scoring' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Ponderation du Scoring IA</h3>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black ${iaTotalWeight === 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500 animate-pulse'}`}>
                TOTAL: {iaTotalWeight}%
              </div>
            </div>
            <div className="p-6 space-y-5">
              {(Object.keys(iaWeights) as Array<keyof Weights>).map(key => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-muted-foreground">{CRITERIA_LABELS[key]}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={iaWeights[key]}
                        onChange={e => setIaWeights(p => ({ ...p, [key]: +e.target.value }))}
                        className="w-14 px-2 py-1 bg-muted/40 border border-border rounded-lg text-center font-black text-foreground"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-700" style={{ width: `${iaWeights[key]}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border bg-muted/20">
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Formule de Scoring</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-muted rounded-xl border border-border">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Formule Active</p>
                  <code className="text-[10px] text-foreground leading-relaxed block opacity-70">
                    score = (revenus x 0.20) + (chauffage x 0.15) + (toiture x 0.15) + (isolation x 0.10) + (consommation x 0.15) + (credit x 0.10) + (situation_bancaire x 0.15)
                  </code>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Premium', range: '90+', color: 'emerald' },
                    { label: 'Bon prospect', range: '70-89', color: 'blue' },
                    { label: 'Moyen', range: '50-69', color: 'amber' },
                    { label: 'Risque', range: '<30', color: 'red' },
                  ].map(tier => {
                    const bc = BADGE_COLORS[tier.color] || BADGE_COLORS.emerald;
                    return (
                    <div key={tier.label} className={`p-3 ${bc.bg} border ${bc.border} rounded-xl text-center`}>
                      <p className={`text-sm font-black ${bc.text}`}>{tier.range}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">{tier.label}</p>
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#7c3aed] to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5" />
                <h3 className="text-xs font-black uppercase tracking-widest">IA Predictive</h3>
              </div>
              <p className="text-xs font-medium leading-relaxed opacity-90 mb-4">
                L'IA peut recalculer les seuils optimaux en fonction du volume d'appels hebdomadaire pour reduire les faux positifs.
              </p>
              <button
                onClick={() => toast.success('Optimisation IA lancee')}
                className="w-full py-3 rounded-2xl bg-white/20 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/30 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
              >
                <Sparkles className="w-3 h-3" /> Optimisation Automatique
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Scripts Appels */}
      {activeTab === 'scripts' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Scripts d'Appels</h3>
            </div>
            <button
              onClick={() => setScripts([...scripts, { id: Date.now(), title: 'Nouveau Script', content: '', category: 'accueil' }])}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
            >
              + Script
            </button>
          </div>
          {scripts.map(script => (
            <div key={script.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-border bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-black ${
                    script.category === 'accueil' ? 'bg-emerald-500' :
                    script.category === 'objection' ? 'bg-amber-500' : 'bg-blue-500'
                  }`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <input
                    className="text-sm font-black text-foreground bg-transparent focus:outline-none"
                    value={script.title}
                    onChange={e => setScripts(scripts.map(s => s.id === script.id ? { ...s, title: e.target.value } : s))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={script.category}
                    onChange={e => setScripts(scripts.map(s => s.id === script.id ? { ...s, category: e.target.value } : s))}
                    className="px-3 py-1.5 bg-muted/40 border border-border rounded-xl text-[10px] font-bold text-foreground"
                  >
                    <option value="accueil">Accueil</option>
                    <option value="objection">Objection</option>
                    <option value="conclusion">Conclusion</option>
                  </select>
                  <button
                    onClick={() => setScripts(scripts.filter(s => s.id !== script.id))}
                    className="p-2 text-muted-foreground hover:text-red-500 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-5">
                <textarea
                  value={script.content}
                  onChange={e => setScripts(scripts.map(s => s.id === script.id ? { ...s, content: e.target.value } : s))}
                  rows={4}
                  className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  placeholder="Contenu du script..."
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: Notifications */}
      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border bg-muted/20">
              <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Canaux de Notification</h3>
            </div>
            <div className="p-6 space-y-5">
              {[
                { label: 'Alertes Email', desc: 'Recevoir les alertes critiques par email', key: 'emailAlerts' },
                { label: 'Notifications Push', desc: 'Notifications navigateur en temps reel', key: 'pushAlerts' },
                { label: 'Rapport Journalier', desc: 'Resume quotidien par email', key: 'dailyReport' },
                { label: 'Rapport Hebdomadaire', desc: 'Analyse complete chaque lundi', key: 'weeklyReport' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-muted/10 border border-border rounded-xl">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <Toggle value={notifications[item.key as keyof typeof notifications] as boolean} onChange={v => setNotifications({ ...notifications, [item.key]: v })} />
                </div>
              ))}
              <div className="grid gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email des alertes</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  value={notifications.alertEmail}
                  onChange={e => setNotifications({ ...notifications, alertEmail: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border bg-muted/20">
              <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Seuils d'Alerte</h3>
            </div>
            <div className="p-6 space-y-5">
              {[
                { label: 'Alertes Email', desc: 'Recevoir les alertes critiques par email', key: 'emailAlerts' },
                { label: 'Chute de Score', desc: 'Alerte quand le score descend sous le seuil', key: 'scoreDrop' },
                { label: 'Inactivite Agent', desc: 'Alerte si aucun appel detecte', key: 'inactivity' },
                { label: 'Faux RDV Detecte', desc: 'Alerte IA de RDV suspect', key: 'fakeRdv' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-muted/10 border border-border rounded-xl">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <Toggle value={notifications[item.key as keyof typeof notifications] as boolean} onChange={v => setNotifications({ ...notifications, [item.key]: v })} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Score minimum (%)</label>
                  <input type="number" className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={notifications.minScore} onChange={e => setNotifications({ ...notifications, minScore: +e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inactivite max (min)</label>
                  <input type="number" className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={notifications.maxInactivity} onChange={e => setNotifications({ ...notifications, maxInactivity: +e.target.value })} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Intégrations */}
      {activeTab === 'integrations' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Synchronisation CRM', desc: 'Sync bi-directionnel avec CRM externe', key: 'crmSync', icon: RefreshCw, color: 'emerald' },
              { label: 'Google Calendar', desc: 'Synchroniser les RDV automatiquement', key: 'googleCalendar', icon: Calendar, color: 'blue' },
              { label: 'Slack Notifications', desc: 'Envoyer les alertes sur Slack', key: 'slackNotif', icon: MessageSquare, color: 'purple' },
            ].map(int => {
              const bc = BADGE_COLORS[int.color] || BADGE_COLORS.emerald;
              return (
              <div key={int.key} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${bc.bg} flex items-center justify-center`}>
                    <int.icon className={`w-5 h-5 ${bc.text}`} />
                  </div>
                  <Toggle value={integrations[int.key as keyof typeof integrations] as boolean} onChange={v => setIntegrations({ ...integrations, [int.key]: v })} />
                </div>
                <h4 className="text-xs font-black uppercase tracking-widest text-foreground">{int.label}</h4>
                <p className="text-[10px] text-muted-foreground mt-1">{int.desc}</p>
              </div>
              );
            })}
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border bg-muted/20 flex items-center gap-3">
              <Webhook className="w-5 h-5 text-primary" />
              <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Configuration SMTP & Webhooks</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Webhook URL</h4>
                <input
                  className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  value={integrations.webhookUrl}
                  onChange={e => setIntegrations({ ...integrations, webhookUrl: e.target.value })}
                  placeholder="https://hooks.slack.com/..."
                />
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Configuration SMTP</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input className="px-3 py-2.5 bg-muted/40 border border-border rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={integrations.smtpHost} onChange={e => setIntegrations({ ...integrations, smtpHost: e.target.value })} placeholder="Hote SMTP" />
                  <input type="number" className="px-3 py-2.5 bg-muted/40 border border-border rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={integrations.smtpPort} onChange={e => setIntegrations({ ...integrations, smtpPort: +e.target.value })} placeholder="Port" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input className="px-3 py-2.5 bg-muted/40 border border-border rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={integrations.smtpUser} onChange={e => setIntegrations({ ...integrations, smtpUser: e.target.value })} placeholder="Utilisateur" />
                  <input type="password" className="px-3 py-2.5 bg-muted/40 border border-border rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={integrations.smtpPass} onChange={e => setIntegrations({ ...integrations, smtpPass: e.target.value })} placeholder="Mot de passe" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
