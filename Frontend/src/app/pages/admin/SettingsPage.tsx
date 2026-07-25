import React, { useState, useEffect } from 'react';
import {
  Settings, Sliders, Bell, Shield, Save, RotateCcw,
  AlertTriangle, CheckCircle, Loader2
} from 'lucide-react';
import api from '../../../services/api';

const CRITERIA_LABELS: Record<string, string> = {
  accueil: 'Accueil & Identification',
  energie: 'Énergie & Dynamisme',
  voix: 'Qualité vocale & Débit',
  ecoute: 'Écoute active & Reformulation',
  client: 'Orientation Client & Empathie',
  ope: 'Compétences Opérationnelles',
  efficacite: 'Efficacité & Wait Management',
  conclusion: 'Conclusion & Engagement'
};

const DEFAULT_WEIGHTS: Record<string, number> = {
  accueil: 15, energie: 10, voix: 10, ecoute: 20,
  client: 15, ope: 10, efficacite: 10, conclusion: 10
};

type Tab = 'weights' | 'alerts';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<Tab>('weights');
  const [weights, setWeights] = useState<Record<string, number>>({ ...DEFAULT_WEIGHTS });
  const [alerts, setAlerts] = useState({ lowScore: 40, inactivityMinutes: 30, lowConversion: 10 });

  useEffect(() => {
    api.get('/config')
      .then(res => {
        if (res.data?.weights) {
          const w = res.data.weights;
          setWeights({
            accueil: Math.round((w.accueil || 0) * 100),
            energie: Math.round((w.energie || 0) * 100),
            voix: Math.round((w.voix || 0) * 100),
            ecoute: Math.round((w.ecoute || 0) * 100),
            client: Math.round((w.client || 0) * 100),
            ope: Math.round((w.ope || 0) * 100),
            efficacite: Math.round((w.efficacite || 0) * 100),
            conclusion: Math.round((w.conclusion || 0) * 100),
          });
        }
        if (res.data?.alerts) setAlerts(res.data.alerts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalWeight = Object.values(weights).reduce((s, v) => s + v, 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      const weightsPayload: Record<string, number> = {};
      Object.entries(weights).forEach(([k, v]) => { weightsPayload[k] = v / 100; });
      await api.put('/config', { weights: weightsPayload, alerts });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Save config error:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await api.post('/config/reset');
      setWeights({ ...DEFAULT_WEIGHTS });
      setAlerts({ lowScore: 40, inactivityMinutes: 30, lowConversion: 10 });
    } catch (e) {
      console.error('Reset error:', e);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'weights', label: 'Pondération IA', icon: Sliders },
    { id: 'alerts', label: 'Seuils d\'alerte', icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-primary pl-6">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
            <Settings className="w-6 h-6 inline mr-2" /> Configuration
          </h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1 opacity-70">
            Personnalisation des critères qualité et alertes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="px-3 py-2 bg-muted text-foreground text-[10px] font-black uppercase tracking-widest rounded-lg border border-border hover:bg-destructive/10 hover:border-destructive/30 transition-all flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Réinitialiser
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-all flex items-center gap-2">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            {saving ? 'Sauvegarde...' : saved ? '✓ Sauvegardé' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${
              tab === t.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'weights' && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-black uppercase tracking-widest">Critères d'évaluation IA</h3>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${totalWeight === 100 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
              Total: {totalWeight}%
            </span>
          </div>
          {Object.entries(weights).map(([key, value]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">{CRITERIA_LABELS[key] || key}</label>
                <span className="text-sm font-bold text-muted-foreground">{value}%</span>
              </div>
              <input type="range" min="0" max="50" value={value}
                onChange={e => setWeights(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
            </div>
          ))}
          {totalWeight !== 100 && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-amber-500 font-medium">Le total doit être 100% (actuellement {totalWeight}%)</span>
            </div>
          )}
        </div>
      )}

      {tab === 'alerts' && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest mb-4">Seuils de détection</h3>
          <div>
            <label className="text-sm font-medium mb-1 block">Score minimum avant alerte</label>
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="100" value={alerts.lowScore}
                onChange={e => setAlerts(prev => ({ ...prev, lowScore: Number(e.target.value) }))}
                className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
              <span className="text-sm font-bold w-8">{alerts.lowScore}</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Minutes d'inactivité avant alerte</label>
            <div className="flex items-center gap-3">
              <input type="range" min="5" max="120" value={alerts.inactivityMinutes}
                onChange={e => setAlerts(prev => ({ ...prev, inactivityMinutes: Number(e.target.value) }))}
                className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
              <span className="text-sm font-bold w-8">{alerts.inactivityMinutes}min</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Taux de conversion minimum</label>
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="100" value={alerts.lowConversion}
                onChange={e => setAlerts(prev => ({ ...prev, lowConversion: Number(e.target.value) }))}
                className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
              <span className="text-sm font-bold w-8">{alerts.lowConversion}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
