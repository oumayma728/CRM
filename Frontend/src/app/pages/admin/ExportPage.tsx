import React, { useState } from 'react';
import api from '../../services/api';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ExportPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (endpoint: string, format: 'csv' | 'xlsx', label: string) => {
    setLoading(endpoint + format);
    try {
      const res = await api.get(`/export/${endpoint}`, {
        params: { format },
        responseType: 'blob',
      });
      const ext = format === 'csv' ? 'csv' : 'xlsx';
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${label}_${new Date().toISOString().slice(0, 10)}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${label} exporté en ${format.toUpperCase()}`);
    } catch {
      toast.error(`Échec de l'export ${label}`);
    } finally {
      setLoading(null);
    }
  };

  const exports = [
    { endpoint: 'calls', label: 'Appels', icon: FileText },
    { endpoint: 'evaluations', label: 'Évaluations qualité', icon: FileSpreadsheet },
    { endpoint: 'attendance', label: 'Présences', icon: FileText },
    { endpoint: 'salaries', label: 'Salaires', icon: FileSpreadsheet },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Export des données</h1>
      <div className="grid gap-4">
        {exports.map(({ endpoint, label, icon: Icon }) => (
          <div key={endpoint} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{label}</h3>
                <p className="text-sm text-muted-foreground">Exportez les données au format CSV ou Excel</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport(endpoint, 'csv', label)}
                disabled={loading === endpoint + 'csv'}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {loading === endpoint + 'csv' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                CSV
              </button>
              <button
                onClick={() => handleExport(endpoint, 'xlsx', label)}
                disabled={loading === endpoint + 'xlsx'}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 disabled:opacity-50 flex items-center gap-2"
              >
                {loading === endpoint + 'xlsx' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Excel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
