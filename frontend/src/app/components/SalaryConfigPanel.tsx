/**
 * Paramètres de rémunération par type de contrat (GET/PUT /api/salaries/config).
 * Carried over from feature/zied1's salary page; editable by the super admin only.
 */
import { useEffect, useState } from 'react';
import { Settings2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE, getAuthHeaders } from '../services/api';

type SalaryConfig = Record<string, number>;

const CONTRACTS = [
  { prefix: 'pt', label: 'Plein temps' },
  { prefix: 'mt', label: 'Mi-temps' },
];

const FIELDS: { key: string; label: string; isInt?: boolean; hint?: string }[] = [
  { key: 'base_salary', label: 'Salaire de base (€)' },
  { key: 'prime_assiduite', label: 'Prime assiduité (€)' },
  { key: 'seuil_rdv', label: 'Seuil RDV', isInt: true, hint: 'RDV requis pour la prime' },
  { key: 'install1', label: '1ʳᵉ installation (€)' },
  { key: 'install_extra', label: 'Installation suppl. (€)' },
];

export function SalaryConfigPanel({ editable }: { editable: boolean }) {
  const [draft, setDraft] = useState<SalaryConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/salaries/config`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => cfg && setDraft(cfg))
      .catch(() => setDraft(null));
  }, []);

  if (!draft) return null;

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/salaries/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error();
      toast.success('Paramètres de rémunération sauvegardés');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Settings2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Paramètres de rémunération</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Base, primes et seuils par type de contrat
            </p>
          </div>
        </div>
        {editable && (
          <button
            onClick={save}
            disabled={saving}
            className="h-9 px-4 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {CONTRACTS.map(({ prefix, label }) => (
          <div key={prefix} className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">{label}</p>
            <div className="grid grid-cols-2 gap-3">
              {FIELDS.map(({ key, label: fieldLabel, isInt, hint }) => {
                const k = `${prefix}_${key}`;
                return (
                  <div key={k}>
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      {fieldLabel}
                    </label>
                    <input
                      type="number"
                      step={isInt ? '1' : '0.01'}
                      min="0"
                      value={draft[k] ?? ''}
                      disabled={!editable}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d!, [k]: isInt ? parseInt(e.target.value) || 0 : parseFloat(e.target.value) || 0 }))
                      }
                      className="glass-input w-full px-4 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {hint && <p className="text-[9px] text-muted-foreground mt-1">{hint}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
