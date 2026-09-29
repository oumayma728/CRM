import { API_BASE, getToken } from '../../services/api';
import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { User, Plus, Edit, Trash2, Shield, Search, X, Users, UserCheck, UserCog, Headphones, Wrench, BadgeCheck, KeyRound, CalendarDays, Eye, Mail, Phone, Clock } from 'lucide-react';
import axios from 'axios';

const API_URL = API_BASE;

interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  type?: string; // CONF1 | CONF2 | CONFCLIENT for confirmatrices
  equipe?: string;
  statut?: string;
  actif: boolean;
  dateCreation: string;
  derniereConnexion?: string;
}

const roleOptions = [
  { value: 'agent', label: 'Agent', team: 'Équipe A', icon: User },
  { value: 'confirmatrice1', label: 'Confirmatrice 1', team: 'Validation', icon: UserCheck },
  { value: 'confirmatrice2', label: 'Confirmatrice 2', team: 'Validation', icon: UserCheck },
  { value: 'confirmatriceclient', label: 'Confirmatrice Client', team: 'Validation Client', icon: UserCheck },
  { value: 'technique', label: 'Service Technique', team: 'Technique', icon: Wrench },
  { value: 'qualite', label: 'Service Qualité', team: 'Qualité', icon: BadgeCheck },
  { value: 'admin', label: 'Administrateur', team: 'Administration', icon: Shield }
];

// Role label helper — uses type for confirmatrices
const getRoleLabel = (user: Utilisateur): string => {
  const role = user.role?.toUpperCase();
  if (role === 'CONFIRMATRICE') {
    if (user.type === 'CONF1') return 'Confirmatrice 1';
    if (user.type === 'CONF2') return 'Confirmatrice 2';
    if (user.type === 'CONFCLIENT') return 'Confirmatrice Client';
    return 'Confirmatrice';
  }
  const labels: Record<string, string> = {
    AGENT: 'Agent', ADMIN: 'Administrateur',
    QUAL: 'Service Qualité', TECH: 'Service Technique',
  };
  return labels[role] || user.role;
};

const getRoleColor = (user: Utilisateur): string => {
  const role = user.role?.toUpperCase();
  if (role === 'CONFIRMATRICE') return 'bg-primary/15 text-primary';
  const colors: Record<string, string> = {
    AGENT: 'bg-primary/15 text-primary',
    ADMIN: 'bg-destructive/15 text-destructive',
    QUAL: 'bg-success/15 text-success',
    TECH: 'bg-warning/15 text-warning',
  };
  return colors[role] || 'bg-muted text-foreground';
};

interface AgendaDisponible {
  id: string;
  nom: string;
  description: string;
  icon: string;
}

