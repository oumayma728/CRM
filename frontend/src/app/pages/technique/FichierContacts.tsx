import { API_BASE, getToken } from '../../services/api';
import React, { useEffect, useState } from 'react';
import { FileText, Download, Upload } from 'lucide-react';

interface Fichier {
  id: number;
  nom: string;
  dateImport: string;
  nbContacts: number;
  statut: string;
  source: string;
}

export default function FichierContacts() {
  const [fichiers, setFichiers] = useState<Fichier[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [file,     setFile]     = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const token = () => getToken();

  useEffect(() => { fetchFichiers(); }, []);

  const fetchFichiers = () => {
    fetch(`${API_BASE}/technique/fichiers`, {
      headers: { Authorization: `Bearer ${token()}` }
    })
      .then(r => r.json())
      .then(d => { setFichiers(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const exportCsv = async (id: number, nom: string) => {
    const res = await fetch(`${API_BASE}/technique/fichiers/${id}/export`, {
      headers: { Authorization: `Bearer ${token()}` }
    });
    if (!res.ok) { alert('Export impossible'); return; }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${nom}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/technique/fichiers/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body: form,
      });
      // The server now answers with the real numbers (contacts imported / refused) or the reason of the refusal.
      const body = await res.json().catch(() => null);
      if (res.ok) {
        alert(body?.message ?? 'Fichier importé avec succès !');
        setShowForm(false);
        setFile(null);
        fetchFichiers();
      } else {
        alert(body?.message ?? 'Erreur lors de l\'import');
      }
    } catch {
      alert('Erreur réseau');
    }
    setUploading(false);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Fichier des contacts</h1>
          <p className="text-muted-foreground">Gestion des listes de contacts importées</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
        >
          <Upload size={16} />
          Injecter une liste
        </button>
      </div>

      {/* Formulaire d'injection */}
      {showForm && (
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-4">Importer un fichier CSV</h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm text-muted-foreground mb-1">Fichier CSV</label>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-primary file:text-white hover:file:opacity-90"
              />
            </div>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-4 py-2 bg-success text-success-foreground rounded-lg hover:bg-success/90 disabled:opacity-50 transition"
            >
              {uploading ? 'Import...' : 'Importer'}
            </button>
            <button
              onClick={() => { setShowForm(false); setFile(null); }}
              className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Table des fichiers */}
      <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
        <div className="p-4 border-b font-semibold">
          Listes des contacts
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              {['Liste', 'Date injection', 'Nombre de contacts', 'Source', 'Statut', 'Action'].map(h => (
                <th key={h} className="p-3 text-left text-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fichiers.map(f => (
              <tr key={f.id} className="border-t hover:bg-muted">
                <td className="p-3 font-medium flex items-center gap-2">
                  <FileText size={14} className="text-muted-foreground" />
                  {f.nom}
                </td>
                <td className="p-3">{f.dateImport}</td>
                <td className="p-3">{f.nbContacts.toLocaleString()}</td>
                <td className="p-3">{f.source || '—'}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    f.statut === 'TERMINE'
                      ? 'bg-success/15 text-success'
                      : f.statut === 'EN_COURS'
                      ? 'bg-primary/15 text-primary'
                      : 'bg-destructive/15 text-destructive'
                  }`}>
                    {f.statut}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => exportCsv(f.id, f.nom)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Download size={13} />
                    Exporter csv
                  </button>
                </td>
              </tr>
            ))}
            {fichiers.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Aucun fichier importé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
