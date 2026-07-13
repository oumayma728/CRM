import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Euro, TrendingUp, Trophy, RefreshCw, Download,
  Eye, Settings, ChevronLeft, ChevronRight, Search,
  X, Save, Plus, Trash2, Edit3,
  DollarSign, Award, AlertTriangle, CheckCircle, Zap, Banknote,
  BarChart3, FileText
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../../services/api';

type TabType = 'dashboard' | 'salaries' | 'rules';

export default function SalaryPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [calculating, setCalculating] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleForm, setRuleForm] = useState({ ruleName: '', ruleType: 'base_salary', amount: 0, role: 'agent', isActive: true });

  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [salRes, sumRes, rulesRes] = await Promise.all([
        api.get(`/salaries?month=${selectedMonth}`),
        api.get(`/salaries/monthly-summary?month=${selectedMonth}`),
        api.get('/salaries/rules'),
      ]);
      setSalaries(salRes.data);
      setSummary(sumRes.data);
      setRules(rulesRes.data);
    } catch (err) {
      console.error('Salary fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      await api.get(`/salaries/calculate?month=${selectedMonth}`);
      fetchData();
    } finally {
      setCalculating(false);
    }
  };

  const handlePaymentStatus = async (salaryId: number, status: string) => {
    await api.put(`/salaries/${salaryId}/payment`, { status });
    fetchData();
  };

  const handleSaveRule = async () => {
    try {
      if (editingRule) {
        await api.put(`/salaries/rules/${editingRule.id}`, ruleForm);
      } else {
        await api.post('/salaries/rules', ruleForm);
      }
      setShowRuleModal(false);
      setEditingRule(null);
      fetchData();
    } catch (err: any) {
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!window.confirm('Supprimer cette règle ?')) return;
    await api.delete(`/salaries/rules/${ruleId}`);
    fetchData();
  };

  const openEditRule = (rule: any) => {
    setEditingRule(rule);
    setRuleForm({ ruleName: rule.ruleName, ruleType: rule.ruleType, amount: rule.amount, role: rule.role || 'agent', isActive: rule.isActive ?? true });
    setShowRuleModal(true);
  };

  const openNewRule = () => {
    setEditingRule(null);
    setRuleForm({ ruleName: '', ruleType: 'base_salary', amount: 0, role: 'agent', isActive: true });
    setShowRuleModal(true);
  };

  const exportCSV = () => {
    const headers = ['Agent', 'Base', 'RDV', 'Poses', 'Refus', 'Qualité', 'P.RDV', 'P.Pose', 'P.Qual', 'B.Inst', 'Pénalités', 'Total', 'Statut'];
    const rows = filteredSalaries.map((s: any) => [
      s.agentName, s.baseSalary, s.rdvCount, s.poseCount, s.refusCount,
      s.qualityRate?.toFixed(1), s.rdvBonus, s.poseBonus, s.qualityBonus, s.installationBonus,
      s.penalties, s.totalSalary, s.paymentStatus
    ]);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `salaires_${selectedMonth}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSalaries = salaries.filter((s: any) => {
    const matchSearch = !searchTerm || (s.agentName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !statusFilter || s.paymentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredSalaries.length / itemsPerPage);
  const paginatedSalaries = filteredSalaries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const fmt = (v: number) => `${(v || 0).toFixed(2)} €`;

  const paymentBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      paid: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Payé' },
      pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', label: 'En attente' },
      partial: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Partiel' },
      cancelled: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Annulé' },
    };
    const s = map[status] || map.pending;
    return <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${s.bg} ${s.text}`}>{s.label}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-primary pl-6">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
            Gestion des <span className="text-primary">Salaires</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
            Calcul dynamique basé sur les performances réelles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month" value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="h-10 px-4 bg-muted border border-border rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button onClick={handleCalculate} disabled={calculating}
            className="h-10 px-4 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50">
            {calculating ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Calculer
          </button>
          <button onClick={fetchData} className="p-2.5 bg-card border border-border rounded-xl hover:bg-muted transition-all text-primary">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-1">
        {[
          { key: 'dashboard' as TabType, label: 'Dashboard', icon: BarChart3 },
          { key: 'salaries' as TabType, label: 'Tableau Salaires', icon: Banknote },
          { key: 'rules' as TabType, label: 'Paramètres', icon: Settings },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-t-xl transition-all ${
              activeTab === tab.key ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted'
            }`}>
            <tab.icon className="w-3.5 h-3.5" />{tab.label}
          </button>
        ))}
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Agents', value: summary?.totalAgents || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Masse Salariale', value: fmt(summary?.totalMass || 0), icon: Euro, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Salaire Moyen', value: fmt(summary?.avgSalary || 0), icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { label: 'Meilleur Agent', value: summary?.bestAgent || 'N/A', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
              { label: 'Primes Totales', value: fmt(summary?.totalPrimes || 0), icon: Award, color: 'text-orange-400', bg: 'bg-orange-500/10' },
            ].map((kpi, i) => (
              <div key={i} className="bg-card border border-border p-5 rounded-2xl shadow-sm relative overflow-hidden group">
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-3 ${kpi.color}`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
                <div className="text-lg font-black text-foreground">{loading ? '...' : kpi.value}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{kpi.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Répartition Salaires
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={salaries.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="agentName" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--foreground)' }} />
                  <Bar dataKey="baseSalary" name="Base" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rdvBonus" name="Prime RDV" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="poseBonus" name="Prime Pose" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" /> Statistiques Paiement
              </h3>
              <div className="space-y-3 mt-2">
                {[
                  { label: 'Masse Salariale', value: fmt(summary?.totalMass || 0), color: 'text-emerald-400' },
                  { label: 'Primes Totales', value: fmt(summary?.totalPrimes || 0), color: 'text-blue-400' },
                  { label: 'Pénalités', value: fmt(summary?.totalPenalties || 0), color: 'text-red-400' },
                  { label: 'Salaire Maximum', value: fmt(summary?.maxSalary || 0), color: 'text-purple-400' },
                  { label: 'Calculés / Total', value: `${summary?.calculatedAgents || 0} / ${summary?.totalAgents || 0}`, color: 'text-yellow-400' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-muted/10 rounded-xl">
                    <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                    <span className={`text-sm font-black ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* SALARIES TABLE TAB */}
      {activeTab === 'salaries' && (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Tableau des Salaires</h3>
            </div>
            <div className="flex gap-3 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Rechercher agent..." value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-xs w-48" />
              </div>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="px-4 py-2 rounded-xl border border-border bg-background text-xs">
                <option value="">Tous statuts</option>
                <option value="paid">Payé</option>
                <option value="pending">En attente</option>
                <option value="partial">Partiel</option>
                <option value="cancelled">Annulé</option>
              </select>
              <button onClick={exportCSV} className="h-9 px-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 flex items-center gap-2">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/10 border-b border-border">
                  {['Agent', 'Base', 'RDV', 'Poses', 'Refus', 'Qualité', 'P.RDV', 'P.Pose', 'P.Qual', 'Pénal.', 'Total', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={13} className="px-4 py-12 text-center text-muted-foreground text-xs animate-pulse">Chargement...</td></tr>
                ) : paginatedSalaries.length === 0 ? (
                  <tr><td colSpan={13} className="px-4 py-12 text-center text-muted-foreground text-xs">Aucun salaire calculé. Cliquez sur "Calculer".</td></tr>
                ) : (
                  paginatedSalaries.map((s: any) => (
                    <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-3 font-semibold text-xs">{s.agentName}</td>
                      <td className="px-3 py-3 text-xs font-mono">{fmt(s.baseSalary)}</td>
                      <td className="px-3 py-3 text-center text-xs">{s.rdvCount}</td>
                      <td className="px-3 py-3 text-center text-xs">{s.poseCount}</td>
                      <td className="px-3 py-3 text-center text-xs text-red-400">{s.refusCount}</td>
                      <td className="px-3 py-3 text-center text-xs">
                        <span className={`font-bold ${s.qualityRate >= 90 ? 'text-emerald-400' : s.qualityRate >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {(s.qualityRate || 0).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs font-mono text-emerald-400">{fmt(s.rdvBonus)}</td>
                      <td className="px-3 py-3 text-xs font-mono text-emerald-400">{fmt(s.poseBonus)}</td>
                      <td className="px-3 py-3 text-xs font-mono text-purple-400">{fmt(s.qualityBonus)}</td>
                      <td className="px-3 py-3 text-xs font-mono text-red-400">{fmt(s.penalties)}</td>
                      <td className="px-3 py-3 text-xs font-black font-mono">{fmt(s.totalSalary)}</td>
                      <td className="px-3 py-3">{paymentBadge(s.paymentStatus)}</td>
                      <td className="px-3 py-3">
                        {s.paymentStatus === 'pending' && (
                          <button onClick={() => handlePaymentStatus(s.id, 'paid')}
                            className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400 transition-all" title="Marquer payé">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-border flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground">{filteredSalaries.length} résultats — Page {currentPage}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-muted disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-muted disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RULES TAB */}
      {activeTab === 'rules' && (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Paramètres de Rémunération</h3>
            </div>
            <button onClick={openNewRule}
              className="h-9 px-4 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> Ajouter Règle
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/10 border-b border-border">
                  {['Règle', 'Type', 'Rôle', 'Montant', 'Actif', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rules.map((r: any) => (
                  <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-semibold text-xs">{r.ruleName}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase bg-primary/10 text-primary">{r.ruleType}</span>
                    </td>
                    <td className="px-4 py-3 text-xs capitalize">{r.role}</td>
                    <td className={`px-4 py-3 text-xs font-mono font-bold ${r.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {r.amount >= 0 ? '+' : ''}{r.amount} €
                    </td>
                    <td className="px-4 py-3">
                      {r.isActive ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-400" />}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditRule(r)} className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteRule(r.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-xs">Aucune règle définie. Ajoutez des règles pour calculer les salaires.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest">{editingRule ? 'Modifier la règle' : 'Nouvelle règle'}</h3>
              <button onClick={() => setShowRuleModal(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Nom de la règle</label>
                <input className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="ex: Prime RDV Confirmé" value={ruleForm.ruleName}
                  onChange={e => setRuleForm({ ...ruleForm, ruleName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Type</label>
                  <select className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm outline-none" value={ruleForm.ruleType}
                    onChange={e => setRuleForm({ ...ruleForm, ruleType: e.target.value })}>
                    <option value="base_salary">Salaire de base</option>
                    <option value="rdv_bonus">Prime RDV</option>
                    <option value="pose_bonus">Prime Pose</option>
                    <option value="quality_bonus">Prime Qualité</option>
                    <option value="installation_bonus">Bonus Installation</option>
                    <option value="refus_penalty">Pénalité Refus</option>
                    <option value="absence_penalty">Pénalité Absence</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Rôle</label>
                  <select className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm outline-none" value={ruleForm.role}
                    onChange={e => setRuleForm({ ...ruleForm, role: e.target.value })}>
                    <option value="agent">Agent</option>
                    <option value="qualite">Qualité</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Montant (€)</label>
                <input type="number" className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="ex: 50 ou -20" value={ruleForm.amount}
                  onChange={e => setRuleForm({ ...ruleForm, amount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Active</label>
                <button onClick={() => setRuleForm({ ...ruleForm, isActive: !ruleForm.isActive })}
                  className={`w-10 h-5 rounded-full transition-all ${ruleForm.isActive ? 'bg-emerald-500' : 'bg-muted'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${ruleForm.isActive ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button onClick={() => setShowRuleModal(false)} className="px-5 py-2 text-[10px] font-black uppercase text-muted-foreground hover:bg-muted rounded-xl">Annuler</button>
              <button onClick={handleSaveRule} className="px-5 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:opacity-90 flex items-center gap-2">
                <Save className="w-3.5 h-3.5" />{editingRule ? 'Sauvegarder' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
