import React, { useState, useEffect } from 'react';
import {
  MapPin, TrendingUp, Filter, Globe, Map as MapIcon,
  Navigation, MousePointer2, Target, Users, ArrowUpRight,
  Loader2, Clock, CheckCircle, XCircle, Timer, Award,
  Phone, BarChart3, X, Sun
} from 'lucide-react';
import api from '../../services/api';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4', '#f43f5e'];

interface RegionData {
  id: number;
  region: string;
  appels: number;
  conversions: number;
  taux: number;
  avgDuration: number;
  color: string;
  confirmed: number;
  refused: number;
  waiting: number;
  peakHour: string | null;
  bestAgent: string | null;
}

export default function MapPage() {
  const [hoveredRegion, setHoveredRegion] = useState<any>(null);
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getGeoAnalysis();
      const depts: RegionData[] = (res.departments || []).map((d: any, idx: number) => ({
        id: idx + 1,
        region: `Dépt. ${d.dept}`,
        appels: d.total,
        conversions: Math.round((d.total || 0) * (d.avg_score || 0) / 100),
        taux: d.avg_score || 0,
        avgDuration: d.avg_duration || 0,
        confirmed: d.confirmed || 0,
        refused: d.refused || 0,
        waiting: d.waiting || 0,
        peakHour: d.peak_hour || null,
        bestAgent: d.best_agent || null,
        color: COLORS[idx % COLORS.length],
      }));
      setRegions(depts);
    } catch (e) {
      console.error('Error loading geo data:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = regions;

  const totalCalls = filteredData.reduce((sum, r) => sum + r.appels, 0);
  const totalConvs = filteredData.reduce((sum, r) => sum + r.conversions, 0);
  const avgTaux = filteredData.length > 0 ? (filteredData.reduce((sum, r) => sum + r.taux, 0) / filteredData.length).toFixed(1) : '0';
  const avgDurationSecs = filteredData.length > 0
    ? Math.round(filteredData.reduce((sum, r) => sum + r.avgDuration, 0) / filteredData.length)
    : 0;
  const totalConfirmed = filteredData.reduce((sum, r) => sum + (r.confirmed || 0), 0);
  const totalRefused = filteredData.reduce((sum, r) => sum + (r.refused || 0), 0);
  const totalWaiting = filteredData.reduce((sum, r) => sum + (r.waiting || 0), 0);
  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-3 text-muted-foreground">Chargement des données géographiques...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
          <Globe className="w-40 h-40" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Intelligence Territoriale</span>
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
            Distribution <span className="text-primary">Géo-Lead</span>
          </h1>
          <p className="text-muted-foreground text-xs font-medium mt-1">Analyse des flux de conversion par zone géographique</p>
        </div>
        
        <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-xl border border-border relative z-10">
          <Globe className="w-4 h-4 text-primary" />
          <span className="text-xs font-black uppercase tracking-widest text-foreground">Toutes les zones</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{filteredData.length}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Départements</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{totalCalls.toLocaleString()}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Appels total</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{avgTaux}%</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Score moyen</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{formatDuration(avgDurationSecs)}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Durée moyenne</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Statistics Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">KPIs Régionaux</h3>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-emerald-500">{totalConvs.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Conversions Géo</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Target className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-emerald-400">{totalConfirmed.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Confirmés</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-red-400">{totalRefused.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Refusés</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-amber-400">{totalWaiting.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">En attente</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Top Performers</h3>
            <div className="space-y-3">
              {filteredData.sort((a, b) => b.taux - a.taux).slice(0, 4).map((r, i) => (
                <div key={r.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px]" style={{ backgroundColor: `${r.color}20`, color: r.color }}>
                    #{i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase text-foreground">{r.region}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">{r.conversions} RDV</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-primary">{r.taux}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Grid Map */}
        <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-8 shadow-sm relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
            <MapIcon className="w-96 h-96" />
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
               <div className="flex items-center gap-1.5 ml-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Critique</span>
               </div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6 relative z-10">
            {filteredData.map((region) => (
              <div
                key={region.id}
                onMouseEnter={() => setHoveredRegion(region)}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => setSelectedRegion(selectedRegion?.id === region.id ? null : region)}
                className="group relative"
              >
                <div className={`h-full p-6 rounded-3xl border-2 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl cursor-pointer overflow-hidden relative ${
                  selectedRegion?.id === region.id
                    ? 'ring-2 ring-primary shadow-xl scale-[1.02]'
                    : ''
                } ${
                  region.taux >= 63 ? 'bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/5' :
                  region.taux >= 59 ? 'bg-primary/5 border-primary/20 shadow-primary/5' :
                  'bg-orange-500/5 border-orange-500/20 shadow-orange-500/5'
                }`}>
                  {/* Glow effect on hover */}
                  <div className="absolute -inset-20 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-3xl" />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-2.5 rounded-xl shadow-lg ${
                        region.taux >= 63 ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                        region.taux >= 59 ? 'bg-primary text-white shadow-primary/20' :
                        'bg-orange-500 text-white shadow-orange-500/20'
                      }`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase">{region.appels}</span>
                        <span className="text-muted-foreground/30">|</span>
                        <Clock className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase">{formatDuration(Math.round(region.avgDuration))}</span>
                      </div>
                    </div>
                    
                    <h4 className="text-lg font-black italic tracking-tighter uppercase mb-1">{region.region}</h4>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-black text-foreground">{region.taux}%</span>
                      <span className="text-[10px] font-black uppercase text-muted-foreground opacity-50">Taux</span>
                    </div>

                    <div className="space-y-2">
                       <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-1000 ${
                            region.taux >= 63 ? 'bg-emerald-500' :
                            region.taux >= 59 ? 'bg-primary' :
                            'bg-orange-500'
                          }`} style={{ width: `${region.taux}%` }}></div>
                       </div>
                       <div className="flex justify-between text-[9px] font-black uppercase opacity-40">
                          <span>0%</span>
                          <span>{region.conversions} RDV</span>
                       </div>
                    </div>
                    
                    <button className="mt-6 w-full py-2 rounded-xl bg-muted/50 border border-border text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center gap-2 group-hover:shadow-lg">
                      Détails Flux <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail Panel */}
          {selectedRegion && (
            <div className="mt-6 p-6 rounded-2xl border border-border bg-muted/10 relative z-10 animate-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {selectedRegion.region} — Analyse détaillée
                </h4>
                <button
                  onClick={() => setSelectedRegion(null)}
                  className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-card rounded-xl p-3 border border-border">
                  <div className="flex items-center gap-2 text-emerald-400 mb-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Confirmés</span>
                  </div>
                  <p className="text-xl font-black text-foreground">{selectedRegion.confirmed}</p>
                </div>
                <div className="bg-card rounded-xl p-3 border border-border">
                  <div className="flex items-center gap-2 text-red-400 mb-1">
                    <XCircle className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Refusés</span>
                  </div>
                  <p className="text-xl font-black text-foreground">{selectedRegion.refused}</p>
                </div>
                <div className="bg-card rounded-xl p-3 border border-border">
                  <div className="flex items-center gap-2 text-amber-400 mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">En attente</span>
                  </div>
                  <p className="text-xl font-black text-foreground">{selectedRegion.waiting}</p>
                </div>
                <div className="bg-card rounded-xl p-3 border border-border">
                  <div className="flex items-center gap-2 text-sky-400 mb-1">
                    <Sun className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Heure pointe</span>
                  </div>
                  <p className="text-xl font-black text-foreground">{selectedRegion.peakHour || 'N/A'}</p>
                </div>
                <div className="bg-card rounded-xl p-3 border border-border">
                  <div className="flex items-center gap-2 text-purple-400 mb-1">
                    <Award className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Meilleur agent</span>
                  </div>
                  <p className="text-xl font-black text-foreground truncate" title={selectedRegion.bestAgent || undefined}>
                    {selectedRegion.bestAgent || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-border flex items-center justify-between text-muted-foreground relative z-10">
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                   <span className="text-[10px] font-bold uppercase tracking-widest">Données synchronisées</span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">Mise à jour: {new Date().toLocaleTimeString()}</div>
             </div>
             <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Système Géo-Analysis v2.1</div>
          </div>
        </div>
      </div>
    </div>
  );
}
