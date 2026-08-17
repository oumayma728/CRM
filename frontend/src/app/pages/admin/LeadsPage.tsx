import React, { useState, useEffect } from 'react';
import { 
  Users, MapPin, Phone, Search, Download, Target, 
  ChevronRight, Filter, Database, TrendingUp, Sparkles,
  UserCheck, Clock
} from 'lucide-react';
import api from '../../services/api';

interface Lead {
  id: number;
  name: string;
  phone: string;
  status: string;
  postalCode: string;
  agent: string;
}

interface GeoData {
  postalCode: string;
  calls: number;
  conversions: number;
  rate: number;
  avgDuration: number;
}

const qualificationOptions = [
  'Hot - Prêt à acheter',
  'Warm - Intéressé',
  'Cold - À qualifier',
  'RDV client 1',
  'RDV client 2',
  'Rappel',
  'Refus',
  'Hors cible logement',
  'Hors cible langue'
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [geoData, setGeoData] = useState<GeoData[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('leads');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const leadsRes = await api.getLeads();
      setLeads(leadsRes || []);
      
      const geoRes = await api.getGeoAnalysis();
      const departments = geoRes.departments || [];
      const mappedGeo: GeoData[] = departments.map((d: any) => ({
        postalCode: d.dept || '??',
        calls: d.total || 0,
        conversions: Math.round((d.total || 0) * (d.avg_score || 0) / 100),
        rate: d.avg_score || 0,
        avgDuration: d.avg_duration || 0,
      }));
      setGeoData(mappedGeo);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = (lead.name || '').toLowerCase().includes(search.toLowerCase()) || (lead.phone || '').includes(search);
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
            Leads & <span className="text-primary">CRM</span>
          </h1>
        
        </div>
        <div className="flex items-center gap-2">
           <input
             type="file"
             id="import-leads"
             className="hidden"
             accept=".csv,.xlsx,.xls"
             onChange={async (e) => {
               const file = e.target.files?.[0];
               if (file) {
                 const formData = new FormData();
                 formData.append('file', file);
                 try {
                   const res = await fetch('http://127.0.0.1:8000/api/leads/import', {
                     method: 'POST',
                     body: formData
                   });
                   if (res.ok) {
                     alert('Import réussi !');
                     fetchData();
                   } else {
                     alert('Erreur lors de l\'import');
                   }
                 } catch (err) {
                   alert('Erreur de connexion');
                 }
               }
             }}
           />
           <button 
             onClick={() => document.getElementById('import-leads')?.click()}
             className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20"
           >
             <Database className="w-4 h-4" />
             Importer CSV
           </button>
           <button 
             onClick={() => {
               if (leads.length === 0) return;
               const headers = ['ID', 'Nom', 'Téléphone', 'Statut', 'Code Postal', 'Agent'];
               const rows = leads.map(l => [l.id, l.name, l.phone, l.status, l.postalCode, l.agent]);
               const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
               const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
               const link = document.createElement("a");
               const url = URL.createObjectURL(blob);
               link.setAttribute("href", url);
               link.setAttribute("download", `export_leads_${new Date().toISOString().split('T')[0]}.csv`);
               link.style.visibility = 'hidden';
               document.body.appendChild(link);
               link.click();
               document.body.removeChild(link);
             }}
             className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
           >
             <Download className="w-4 h-4" />
             Exporter
           </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex bg-card p-1 rounded-2xl border border-border w-fit">
        <button
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'leads' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Database className="w-4 h-4" />
          Liste des Leads
        </button>
        <button
          onClick={() => setActiveTab('geo')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'geo' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Analyse Géo
        </button>
      </div>

      {activeTab === 'leads' ? (
        <div className="space-y-4">
          <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Rechercher par nom ou téléphone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-transparent rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>
            <div className="flex items-center gap-2 bg-muted/40 px-4 py-2.5 rounded-xl border border-transparent">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}

              >
                <option value="all" className="text-slate-900 dark:text-foreground">Tous les Statuts</option>
                {qualificationOptions.map(opt => (
                  <option key={opt} value={opt} className="text-slate-900 dark:text-foreground">{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                   <thead>
                      <tr className="bg-muted/10 border-b border-border">
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prospect</th>
                         <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact</th>
                         <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Statut IA</th>
                         <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Région</th>
                         <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Agent</th>
                         <th className="px-6 py-4 text-right"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-border">
                      {filteredLeads.map((lead, idx) => (
                        <tr key={lead.id || `lead-${idx}`} className="hover:bg-muted/20 transition-colors group">
                           <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                 <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <UserCheck className="w-5 h-5" />
                                 </div>
                                 <span className="font-black text-foreground uppercase text-xs tracking-tight">{lead.name}</span>
                              </div>
                           </td>
                           <td className="px-4 py-5 font-bold text-muted-foreground">
                              {lead.phone}
                           </td>
                           <td className="px-4 py-5">
                              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider text-white shadow-sm ${
                                (lead.status || '').includes('RDV') ? 'bg-emerald-500 shadow-emerald-500/20' :
                                (lead.status || '').includes('Hot') ? 'bg-orange-500 shadow-orange-500/20' :
                                (lead.status || '').includes('Refus') ? 'bg-red-500' : 'bg-slate-500'
                              }`}>
                                 {lead.status || 'En attente'}
                              </span>
                           </td>
                           <td className="px-4 py-5 font-bold text-xs">
                              {lead.postalCode}
                           </td>
                           <td className="px-4 py-5">
                              <div className="flex items-center gap-2">
                                 <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-[8px] font-black uppercase">
                                    {(lead.agent || '').substring(0, 2) || '??'}
                                 </div>
                                 <span className="text-[10px] font-bold">{lead.agent}</span>
                              </div>
                           </td>
                           <td className="px-6 py-5 text-right">
                              <button className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                                 <ChevronRight className="w-4 h-4" />
                              </button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
             {filteredLeads.length === 0 && (
               <div className="p-20 text-center">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Aucun prospect trouvé</p>
               </div>
             )}
          </div>
        </div>
      ) : (
        /* Geo Analysis Tab (Premium Grid View) */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
           {/* Statistics Sidebar */}
           <div className="lg:col-span-1 space-y-4">
             <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Secteur "Gold"</h3>
               <div className="text-center p-6 bg-primary/5 border border-primary/20 rounded-2xl mb-4">
                  <div className="text-3xl font-black text-primary mb-1">
                    {geoData.length > 0 ? [...geoData].sort((a,b) => b.rate - a.rate)[0].postalCode : 'N/A'}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Top Performance</p>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Appels Totaux</span>
                    <span className="text-sm font-black">{geoData.reduce((sum, g) => sum + g.calls, 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Taux Moyen</span>
                    <span className="text-sm font-black text-primary">
                      {geoData.length > 0 ? (geoData.reduce((sum, g) => sum + g.rate, 0) / geoData.length).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Durée Moyenne</span>
                    <span className="text-sm font-black text-amber-500">
                      {geoData.length > 0
                        ? `${Math.floor(geoData.reduce((s, g) => s + g.avgDuration, 0) / geoData.length / 60)}m ${Math.round(geoData.reduce((s, g) => s + g.avgDuration, 0) / geoData.length % 60)}s`
                        : '0m 0s'}
                    </span>
                  </div>
               </div>
             </div>

             <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Insights Géo</h3>
               <div className="space-y-3">
                 <div className="flex gap-2">
                    <Sparkles className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-medium leading-relaxed italic opacity-80">Les zones urbaines montrent une réceptivité +12% supérieure ce mois-ci.</p>
                 </div>
               </div>
             </div>
           </div>

           {/* Interactive Grid Map */}
           <div className="lg:col-span-3 bg-card border border-border rounded-3xl p-8 shadow-sm relative overflow-hidden flex flex-col">
             <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
               <MapPin className="w-96 h-96" />
             </div>
             
             <div className="flex items-center justify-between mb-8 relative z-10">
               <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Visualisation Territoriale
               </h3>
               <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                     <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                     <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Optimisé</span>
                  </div>
               </div>
             </div>

             <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
               {geoData.map((region, i) => (
                 <div key={i} className="group relative">
                   <div className={`h-full p-6 rounded-3xl border-2 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl cursor-pointer overflow-hidden relative ${
                     region.rate >= 60 ? 'bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/5' :
                     region.rate >= 40 ? 'bg-primary/5 border-primary/20 shadow-primary/5' :
                     'bg-orange-500/5 border-orange-500/20 shadow-orange-500/5'
                   }`}>
                     <div className="relative z-10">
                       <div className="flex justify-between items-start mb-6">
                         <div className={`p-2.5 rounded-xl shadow-lg ${
                           region.rate >= 60 ? 'bg-emerald-500 text-white' :
                           region.rate >= 40 ? 'bg-primary text-white' :
                           'bg-orange-500 text-white'
                         }`}>
                           <MapPin className="w-4 h-4" />
                         </div>
                          <div className="flex items-center gap-2 text-[9px] font-black uppercase text-muted-foreground">
                            <span>{region.calls} Appels</span>
                            <span className="text-muted-foreground/30">|</span>
                            <Clock className="w-3 h-3" />
                            <span>{Math.floor(region.avgDuration / 60)}m {Math.round(region.avgDuration % 60)}s</span>
                          </div>
                       </div>
                       
                       <h4 className="text-lg font-black italic tracking-tighter uppercase mb-1">Zone {region.postalCode}</h4>
                       <div className="flex items-baseline gap-1 mb-4">
                         <span className="text-3xl font-black text-foreground">{region.rate}%</span>
                         <span className="text-[10px] font-black uppercase text-muted-foreground opacity-50">Taux</span>
                       </div>

                       <div className="space-y-2">
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                             <div className={`h-full transition-all duration-1000 ${
                               region.rate >= 60 ? 'bg-emerald-500' :
                               region.rate >= 40 ? 'bg-primary' :
                               'bg-orange-500'
                             }`} style={{ width: `${region.rate}%` }}></div>
                          </div>
                          <div className="flex justify-between text-[9px] font-black uppercase opacity-40">
                             <span>Conversions: {region.conversions}</span>
                          </div>
                       </div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      )}
    </div>
  );
}