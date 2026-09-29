import { API_BASE, getToken } from '../../services/api';
import React, { useEffect, useState } from 'react';
import { Shield, Plus, X } from 'lucide-react';

interface LogEntry {
  membre: string;
  id: string;
  role: string;
  dateCreation: string;
}

interface CreateForm {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
}

export default function GererAcces() {
  const [logs,      setLogs]     = useState<LogEntry[]>([]);
  const [loading,   setLoading]  = useState(true);
  const [showForm,  setShowForm] = useState(false);
  const [form,      setForm]     = useState<CreateForm>({ nom: '', prenom: '', email: '', motDePasse: '' });
  const [saving,    setSaving]   = useState(false);
  const [error,     setError]    = useState('');

  const token = () => getToken();

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = () => {
    fetch(`${API_BASE}/technique/logs`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => { setLogs(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const handleCreate = async () => {
    if (!form.nom || !form.email) { setError('Nom et email sont obligatoires'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/technique/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ nom: '', prenom: '', email: '', motDePasse: '' });
        fetchLogs();
      } else {
        const data = await res.json();
        setError(data.message || 'Erreur lors de la création');
      }
    } catch {
      setError('Erreur réseau');
    }
    setSaving(false);
  };

  const roleLabel = (role: string) => ({ TECH: 'Technique', ADMIN: 'Admin', AGENT: 'Agent', QUALITE: 'Qualité', CONFIRMATRICE: 'Confirmatrice', COMMERCIAL: 'Commercial' }[role] || role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Gérer les accès</h1>
          <p className="text-muted-foreground">Gestion des comptes et logs d'accès</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
        >
          <Plus size={16} />
          Créer nouveau log
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Créer un nouveau compte</h3>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Nom *', key: 'nom' },
              { label: 'Prénom', key: 'prenom' },
              { label: 'Email (ID) *', key: 'email' },
              { label: 'Mot de passe', key: 'motDePasse', type: 'password' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm text-muted-foreground mb-1">{f.label}</label>
                <input
                  type={f.type || 'text'}
                  value={(form as any)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none"
                  placeholder={f.key === 'motDePasse' ? 'Laisser vide pour Temp@1234' : ''}
                />
              </div>
            ))}
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <div className="flex gap-3 mt-4 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted">Annuler</button>
            <button onClick={handleCreate} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50">
              {saving ? 'Création...' : 'Créer'}
            </button>
          </div>
        </div>
      )}

      {/* Table des logs */}
      <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
        <div className="p-4 border-b font-semibold flex items-center gap-2">
          <Shield size={16} className="text-primary" />
          Logs
        </div>
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {['Membre', 'ID (Email)', 'Rôle', 'Date de création'].map(h => (
                  <th key={h} className="p-3 text-left text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((l, i) => (
                <tr key={i} className="border-t hover:bg-muted">
                  <td className="p-3 font-medium">{l.membre}</td>
                  <td className="p-3">{l.id}</td>
                  <td className="p-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground">
                      {roleLabel(l.role)}
                    </span>
                  </td>
                  <td className="p-3">{l.dateCreation}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Aucun log trouvé</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
