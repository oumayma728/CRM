import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { adminService } from '../../../services/adminService';
import { User, Plus, Edit, Trash2, Shield, Search, X, Users, UserCheck, UserCog, Headphones, Wrench, BadgeCheck } from 'lucide-react';

interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
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
  { value: 'technique', label: 'Service Technique', team: 'Technique', icon: Wrench },
  { value: 'qualite', label: 'Service Qualité', team: 'Qualité', icon: BadgeCheck },
  { value: 'admin', label: 'Administrateur', team: 'Administration', icon: Shield }
];

const roleLabels: Record<string, string> = {
  agent: 'Agent',
  AGENT: 'Agent',
  confirmatrice1: 'Confirmatrice 1',
  CONFIRMATRICE1: 'Confirmatrice 1',
  confirmatrice2: 'Confirmatrice 2',
  CONFIRMATRICE2: 'Confirmatrice 2',
  admin: 'Administrateur',
  ADMIN: 'Administrateur',
  qualite: 'Service Qualité',
  QUALITE: 'Service Qualité',
  technique: 'Service Technique',
  TECHNIQUE: 'Service Technique'
};

const roleColors: Record<string, string> = {
  agent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  AGENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  confirmatrice1: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  CONFIRMATRICE1: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  confirmatrice2: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  CONFIRMATRICE2: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  qualite: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  QUALITE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  technique: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  TECHNIQUE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
};

export default function UsersPage() {
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Utilisateur | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    role: 'agent',
    equipe: ''
  });

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

  // Statistiques par rôle (insensible à la casse)
  const stats = {
    total: users.length,
    agents: users.filter(u => u.role?.toLowerCase() === 'agent').length,
    confirmatrices1: users.filter(u => u.role?.toLowerCase() === 'confirmatrice1').length,
    confirmatrices2: users.filter(u => u.role?.toLowerCase() === 'confirmatrice2').length,
    techniques: users.filter(u => u.role?.toLowerCase() === 'technique').length,
    qualites: users.filter(u => u.role?.toLowerCase() === 'qualite').length,
    admins: users.filter(u => u.role?.toLowerCase() === 'admin').length
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Utilisateurs</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Gérez les comptes et permissions</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouvel utilisateur
          </button>
        </div>

        {/* Stats Cards - Tous les rôles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</h3>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Agents</h3>
              <User className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.agents}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Confirmatrices 1</h3>
              <UserCheck className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.confirmatrices1}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Confirmatrices 2</h3>
              <UserCheck className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.confirmatrices2}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Service Technique</h3>
              <Wrench className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.techniques}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Service Qualité</h3>
              <BadgeCheck className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.qualites}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Nom</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Email</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Rôle</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Équipe</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Statut</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{user.prenom} {user.nom}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs ${roleColors[user.role] || 'bg-gray-100 text-gray-700'}`}>
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">{user.equipe || '-'}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                        !user.actif 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : user.statut === 'EN_ATTENTE'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {!user.actif ? 'Inactif' : user.statut === 'EN_ATTENTE' ? 'En attente' : 'Actif'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
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

      {/* Modal Ajout Utilisateur */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1 hover:bg-gray-100 rounded-lg">
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
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Prénom</label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
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
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={formData.motDePasse}
                  onChange={(e) => setFormData({ ...formData, motDePasse: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Rôle</label>
                <select
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
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
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                  placeholder="Équipe par défaut"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}