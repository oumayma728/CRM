import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Trash2, Edit2, Loader2, Mail,
  X, CheckCircle, AlertCircle, User as UserIcon,
  Eye, EyeOff, ChevronDown, Sparkles, Phone, TrendingUp,
  Award, BarChart3, Search
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useChartTheme } from '../../hooks/useChartTheme';

interface Agent {
  id: number;
  username: string;
  name: string;
  role: string;
  email: string;
  created_at?: string;
}

interface AgentPerf {
  agent_name: string;
  total_calls: number;
  avg_score: number;
  sentiment_distribution?: { POSITIVE: number; NEGATIVE: number; NEUTRAL: number };
}

export default function AgentsPage() {
  const chartTheme = useChartTheme();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [performances, setPerformances] = useState<AgentPerf[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [addFormData, setAddFormData] = useState({
    username: '', password: '', name: '', role: 'agent', email: ''
  });
  const [editFormData, setEditFormData] = useState({
    username: '', name: '', role: 'agent', email: '', password: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
  setLoading(true);

  try {
    const [agentsData, perfData] = await Promise.all([
      api.getAgents(),
      api.getAgentsPerformance().catch(() => [])
    ]);

    console.log("AGENTS =", agentsData);

    setAgents(agentsData);
    setPerformances(perfData);

  } catch (e) {
    console.error(e);
  } finally {
    setLoading(false);
  }
};
  const getPerfForAgent = (name: string): AgentPerf | undefined => {
    return performances.find(p =>
      p.agent_name?.toLowerCase() === name?.toLowerCase()
    );
  };

const filteredAgents = agents.filter(a =>
  a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  a.username?.toLowerCase().includes(searchQuery.toLowerCase())
);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setCreating(true);
    try {
      await api.createUser(addFormData);
      setSuccessMsg(`L'agent ${addFormData.name} a été créé avec succès !`);
      setShowAddModal(false);
      setAddFormData({ username: '', password: '', name: '', role: 'agent', email: '' });
      await loadData();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };
  

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;
    setErrorMsg('');
    setUpdating(true);
    try {
      const updateData = { ...editFormData, password: editFormData.password || undefined };
      await api.updateUser(selectedAgent.id, updateData);
      setSuccessMsg(`L'agent ${editFormData.name} a été mis à jour !`);
      setShowEditModal(false);
      setSelectedAgent(null);
      loadData();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet agent ?')) return;
    setDeleting(true);
    try {
      await api.deleteUser(userId);
      setSuccessMsg('Agent supprimé avec succès !');
      setShowEditModal(false);
      setSelectedAgent(null);
      loadData();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (agent: Agent) => {
    setSelectedAgent(agent);
    setEditFormData({
      username: agent.username || '',
      name: agent.name || '',
      role: agent.role || 'agent',
      email: agent.email || '',
      password: ''
    });
    setShowEditModal(true);
    setErrorMsg('');
  };

  const totalCalls = filteredAgents.reduce((sum, a) => {
    const perf = getPerfForAgent(a.name);
    return sum + (perf?.total_calls || 0);
  }, 0);

  const avgScore = filteredAgents.length > 0
    ? filteredAgents.reduce((sum, a) => {
        const perf = getPerfForAgent(a.name);
        return sum + (perf?.avg_score || 0);
      }, 0) / filteredAgents.filter(a => getPerfForAgent(a.name)).length || 0
    : 0;

  const barData = filteredAgents
    .map(a => {
      const perf = getPerfForAgent(a.name);
      return {
        name: a.name?.split(' ')[0] || a.username,
        appels: perf?.total_calls || 0,
        qualite: Math.round(perf?.avg_score || 0)
      };
    })
    .filter(d => d.appels > 0 || d.qualite > 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <Users className="w-5 h-5 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <span className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Chargement des agents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-white">
            Gestion des <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Agents</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Suivi et administration de l'équipe commerciale
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="group relative overflow-hidden flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-bold uppercase tracking-wider text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.02]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Nouvel Agent
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden group bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-5 hover:border-blue-500/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{filteredAgents.length}</p>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Agents Actifs</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden group bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-5 hover:border-cyan-500/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/20 flex items-center justify-center">
              <Phone className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{totalCalls}</p>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Appels</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden group bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-5 hover:border-emerald-500/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/20 flex items-center justify-center">
              <Award className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{avgScore > 0 ? `${Math.round(avgScore)}%` : '-'}</p>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Qualité Moy.</p>
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="relative bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <p className="text-emerald-400 font-semibold">{successMsg}</p>
        </div>
      )}

      {barData.length > 0 && (
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-slate-300">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Performance par Agent
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.15} vertical={false} />
                <XAxis dataKey="name" stroke={chartTheme.textColor} tick={{ fontSize: 11 }} />
                <YAxis stroke={chartTheme.textColor} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={chartTheme.tooltipStyle} />
                <Bar dataKey="appels" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Appels" />
                <Bar dataKey="qualite" fill="#10b981" radius={[4, 4, 0, 0]} name="Qualité %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/5">
        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un agent..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 text-sm font-medium focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-4 font-semibold text-slate-400 uppercase tracking-widest text-[10px]">Agent</th>
                <th className="text-left p-4 font-semibold text-slate-400 uppercase tracking-widest text-[10px]">Contact</th>
                <th className="text-center p-4 font-semibold text-slate-400 uppercase tracking-widest text-[10px]">Appels</th>
                <th className="text-center p-4 font-semibold text-slate-400 uppercase tracking-widest text-[10px]">Qualité</th>
                <th className="text-center p-4 font-semibold text-slate-400 uppercase tracking-widest text-[10px]">Sentiment</th>
                <th className="text-right p-4 font-semibold text-slate-400 uppercase tracking-widest text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.map((a) => {
                const perf = getPerfForAgent(a.name);
                const sent = perf?.sentiment_distribution;
                const posPct = sent ? Math.round((sent.POSITIVE / (sent.POSITIVE + sent.NEGATIVE + sent.NEUTRAL || 1)) * 100) : null;
                return (
                  <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center font-bold text-blue-300 text-sm uppercase">
                          {a.name?.substring(0, 2) || 'A'}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{a.name}</p>
                          <p className="text-xs text-slate-500">@{a.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{a.email || `${a.username}@crm-ai.com`}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-white font-bold">{perf?.total_calls ?? '-'}</span>
                    </td>
                    <td className="p-4 text-center">
                      {perf?.avg_score ? (
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          perf.avg_score >= 70 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          perf.avg_score >= 50 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {Math.round(perf.avg_score)}%
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {posPct !== null ? (
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
                              style={{ width: `${posPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-emerald-400 font-bold">{posPct}%</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(a)}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-blue-500/20 border border-white/5 hover:border-blue-500/30 transition-all group"
                        >
                          <Edit2 className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(a.id)}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/5 hover:border-red-500/30 transition-all group"
                        >
                          <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredAgents.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    {searchQuery ? 'Aucun agent trouvé pour cette recherche' : 'Aucun agent enregistré'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl shadow-blue-500/10 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-600/20 via-cyan-600/10 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
            <div className="relative p-6 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Nouvel Agent</h2>
                  <p className="text-xs text-slate-400">Créer un nouveau compte agent</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 pt-0 space-y-4">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{errorMsg}
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Nom Complet</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input type="text" required placeholder="Ex: Ahmed Mansour"
                      className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 font-medium focus:outline-none focus:border-blue-500/50 transition-all"
                      value={addFormData.name} onChange={e => setAddFormData({...addFormData, name: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">Login</label>
                    <div className="relative group">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 group-focus-within:text-blue-400">@</span>
                      <input type="text" required placeholder="ahmed.m"
                        className="w-full pl-9 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 font-medium focus:outline-none focus:border-blue-500/50 transition-all"
                        value={addFormData.username} onChange={e => setAddFormData({...addFormData, username: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">Mot de passe</label>
                    <div className="relative group">
                      <input type={showPassword ? "text" : "password"} required placeholder="••••••••"
                        className="w-full px-4 py-3 pr-10 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 font-medium focus:outline-none focus:border-blue-500/50 transition-all"
                        value={addFormData.password} onChange={e => setAddFormData({...addFormData, password: e.target.value})} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Email Professionnel</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input type="email" required placeholder="agent@entreprise.com"
                      className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 font-medium focus:outline-none focus:border-blue-500/50 transition-all"
                      value={addFormData.email} onChange={e => setAddFormData({...addFormData, email: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Rôle</label>
                  <div className="relative">
                    <select className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white font-medium focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                      value={addFormData.role} onChange={e => setAddFormData({...addFormData, role: e.target.value})}>
                      <option value="agent" className="bg-slate-900">Agent Commercial</option>
                      <option value="qualite" className="bg-slate-900">Service Qualité</option>
                      <option value="admin" className="bg-slate-900">Administrateur</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 bg-white/[0.03] text-slate-300 font-semibold rounded-xl border border-white/[0.08] hover:bg-white/[0.06] transition-all">Annuler</button>
                <button type="submit" disabled={creating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                  {creating ? <><Loader2 className="w-4 h-4 animate-spin" />Création...</> : <><Sparkles className="w-4 h-4" />Créer</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShowEditModal(false)} />
          <div className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl shadow-amber-500/10 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-amber-600/20 via-orange-600/10 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
            <div className="relative p-6 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Edit2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Modifier l'Agent</h2>
                  <p className="text-xs text-slate-400">Mettre à jour les informations</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="p-6 pt-0 space-y-4">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{errorMsg}
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Nom Complet</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input type="text" required
                      className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white font-medium focus:outline-none focus:border-amber-500/50 transition-all"
                      value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Login</label>
                  <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 group-focus-within:text-amber-400">@</span>
                    <input type="text" required
                      className="w-full pl-9 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white font-medium focus:outline-none focus:border-amber-500/50 transition-all"
                      value={editFormData.username} onChange={e => setEditFormData({...editFormData, username: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Email</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input type="email" required
                      className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white font-medium focus:outline-none focus:border-amber-500/50 transition-all"
                      value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Rôle</label>
                  <div className="relative">
                    <select className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white font-medium focus:outline-none focus:border-amber-500/50 transition-all appearance-none cursor-pointer"
                      value={editFormData.role} onChange={e => setEditFormData({...editFormData, role: e.target.value})}>
                      <option value="agent" className="bg-slate-900">Agent Commercial</option>
                      <option value="qualite" className="bg-slate-900">Service Qualité</option>
                      <option value="admin" className="bg-slate-900">Administrateur</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Nouveau mot de passe <span className="text-slate-500">(laisser vide pour garder l'actuel)</span>
                  </label>
                  <div className="relative group">
                    <input type={showPassword ? "text" : "password"} placeholder="••••••••"
                      className="w-full px-4 py-3 pr-10 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 font-medium focus:outline-none focus:border-amber-500/50 transition-all"
                      value={editFormData.password} onChange={e => setEditFormData({...editFormData, password: e.target.value})} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => handleDeleteUser(selectedAgent.id)} disabled={deleting}
                  className="flex items-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 font-semibold rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50">
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}Supprimer
                </button>
                <button type="submit" disabled={updating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                  {updating ? <><Loader2 className="w-4 h-4 animate-spin" />Sauvegarde...</> : <><CheckCircle className="w-4 h-4" />Sauvegarder</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
