import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, Trash2, Edit2, Loader2, Mail, 
  X, CheckCircle, AlertCircle, User as UserIcon, ShieldCheck,
  Eye, EyeOff, ChevronDown, Sparkles
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  email: string;
  created_at?: string;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Add User Form State
  const [addFormData, setAddFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'agent',
    email: ''
  });

  // Edit User Form State
  const [editFormData, setEditFormData] = useState({
    username: '',
    name: '',
    role: 'agent',
    email: '',
    password: ''
  });

  useEffect(() => {
    console.log('Current user role:', currentUser?.role);
    loadUsers();
  }, [currentUser]);

  // Redirect non-admin users
  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-muted-foreground font-bold">Accès restreint aux administrateurs</p>
        <p className="text-xs text-muted-foreground">Votre rôle: {currentUser?.role || 'non connecté'}</p>
      </div>
    );
  }

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getAgents();
      setUsers(data);
    } catch (e) {
      console.error('Error loading users:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setCreating(true);
    try {
      const result = await api.createUser(addFormData);
      setSuccessMsg(`L'utilisateur ${addFormData.name} a été créé avec succès !`);
      setShowAddModal(false);
      setAddFormData({ username: '', password: '', name: '', role: 'agent', email: '' });
      loadUsers();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      console.error('Error creating user:', err);
      setErrorMsg(err.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setErrorMsg('');
    setUpdating(true);
    try {
      const updateData = {
        ...editFormData,
        password: editFormData.password || undefined
      };
      await api.updateUser(selectedUser.id, updateData);
      setSuccessMsg(`L'utilisateur ${editFormData.name} a été mis à jour !`);
      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      console.error('Error updating user:', err);
      setErrorMsg(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    setDeleting(true);
    try {
      await api.deleteUser(userId);
      setSuccessMsg('Utilisateur supprimé avec succès !');
      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setErrorMsg(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      username: user.username || '',
      name: user.name || '',
      role: user.role || 'agent',
      email: user.email || '',
      password: ''
    });
    setShowEditModal(true);
    setErrorMsg('');
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <Users className="w-5 h-5 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <span className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Synchronisation des accès...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button 
          onClick={() => setShowAddModal(true)}
          className="group relative overflow-hidden flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-bold uppercase tracking-wider text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-[1.02]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Nouvel Agent
          </div>
        </button>
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-white">
            Gestion des <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">Accés</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Administration des comptes et permissions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden group bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-5 hover:border-violet-500/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{users.filter(u => u.role === 'agent').length}</p>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Agents</p>
            </div>
          </div>
        </div>
        
        <div className="relative overflow-hidden group bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-5 hover:border-emerald-500/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{users.filter(u => u.role === 'qualite').length}</p>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Qualité</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden group bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-5 hover:border-purple-500/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{users.filter(u => u.role === 'admin').length}</p>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Admins</p>
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="relative bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <p className="text-emerald-400 font-semibold">{successMsg}</p>
        </div>
      )}

      {/* Table */}
      <div className="relative overflow-hidden bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-4 font-semibold text-slate-400 uppercase tracking-widest text-[10px]">Utilisateur</th>
                <th className="text-left p-4 font-semibold text-slate-400 uppercase tracking-widest text-[10px]">Contact</th>
                <th className="text-left p-4 font-semibold text-slate-400 uppercase tracking-widest text-[10px]">Rôle</th>
                <th className="text-right p-4 font-semibold text-slate-400 uppercase tracking-widest text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center font-bold text-violet-300 text-sm uppercase">
                        {u.name?.substring(0, 2) || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{u.name}</p>
                        <p className="text-xs text-slate-500">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{u.email || `${u.username}@crm-ai.com`}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider border ${
                      u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                      u.role === 'qualite' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {u.role === 'admin' ? 'Admin' : u.role === 'qualite' ? 'Qualité' : 'Agent'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(u)}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-violet-500/20 border border-white/5 hover:border-violet-500/30 transition-all group"
                      >
                        <Edit2 className="w-4 h-4 text-slate-400 group-hover:text-violet-400" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/5 hover:border-red-500/30 transition-all group"
                      >
                        <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      /* PREMIUM ADD USER MODAL */
      {/* ========================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            onClick={() => setShowAddModal(false)}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl shadow-purple-500/10 overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Gradient Header */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
            
            {/* Header */}
            <div className="relative p-6 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Nouvel Agent</h2>
                  <p className="text-xs text-slate-400">Créer un nouveau compte utilisateur</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUser} className="p-6 pt-0 space-y-4">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              <div className="space-y-3">
                {/* Name Input */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Nom Complet</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-violet-400 transition-colors">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Ahmed Mansour"
                      className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.05] transition-all"
                      value={addFormData.name}
                      onChange={e => setAddFormData({...addFormData, name: e.target.value})}
                    />
                  </div>
                </div>

                {/* Username & Password */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">Login</label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-violet-400 transition-colors">
                        <span className="text-sm font-bold">@</span>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="ahmed.m"
                        className="w-full pl-9 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.05] transition-all"
                        value={addFormData.username}
                        onChange={e => setAddFormData({...addFormData, username: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">Mot de passe</label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-violet-400 transition-colors">
                        <span className="text-sm font-bold">🔒</span>
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.05] transition-all"
                        value={addFormData.password}
                        onChange={e => setAddFormData({...addFormData, password: e.target.value})}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Email Professionnel</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-violet-400 transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="agent@entreprise.com"
                      className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.05] transition-all"
                      value={addFormData.email}
                      onChange={e => setAddFormData({...addFormData, email: e.target.value})}
                    />
                  </div>
                </div>

                {/* Role Select */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Rôle</label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.05] transition-all appearance-none cursor-pointer"
                      value={addFormData.role}
                      onChange={e => setAddFormData({...addFormData, role: e.target.value})}
                    >
                      <option value="agent" className="bg-slate-900">Agent Commercial</option>
                      <option value="qualite" className="bg-slate-900">Service Qualité</option>
                      <option value="admin" className="bg-slate-900">Administrateur</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 bg-white/[0.03] text-slate-300 font-semibold rounded-xl border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Créer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      /* PREMIUM EDIT USER MODAL */
      {/* ========================================== */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            onClick={() => setShowEditModal(false)}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl shadow-purple-500/10 overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Gradient Header */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-amber-600/20 via-orange-600/10 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
            
            {/* Header */}
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
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditUser} className="p-6 pt-0 space-y-4">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              <div className="space-y-3">
                {/* Name Input */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Nom Complet</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-400 transition-colors">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white font-medium focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.05] transition-all"
                      value={editFormData.name}
                      onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Login</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-400 transition-colors">
                      <span className="text-sm font-bold">@</span>
                    </div>
                    <input
                      type="text"
                      required
                      className="w-full pl-9 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white font-medium focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.05] transition-all"
                      value={editFormData.username}
                      onChange={e => setEditFormData({...editFormData, username: e.target.value})}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Email</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-400 transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white font-medium focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.05] transition-all"
                      value={editFormData.email}
                      onChange={e => setEditFormData({...editFormData, email: e.target.value})}
                    />
                  </div>
                </div>

                {/* Role Select */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Rôle</label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white font-medium focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.05] transition-all appearance-none cursor-pointer"
                      value={editFormData.role}
                      onChange={e => setEditFormData({...editFormData, role: e.target.value})}
                    >
                      <option value="agent" className="bg-slate-900">Agent Commercial</option>
                      <option value="qualite" className="bg-slate-900">Service Qualité</option>
                      <option value="admin" className="bg-slate-900">Administrateur</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                {/* Password (optional) */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Nouveau mot de passe <span className="text-slate-500">(laisser vide pour garder l'actuel)</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-400 transition-colors">
                      <span className="text-sm font-bold">🔒</span>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 font-medium focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.05] transition-all"
                      value={editFormData.password}
                      onChange={e => setEditFormData({...editFormData, password: e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 font-semibold rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Supprimer
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Sauvegarder
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}