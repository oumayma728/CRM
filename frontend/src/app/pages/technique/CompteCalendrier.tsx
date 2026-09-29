import { API_BASE, getToken } from '../../services/api';
import React, { useState } from 'react';
import { Calendar, CheckCircle } from 'lucide-react';

export default function CompteCalendrier() {
  const [calId,    setCalId]    = useState('');
  const [mdp,      setMdp]      = useState('');
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState('');
  const [error,    setError]    = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calId || !mdp) { setError('ID et mot de passe sont obligatoires'); return; }
    setSaving(true); setError(''); setSuccess('');

    try {
      const res = await fetch(`${API_BASE}/technique/calendrier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ calId, motDePasse: mdp }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Compte calendrier créé avec succès le ${data.createdAt}`);
        setCalId('');
        setMdp('');
      } else {
        setError(data.message || 'Erreur lors de la création');
      }
    } catch {
      setError('Erreur réseau');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Compte Calendrier</h1>
        <p className="text-muted-foreground">Créer un accès au calendrier partagé EBI</p>
      </div>

      <div className="max-w-md">
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar size={20} className="text-primary" />
            <span className="font-semibold">Ajouter compte calendrier</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Créer ID
              </label>
              <input
                type="text"
                value={calId}
                onChange={e => setCalId(e.target.value)}
                placeholder="ex: agenda.ebi2026"
                className="glass-input w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={mdp}
                onChange={e => setMdp(e.target.value)}
                placeholder="••••••••"
                className="glass-input w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>
            )}
            {success && (
              <div className="flex items-center gap-2 text-success bg-success/10 rounded px-3 py-2 text-sm">
                <CheckCircle size={16} />
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition font-medium"
            >
              {saving ? 'Création...' : 'Créer le compte'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
