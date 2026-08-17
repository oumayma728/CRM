import React, { useState, useEffect } from 'react';
import {
  Upload, FileText, Users, Download, Play, Trash2,
  Eye, Clock, CheckCircle, XCircle, AlertCircle,
  HardDrive, Inbox, Filter, ChevronLeft, ChevronRight,
  Plus, Archive, RefreshCw, Building2, ChevronDown,
  Calendar, Settings2, ShieldAlert, SlidersHorizontal, ArrowRight, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type PendingFile = {
  id: number;
  fileName: string;
  recordCount: number;
  campaignTarget: string;
  uploadDate: string;
  fileSize: string;
  status: 'Staged' | 'Injecting' | 'Injected' | 'Failed';
  companyId: number;
  fileFormat: 'csv' | 'xlsx';
  distributionMode?: 'round-robin' | 'random' | 'performance';
  leadsPerAgent?: number;
  leadsPerAgentUnit?: 'day' | 'session' | 'total';
  teamTarget?: string;
  priority?: 'high' | 'normal' | 'low';
  dedupStrategy?: 'ignore' | 'update' | 'create';
  scheduledAt?: string;
};

// --- KPICard Component ---
function KPICard({ title, value, icon: Icon, color }: { title: string; value: any; icon: any; color: string }) {
  const colors: Record<string, string> = {
    primary: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    destructive: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const colorClass = colors[color] || colors.primary;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
      <div className={`absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500`}>
        <Icon className="w-16 h-16" />
      </div>
      <div className="flex items-center gap-3 relative z-10">
        <div className={`p-2 rounded-xl ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]} border ${colorClass.split(' ')[2]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</p>
          <p className="text-2xl font-black tracking-tighter text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function FichierAcharge() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Staged' | 'Injected'>('all');
  const [stats, setStats] = useState({ total: 0, campaigns: [], statuses: [] });

  useEffect(() => {
    fetch('http://localhost:8000/api/leads/stats')
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  const totalFiles = stats.campaigns.length;
  const totalRecords = stats.total;
  const scheduledCount = 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-primary pl-6">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
            Console de <span className="text-primary">Transition</span>
          </h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1 opacity-70">
            Zone de transit — Historique et distribution des leads importés
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/import-leads')}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-black uppercase italic tracking-tighter hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <Upload className="w-5 h-5" />
          Nouvel import
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Campagnes" value={totalFiles} icon={FileText} color="primary" />
        <KPICard title="Total Leads" value={totalRecords.toLocaleString()} icon={Users} color="info" />
        <KPICard title="Statuts" value={stats.statuses.length} icon={Building2} color="success" />
        <KPICard title="Programmés" value={scheduledCount} icon={Calendar} color="warning" />
      </div>

      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-2">
            {(['all', 'Staged', 'Injected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  statusFilter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {f === 'all' ? 'Tous' : f === 'Staged' ? 'En attente' : 'Injectés'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1 rounded-xl shadow-lg border border-white/20">
             <div className="pl-3 py-2">
               <Filter className="w-4 h-4 text-slate-400" />
             </div>
<input
                type="text"
                placeholder="Rechercher une campagne..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pr-4 pl-1 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest focus:outline-none rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr className="border-b border-border">
              <th className="text-left p-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Campagne</th>
              <th className="text-left p-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Nombre de Leads</th>
              <th className="text-right p-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {stats.campaigns.length > 0 ? (
              stats.campaigns.filter((c: any) => c.campaign_name.toLowerCase().includes(searchTerm.toLowerCase())).map((c: any) => (
                <tr key={c.campaign_name} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="p-4 font-bold text-foreground italic">{c.campaign_name}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-black">
                      {c.count} Leads
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 hover:bg-primary/20 rounded-lg text-primary transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="p-12 text-center text-muted-foreground italic">Aucun fichier importé en base de données</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
