import { API_BASE, getToken } from '../../../services/api';
import React, { useEffect, useState } from 'react';
import { FileText, Upload, Download, Trash2, Calendar, Users } from 'lucide-react';

interface FichierContact {
  id: number;
  nom: string;
  dateInjection: string;
  nombreContacts: number;
  statut: string;
}

async function downloadCsv(url: string, fallbackName: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) { alert("Échec de l'export"); return; }
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = res.headers.get('content-disposition')?.match(/filename="?([^";]+)"?/)?.[1] ?? fallbackName;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function FichiersContacts() {
  const [fichiers, setFichiers] = useState<FichierContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [campagne, setCampagne] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFichiers();
  }, []);

  const fetchFichiers = async () => {
    try {
      const response = await fetch(`${API_BASE}/confirmation1/fichiers-contacts`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setFichiers(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('campagne', campagne);
    try {
      await fetch(`${API_BASE}/confirmation1/upload-contacts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData
      });
      setShowUpload(false);
      setSelectedFile(null);
      setCampagne('');
      fetchFichiers();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleExport = async (id: number) => {
    downloadCsv(`${API_BASE}/confirmation1/export-contacts/${id}`, `contacts_${id}.csv`);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer ce fichier ?')) {
      await fetch(`${API_BASE}/confirmation1/fichiers-contacts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      fetchFichiers();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Fichiers Contacts</h1>
          <p className="text-muted-foreground">Gestion des listes de contacts</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          <Upload size={16} /> Importer
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-primary">{fichiers.length}</div>
          <div className="text-sm text-muted-foreground">Fichiers importés</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-success">{fichiers.reduce((sum, f) => sum + f.nombreContacts, 0)}</div>
          <div className="text-sm text-muted-foreground">Total contacts</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-warning">{fichiers.filter(f => f.statut === 'EN_COURS').length}</div>
          <div className="text-sm text-muted-foreground">En cours</div>
        </div>
      </div>

      {/* Liste des fichiers */}
      <div className="space-y-3">
        {fichiers.map((fichier) => (
          <div key={fichier.id} className="glass-card p-4 flex justify-between items-center hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <FileText size={32} className="text-primary" />
              <div>
                <div className="font-medium">{fichier.nom}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1"><Calendar size={12} />{new Date(fichier.dateInjection).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Users size={12} />{fichier.nombreContacts} contacts</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${fichier.statut === 'TERMINE' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
                    {fichier.statut === 'TERMINE' ? 'Terminé' : 'En cours'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleExport(fichier.id)} className="p-2 hover:bg-muted rounded" title="Exporter"><Download size={18} /></button>
              <button onClick={() => handleDelete(fichier.id)} className="p-2 hover:bg-destructive/15 rounded text-destructive" title="Supprimer"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
        {fichiers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Aucun fichier importé</div>
        )}
      </div>

      {/* Modal upload */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Importer une liste de contacts</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fichier CSV/Excel</label>
                <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nom de la campagne</label>
                <input type="text" value={campagne} onChange={(e) => setCampagne(e.target.value)} className="w-full p-2 border rounded" placeholder="Campagne été 2026" />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowUpload(false)} className="px-4 py-2 border rounded hover:bg-muted">Annuler</button>
                <button onClick={handleUpload} disabled={!selectedFile || uploading} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50">
                  {uploading ? 'Upload...' : 'Importer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}