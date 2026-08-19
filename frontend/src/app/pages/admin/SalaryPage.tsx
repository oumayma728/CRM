import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Euro, TrendingUp, Trophy, RefreshCw, Download,
  Eye, Settings, ChevronLeft, ChevronRight, Search,
  Filter, FileText, X, Save, Plus, Trash2, Edit3,
  DollarSign, Award, AlertTriangle, CheckCircle, Clock,
  Calendar, BarChart3, ArrowUpRight, Zap, Banknote
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, LineChart, Line, Legend
} from 'recharts';
import api from '../../services/api';
import { useChartTheme } from '../../hooks/useChartTheme';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

type TabType = 'dashboard' | 'salaries' | 'rules' | 'detail';

export default function SalaryPage() {
  const chartTheme = useChartTheme();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [agentDetail, setAgentDetail] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  const [editingRule, setEditingRule] = useState<any>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleForm, setRuleForm] = useState({ rule_name: '', rule_type: 'base_salary', amount: 0, role: 'agent', is_active: 1 });

  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [salariesRes, summaryRes, rulesRes] = await Promise.all([
        api.getSalaries(selectedMonth),
        api.getSalaryMonthlySummary(selectedMonth),
        api.getSalaryRules()
      ]);
      setSalaries(salariesRes);
      setSummary(summaryRes);
      setRules(rulesRes);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      await api.calculateSalaries(selectedMonth);
      fetchData();
    } catch (err) {
      console.error('Calculate error:', err);
    } finally {
      setCalculating(false);
    }
  };

  const handleViewDetail = async (agentId: number) => {
    try {
      const detail = await api.getAgentSalaryDetail(agentId, selectedMonth);
      setAgentDetail(detail);
      setSelectedAgent(detail.agent);
      setActiveTab('detail');
    } catch (err) {
      console.error('Detail error:', err);
    }
  };

  const handlePaymentStatus = async (salaryId: number, status: string) => {
    try {
      await api.updateSalaryPayment(salaryId, status);
      fetchData();
    } catch (err) {
      console.error('Payment update error:', err);
    }
  };

  const handleSaveRule = async () => {
    try {
      if (editingRule) {
        await api.updateSalaryRule(editingRule.id, ruleForm);
      } else {
        await api.createSalaryRule(ruleForm);
      }
      setShowRuleModal(false);
      setEditingRule(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!window.confirm('Supprimer cette regle ?')) return;
    try {
      await api.deleteSalaryRule(ruleId);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const openEditRule = (rule: any) => {
    setEditingRule(rule);
    setRuleForm({
      rule_name: rule.rule_name,
      rule_type: rule.rule_type,
      amount: rule.amount,
      role: rule.role || 'agent',
      is_active: rule.is_active ?? 1
    });
    setShowRuleModal(true);
  };

  const openNewRule = () => {
    setEditingRule(null);
    setRuleForm({ rule_name: '', rule_type: 'base_salary', amount: 0, role: 'agent', is_active: 1 });
    setShowRuleModal(true);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleString('fr-FR');
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text("FICHE DE PAIE - GESTION DES SALAIRES", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Mois: ${selectedMonth} | Genere le: ${now}`, 14, 30);
    const tableData = filteredSalaries.map((s: any) => [
      s.agent_name || 'N/A',
      s.role || 'agent',
      `${s.base_salary?.toFixed(2) || '0.00'} EUR`,
      `${s.rdv_bonus?.toFixed(2) || '0.00'} EUR`,
      `${s.pose_bonus?.toFixed(2) || '0.00'} EUR`,
      `${s.quality_bonus?.toFixed(2) || '0.00'} EUR`,
      `${s.penalties?.toFixed(2) || '0.00'} EUR`,
      `${s.total_salary?.toFixed(2) || '0.00'} EUR`,
      s.payment_status || 'pending'
    ]);
    (doc as any).autoTable({
      startY: 40,
      head: [["Agent", "Role", "Base", "Prime RDV", "Prime Pose", "Prime Qualite", "Penalites", "Total", "Statut"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    doc.save(`Salaires_${selectedMonth}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const headers = ['Agent', 'Role', 'Salaire Base', 'RDV', 'Poses', 'Refus', 'Taux Qualite', 'Prime RDV', 'Prime Pose', 'Prime Qualite', 'Bonus Installation', 'Penalites', 'Salaire Total', 'Statut'];
    const rows = filteredSalaries.map((s: any) => [
      s.agent_name, s.role, s.base_salary, s.rdv_count, s.pose_count, s.refus_count,
      s.quality_rate, s.rdv_bonus, s.pose_bonus, s.quality_bonus, s.installation_bonus,
      s.penalties, s.total_salary, s.payment_status
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salaires_${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSalaries = salaries.filter((s: any) => {
    const matchSearch = !searchTerm || (s.agent_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !statusFilter || s.payment_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredSalaries.length / itemsPerPage);
  const paginatedSalaries = filteredSalaries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatCurrency = (val: number) => `${(val || 0).toFixed(2)} EUR`;

  const paymentBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      paid: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Paye' },
      pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'En attente' },
      partial: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Partiel' },
      cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Annule' },
    };
    const s = map[status] || map.pending;
    return <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${s.bg} ${s.text}`}>{s.label}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
            Gestion des <span className="text-primary">Salaires</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
            Calcul dynamique base sur les performances reelles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="h-10 px-4 bg-slate-800 border border-border rounded-xl text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          />
          <button
            onClick={handleCalculate}
            disabled={calculating}
            className="h-10 px-4 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {calculating ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Calculer
          </button>
          <button onClick={fetchData} className="p-2.5 bg-card border border-border rounded-xl hover:bg-muted transition-all text-primary">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border pb-1">
        {[
          { key: 'dashboard' as TabType, label: 'Dashboard', icon: BarChart3 },
          { key: 'salaries' as TabType, label: 'Tableau Salaires', icon: Banknote },
          { key: 'rules' as TabType, label: 'Parametres', icon: Settings },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-t-xl transition-all ${
              activeTab === tab.key
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Agents', value: summary?.total_agents || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Masse Salariale', value: formatCurrency(summary?.total_mass || 0), icon: Euro, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Salaire Moyen', value: formatCurrency(summary?.avg_salary || 0), icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { label: 'Meilleur Agent', value: summary?.best_agent?.name || 'N/A', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
              { label: 'Primes Totales', value: formatCurrency(summary?.total_primes || 0), icon: Award, color: 'text-orange-400', bg: 'bg-orange-500/10' },
            ].map((kpi, i) => (
              <div key={i} className="bg-card border border-border p-5 rounded-2xl shadow-sm relative overflow-hidden group">
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-3 ${kpi.color}`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
                <div className="text-lg font-black text-foreground">{loading ? '...' : kpi.value}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{kpi.label}</div>
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                  <kpi.icon className="w-16 h-16" />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Repartition Salaires</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salaries.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                  <XAxis dataKey="agent_name" tick={{ fontSize: 9, fill: chartTheme.textColor }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10, fill: chartTheme.textColor }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTheme.tooltipStyle} />
                  <Bar dataKey="base_salary" name="Base" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rdv_bonus" name="Prime RDV" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pose_bonus" name="Prime Pose" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="quality_bonus" name="Prime Qualite" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Statistiques Paiement</h3>
              </div>
              <div className="space-y-4 mt-6">
                {[
                  { label: 'Masse Salariale Totale', value: formatCurrency(summary?.total_mass || 0), color: 'text-emerald-400' },
                  { label: 'Primes Distribuees', value: formatCurrency(summary?.total_primes || 0), color: 'text-blue-400' },
                  { label: 'Penalites Totales', value: formatCurrency(summary?.total_penalties || 0), color: 'text-red-400' },
                  { label: 'Salaire Maximum', value: formatCurrency(summary?.max_salary || 0), color: 'text-purple-400' },
                  { label: 'Agents Calculés', value: `${summary?.calculated_agents || 0} / ${summary?.total_agents || 0}`, color: 'text-yellow-400' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-muted/10 rounded-xl">
                    <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                    <span className={`text-sm font-black ${item.color}`}>{item.value}</span>
                  </div>
                ))}
                {summary?.payment_status && Object.entries(summary.payment_status).map(([status, count]: [string, any]) => (
                  <div key={status} className="flex justify-between items-center p-3 bg-muted/10 rounded-xl">
                    <span className="text-xs font-medium text-muted-foreground">Statut: {status}</span>
                    <span className="text-sm font-black text-foreground">{count} agents</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'salaries' && (
        <>
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">TABLEAU DES SALAIRES</h3>
              </div>
              <div className="flex gap-3 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Rechercher agent..."
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-xs w-48"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="px-4 py-2 rounded-xl border border-border bg-background text-xs"
                >
                  <option value="">Tous statuts</option>
                  <option value="paid">Paye</option>
                  <option value="pending">En attente</option>
                  <option value="partial">Partiel</option>
                  <option value="cancelled">Annule</option>
                </select>
                <button onClick={exportExcel} className="h-10 px-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-all flex items-center gap-2">
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button onClick={generatePDF} className="h-10 px-3 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:opacity-90 transition-all flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> PDF
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/10 border-b border-border">
                    <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Agent</th>
                    <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Role</th>
                    <th className="px-3 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Base</th>
                    <th className="px-3 py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">RDV</th>
                    <th className="px-3 py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Poses</th>
                    <th className="px-3 py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Refus</th>
                    <th className="px-3 py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Qualite</th>
                    <th className="px-3 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">P.RDV</th>
                    <th className="px-3 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">P.Pose</th>
                    <th className="px-3 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">P.Qual</th>
                    <th className="px-3 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">B.Inst</th>
                    <th className="px-3 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Penal.</th>
                    <th className="px-3 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total</th>
                    <th className="px-3 py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Statut</th>
                    <th className="px-3 py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={15} className="px-4 py-12 text-center text-muted-foreground text-xs font-bold animate-pulse">Chargement...</td></tr>
                  ) : paginatedSalaries.length === 0 ? (
                    <tr><td colSpan={15} className="px-4 py-12 text-center text-muted-foreground text-xs">Aucun salaire calcule pour ce mois. Cliquez sur "Calculer".</td></tr>
                  ) : (
                    paginatedSalaries.map((s: any) => (
                      <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-3 font-semibold text-xs">{s.agent_name}</td>
                        <td className="px-3 py-3 text-xs capitalize">{s.role}</td>
                        <td className="px-3 py-3 text-right text-xs font-mono">{formatCurrency(s.base_salary)}</td>
                        <td className="px-3 py-3 text-center text-xs">{s.rdv_count}</td>
                        <td className="px-3 py-3 text-center text-xs">{s.pose_count}</td>
                        <td className="px-3 py-3 text-center text-xs text-red-400">{s.refus_count}</td>
                        <td className="px-3 py-3 text-center text-xs">
                          <span className={`font-bold ${s.quality_rate >= 90 ? 'text-emerald-400' : s.quality_rate >= 75 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {s.quality_rate?.toFixed(0) || 0}%
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right text-xs font-mono text-emerald-400">{formatCurrency(s.rdv_bonus)}</td>
                        <td className="px-3 py-3 text-right text-xs font-mono text-emerald-400">{formatCurrency(s.pose_bonus)}</td>
                        <td className="px-3 py-3 text-right text-xs font-mono text-purple-400">{formatCurrency(s.quality_bonus)}</td>
                        <td className="px-3 py-3 text-right text-xs font-mono text-blue-400">{formatCurrency(s.installation_bonus)}</td>
                        <td className="px-3 py-3 text-right text-xs font-mono text-red-400">{formatCurrency(s.penalties)}</td>
                        <td className="px-3 py-3 text-right text-xs font-black font-mono">{formatCurrency(s.total_salary)}</td>
                        <td className="px-3 py-3 text-center">{paymentBadge(s.payment_status)}</td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleViewDetail(s.agent_id)} className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-all" title="Voir detail">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {s.payment_status === 'pending' && (
                              <button onClick={() => handlePaymentStatus(s.id, 'paid')} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400 transition-all" title="Marquer paye">
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-border flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground">
                  {filteredSalaries.length} resultats - Page {currentPage}/{totalPages}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-muted transition-all disabled:opacity-30">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, currentPage - 2) + i;
                    if (page > totalPages) return null;
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === currentPage ? 'bg-primary text-white' : 'hover:bg-muted'}`}>
                        {page}
                      </button>
                    );
                  })}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-muted transition-all disabled:opacity-30">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'rules' && (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">PARAMETRES DE REMUNERATION</h3>
            </div>
            <button onClick={openNewRule} className="h-9 px-4 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> Ajouter Regle
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/10 border-b border-border">
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Regle</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Montant</th>
                  <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actif</th>
                  <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rules.map((r: any) => (
                  <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-semibold text-xs">{r.rule_name}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase bg-primary/10 text-primary">
                        {r.rule_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs capitalize">{r.role}</td>
                    <td className={`px-4 py-3 text-right text-xs font-mono font-bold ${r.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {r.amount >= 0 ? '+' : ''}{r.amount} EUR
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.is_active ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEditRule(r)} className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-all" title="Modifier">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteRule(r.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-all" title="Supprimer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'detail' && selectedAgent && agentDetail && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveTab('salaries')} className="p-2 rounded-xl hover:bg-muted transition-all text-muted-foreground">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-black text-foreground">{selectedAgent.name}</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground capitalize">{selectedAgent.role} - {selectedAgent.username}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {agentDetail.current_salary ? [
              { label: 'Salaire Total', value: formatCurrency(agentDetail.current_salary.total_salary), icon: Euro, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Salaire Base', value: formatCurrency(agentDetail.current_salary.base_salary), icon: Banknote, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Total Primes', value: formatCurrency(agentDetail.current_salary.rdv_bonus + agentDetail.current_salary.pose_bonus + agentDetail.current_salary.quality_bonus + agentDetail.current_salary.installation_bonus), icon: Award, color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { label: 'Penalites', value: formatCurrency(agentDetail.current_salary.penalties), icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
            ].map((kpi, i) => (
              <div key={i} className="bg-card border border-border p-4 rounded-2xl shadow-sm">
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center mb-2 ${kpi.color}`}>
                  <kpi.icon className="w-4 h-4" />
                </div>
                <div className="text-lg font-black text-foreground">{kpi.value}</div>
                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{kpi.label}</div>
              </div>
            )) : (
              <div className="col-span-4 text-center py-8 text-muted-foreground text-xs">Aucun salaire calcule pour ce mois</div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Evolution du Salaire</h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={agentDetail.salary_history?.map((h: any) => ({
                  mois: h.month,
                  total: h.total_salary,
                  base: h.base_salary,
                  primes: h.rdv_bonus + h.pose_bonus + h.quality_bonus + h.installation_bonus,
                })).reverse() || []}>
                  <defs>
                    <linearGradient id="salaryGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                  <XAxis dataKey="mois" tick={{ fontSize: 9, fill: chartTheme.textColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: chartTheme.textColor }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTheme.tooltipStyle} />
                  <Area type="monotone" dataKey="total" name="Salaire Total" stroke="#6366f1" strokeWidth={2} fill="url(#salaryGrad)" />
                  <Line type="monotone" dataKey="base" name="Base" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="primes" name="Primes" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Evolution des RDV</h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={agentDetail.appointment_history?.map((h: any) => ({
                  mois: h.month,
                  confirmes: h.confirmed,
                  poses: h.posed,
                  refus: h.refused,
                  total: h.total,
                })).reverse() || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                  <XAxis dataKey="mois" tick={{ fontSize: 9, fill: chartTheme.textColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: chartTheme.textColor }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTheme.tooltipStyle} />
                  <Bar dataKey="confirmes" name="Confirmes" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="poses" name="Poses" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="refus" name="Refus" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Evolution Score Qualite</h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={agentDetail.evaluation_history?.map((h: any) => ({
                  mois: h.month,
                  score: h.avg_score,
                  evaluations: h.eval_count,
                })).reverse() || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                  <XAxis dataKey="mois" tick={{ fontSize: 9, fill: chartTheme.textColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: chartTheme.textColor }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={chartTheme.tooltipStyle} />
                  <Line type="monotone" dataKey="score" name="Score Moyen" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Historique Presences</h3>
              </div>
              <div className="space-y-3">
                {agentDetail.attendance_history?.map((h: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/10 rounded-xl">
                    <span className="text-xs font-bold">{h.month}</span>
                    <div className="flex gap-4 text-[10px] font-bold">
                      <span className="text-emerald-400">{h.present_days}j present</span>
                      <span className="text-red-400">{h.absent_days}j absent</span>
                      <span className="text-muted-foreground">{h.total_days}j total</span>
                    </div>
                  </div>
                )) || <p className="text-xs text-muted-foreground text-center py-8">Aucune donnee de presence</p>}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">HISTORIQUE DES SALAIRES</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/10 border-b border-border">
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mois</th>
                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Base</th>
                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Primes</th>
                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Penalites</th>
                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {agentDetail.salary_history?.map((h: any) => (
                    <tr key={h.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-xs font-bold">{h.month}</td>
                      <td className="px-4 py-3 text-right text-xs font-mono">{formatCurrency(h.base_salary)}</td>
                      <td className="px-4 py-3 text-right text-xs font-mono text-emerald-400">
                        {formatCurrency(h.rdv_bonus + h.pose_bonus + h.quality_bonus + h.installation_bonus)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-mono text-red-400">{formatCurrency(h.penalties)}</td>
                      <td className="px-4 py-3 text-right text-xs font-mono font-black">{formatCurrency(h.total_salary)}</td>
                      <td className="px-4 py-3 text-center">{paymentBadge(h.payment_status)}</td>
                    </tr>
                  )) || <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-muted-foreground">Aucun historique</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showRuleModal && (
        <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">
                {editingRule ? 'Modifier la regle' : 'Nouvelle regle'}
              </h3>
              <button onClick={() => setShowRuleModal(false)} className="p-1.5 rounded-lg hover:bg-muted transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nom de la regle</label>
                <input
                  className="w-full px-4 py-2.5 bg-indigo-950/40 text-white placeholder:text-slate-400 border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="ex: Prime RDV Confirme"
                  value={ruleForm.rule_name}
                  onChange={e => setRuleForm({ ...ruleForm, rule_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Type</label>
                  <select
                    className="w-full px-4 py-2.5 bg-indigo-950/40 border border-border rounded-xl text-white text-xs font-bold outline-none cursor-pointer"
                    value={ruleForm.rule_type}
                    onChange={e => setRuleForm({ ...ruleForm, rule_type: e.target.value })}
                  >
                    <option value="base_salary">Salaire de base</option>
                    <option value="rdv_bonus">Prime RDV</option>
                    <option value="pose_bonus">Prime Pose</option>
                    <option value="quality_bonus">Prime Qualite</option>
                    <option value="installation_bonus">Bonus Installation</option>
                    <option value="penalty">Penalite</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Role</label>
                  <select
                    className="w-full px-4 py-2.5 bg-indigo-950/40 border border-border rounded-xl text-white text-xs font-bold outline-none cursor-pointer"
                    value={ruleForm.role}
                    onChange={e => setRuleForm({ ...ruleForm, role: e.target.value })}
                  >
                    <option value="agent">Agent</option>
                    <option value="qualite">Qualite</option>
                    <option value="admin">Admin</option>
                    <option value="all">Tous</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Montant (EUR)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 bg-indigo-950/40 text-white placeholder:text-slate-400 border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="ex: 50 ou -20"
                  value={ruleForm.amount}
                  onChange={e => setRuleForm({ ...ruleForm, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Active</label>
                <button
                  onClick={() => setRuleForm({ ...ruleForm, is_active: ruleForm.is_active ? 0 : 1 })}
                  className={`w-10 h-5 rounded-full transition-all ${ruleForm.is_active ? 'bg-emerald-500' : 'bg-muted'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${ruleForm.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="p-6 bg-muted/20 border-t border-border flex justify-end gap-3">
              <button onClick={() => setShowRuleModal(false)} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted rounded-xl transition-all">
                Annuler
              </button>
              <button onClick={handleSaveRule} className="px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2">
                <Save className="w-3.5 h-3.5" />
                {editingRule ? 'Sauvegarder' : 'Creer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