const AGENDAS_DISPONIBLES: AgendaDisponible[] = [
  { id: 'CLIENT1', nom: 'Agenda Client 1', description: 'RDV client type 1', icon: '👤' },
  { id: 'CLIENT2', nom: 'Agenda Client 2', description: 'RDV client type 2', icon: '👥' },
  { id: 'REFUS',   nom: 'Agenda Refus',    description: 'RDV refusés',        icon: '❌' },
  { id: 'EBI',     nom: 'Agenda EBI',      description: 'RDV équipe EBI',     icon: '🏢' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Utilisateur | null>(null);
  const [viewingUser, setViewingUser] = useState<Utilisateur | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    role: 'agent',
    equipe: ''
  });

  // --- Gestion agendas confirmatrices ---
  const [agendaTarget, setAgendaTarget] = useState<Utilisateur | null>(null);
  const [agendaAccess, setAgendaAccess] = useState<string[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(false);

  const openAgendaModal = async (user: Utilisateur) => {
    setAgendaTarget(user);
    setAgendaLoading(true);
    try {
      const token = getToken();
      const res = await axios.get(`${API_URL}/admin/confirmatrices/agendas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const found = (res.data as any[]).find((c: any) => c.id === user.id);
      setAgendaAccess(found?.agendasAccess ?? []);
    } catch {
      setAgendaAccess([]);
    } finally {
      setAgendaLoading(false);
    }
  };

  const toggleAgenda = async (agendaId: string) => {
    if (!agendaTarget) return;
    const assigned = !agendaAccess.includes(agendaId);
    try {
      const token = getToken();
      const res = await axios.put(
        `${API_URL}/admin/confirmatrices/${agendaTarget.id}/assign-agenda`,
        { agendaId, assigned },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAgendaAccess(res.data.agendasAccess ?? []);
    } catch (err) {
      console.error('Erreur assignation agenda:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUtilisateurs();
      setUsers(response.data);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      await adminService.createUtilisateur(formData);
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Erreur création utilisateur:', error);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await adminService.deleteUtilisateur(id);
        fetchUsers();
      } catch (error) {
        console.error('Erreur suppression utilisateur:', error);
      }
    }
  };

  const handleAdminResetPassword = async (id: number, nom: string, prenom: string) => {
    if (!window.confirm(`Réinitialiser le mot de passe de ${prenom} ${nom} ? Un email avec le nouveau mot de passe temporaire sera envoyé.`)) return;
    try {
      const token = getToken();
      const res = await axios.post(
        `${API_URL}/auth/admin-reset-password`,
        { userId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Mot de passe réinitialisé. Mot de passe temporaire : ${res.data.tempPassword}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la réinitialisation.');
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      motDePasse: '',
      role: 'agent',
      equipe: ''
    });
    setEditingUser(null);
  };

  const handleRoleChange = (role: string) => {
    const roleOption = roleOptions.find(r => r.value === role);
    setFormData({
      ...formData,
      role,
      equipe: roleOption?.team || ''
    });
  };

  const filteredUsers = users.filter(user =>
    `${user.prenom} ${user.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: users.length,
    agents: users.filter(u => u.role?.toUpperCase() === 'AGENT').length,
    confirmatrices1: users.filter(u => u.role?.toUpperCase() === 'CONFIRMATRICE' && u.type === 'CONF1').length,
    confirmatrices2: users.filter(u => u.role?.toUpperCase() === 'CONFIRMATRICE' && u.type === 'CONF2').length,
    confirmatiresClient: users.filter(u => u.role?.toUpperCase() === 'CONFIRMATRICE' && u.type === 'CONFCLIENT').length,
    techniques: users.filter(u => u.role?.toUpperCase() === 'TECH').length,
    qualites: users.filter(u => u.role?.toUpperCase() === 'QUAL').length,
  };

  if (loading) {
    return (
      <><div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div></>
    );
  }

  return (
    <><div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Gestion des Utilisateurs</h1>
            <p className="text-muted-foreground mt-1">Gérez les comptes et permissions</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouvel utilisateur
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {[
            { label: 'Total', value: stats.total, icon: Users, color: 'text-primary' },
            { label: 'Agents', value: stats.agents, icon: User, color: 'text-primary' },
            { label: 'Conf. 1', value: stats.confirmatrices1, icon: UserCheck, color: 'text-primary' },
            { label: 'Conf. 2', value: stats.confirmatrices2, icon: UserCheck, color: 'text-primary' },
            { label: 'Conf. Client', value: stats.confirmatiresClient, icon: UserCheck, color: 'text-primary' },
            { label: 'Technique', value: stats.techniques, icon: Wrench, color: 'text-warning' },
            { label: 'Qualité', value: stats.qualites, icon: BadgeCheck, color: 'text-success' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-muted-foreground">{label}</h3>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Users Table */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Nom</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Rôle</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Équipe</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Statut</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{user.prenom} {user.nom}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{user.email}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs ${getRoleColor(user)}`}>
                        {getRoleLabel(user)}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">{user.equipe || '-'}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                        !user.actif 
                          ? 'bg-destructive/15 text-destructive'
                          : user.statut === 'EN_ATTENTE'
                            ? 'bg-warning/15 text-warning'
                            : 'bg-success/15 text-success'
                      }`}>
                        {!user.actif ? 'Inactif' : user.statut === 'EN_ATTENTE' ? 'En attente' : 'Actif'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingUser(user)}
                          className="p-2 hover:bg-primary/15 rounded-lg transition-colors"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4 text-primary" />
                        </button>
                        {user.role?.toUpperCase() === 'CONFIRMATRICE' && (
                          <button
                            onClick={() => openAgendaModal(user)}
                            className="p-2 hover:bg-primary/15 rounded-lg transition-colors"
                            title="Gérer les agendas"
                          >
                            <CalendarDays className="w-4 h-4 text-primary" />
                          </button>
                        )}
                        <button
                          onClick={() => handleAdminResetPassword(user.id, user.nom, user.prenom)}
                          className="p-2 hover:bg-warning/15 rounded-lg transition-colors"
                          title="Réinitialiser le mot de passe"
                        >
                          <KeyRound className="w-4 h-4 text-warning" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 hover:bg-destructive/15 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Agendas Confirmatrice */}
      {agendaTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Agendas accessibles</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {agendaTarget.prenom} {agendaTarget.nom} — {getRoleLabel(agendaTarget)}
                </p>
              </div>
              <button onClick={() => setAgendaTarget(null)} className="p-1 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {agendaLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {AGENDAS_DISPONIBLES.map((agenda) => {
                  const isChecked = agendaAccess.includes(agenda.id);
                  return (
                    <label
                      key={agenda.id}
                      className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-primary/30 bg-primary/10'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleAgenda(agenda.id)}
                        className="w-4 h-4 accent-purple-600"
                      />
                      <span className="text-xl">{agenda.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{agenda.nom}</p>
                        <p className="text-xs text-muted-foreground">{agenda.description}</p>
                      </div>
                      {isChecked && (
                        <span className="text-xs text-primary font-medium">Actif</span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setAgendaTarget(null)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Voir Détails Utilisateur */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-xl font-bold text-foreground">Détails utilisateur</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Informations complètes du profil</p>
              </div>
              <button onClick={() => setViewingUser(null)} className="p-1 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Avatar + nom + statut */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-muted rounded-xl">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-foreground">
                  {viewingUser.prenom} {viewingUser.nom}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${getRoleColor(viewingUser)}`}>
                    {getRoleLabel(viewingUser)}
                  </span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${
                    !viewingUser.actif
                      ? 'bg-destructive/15 text-destructive'
                      : viewingUser.statut === 'EN_ATTENTE'
                        ? 'bg-warning/15 text-warning'
                        : 'bg-success/15 text-success'
                  }`}>
                    {!viewingUser.actif ? 'Inactif' : viewingUser.statut === 'EN_ATTENTE' ? 'En attente' : 'Actif'}
                  </span>
                </div>
              </div>
            </div>

            {/* Détails */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground">{viewingUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Rôle</p>
                    <p className="text-sm font-medium text-foreground">{getRoleLabel(viewingUser)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Équipe</p>
                    <p className="text-sm font-medium text-foreground">{viewingUser.equipe || '—'}</p>
                  </div>
                </div>
              </div>

              {viewingUser.type && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <UserCog className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="text-sm font-medium text-foreground">{viewingUser.type}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date création</p>
                    <p className="text-sm font-medium text-foreground">
                      {viewingUser.dateCreation
                        ? new Date(viewingUser.dateCreation).toLocaleDateString('fr-FR')
                        : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Dernière connexion</p>
                    <p className="text-sm font-medium text-foreground">
                      {viewingUser.derniereConnexion
                        ? new Date(viewingUser.derniereConnexion).toLocaleDateString('fr-FR')
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajout Utilisateur */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-foreground">
                {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Prénom</label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={formData.motDePasse}
                  onChange={(e) => setFormData({ ...formData, motDePasse: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Rôle</label>
                <select
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {roleOptions.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Équipe</label>
                <input
                  type="text"
                  value={formData.equipe}
                  onChange={(e) => setFormData({ ...formData, equipe: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Équipe par défaut"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-4 py-2 border rounded-lg hover:bg-muted"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}</>
  );
}