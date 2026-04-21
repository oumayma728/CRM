import React from 'react';
import { Layout } from '../../components/Layout';
import { User, Plus, Edit, Trash2, Shield } from 'lucide-react';

const users = [
  { id: 1, name: 'agent 1', email: 'sarah.martin@ebi.com', role: 'agent', team: 'Équipe A', status: 'actif' },
  { id: 2, name: 'agent 2', email: 'karim.benali@ebi.com', role: 'agent', team: 'Équipe B', status: 'actif' },
  { id: 3, name: 'confirmatrice 1', email: 'leila.mansour@ebi.com', role: 'confirmatrice1', team: 'Validation', status: 'actif' },
  { id: 4, name: 'admin 1', email: 'mohamed.habib@ebi.com', role: 'admin', team: 'Administration', status: 'actif' },
  { id: 5, name: 'service qualité ', email: 'nadia.kacem@ebi.com', role: 'qualite', team: 'Qualité', status: 'actif' }
];

const roleLabels: Record<string, string> = {
  agent: 'Agent',
  confirmatrice1: 'Confirmatrice 1',
  confirmatrice2: 'Confirmatrice 2',
  admin: 'Administrateur',
  qualite: 'Service Qualité',
  technique: 'Service Technique'
};

export default function UsersPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2>Gestion des Utilisateurs</h2>
            <p className="text-muted-foreground mt-1">Gérez les comptes et permissions</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
            <Plus className="w-5 h-5" />
            Nouvel utilisateur
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Total utilisateurs</h3>
              <User className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-medium text-foreground">{users.length}</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Agents</h3>
              <User className="w-5 h-5 text-success" />
            </div>
            <p className="text-3xl font-medium text-foreground">
              {users.filter(u => u.role === 'agent').length}
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Administrateurs</h3>
              <Shield className="w-5 h-5 text-warning" />
            </div>
            <p className="text-3xl font-medium text-foreground">
              {users.filter(u => u.role === 'admin').length}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3>Liste des utilisateurs</h3>
            <input
              type="text"
              placeholder="Rechercher..."
              className="px-3 py-2 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-muted-foreground">Nom</th>
                  <th className="text-left p-4 text-muted-foreground">Email</th>
                  <th className="text-left p-4 text-muted-foreground">Rôle</th>
                  <th className="text-left p-4 text-muted-foreground">Équipe</th>
                  <th className="text-left p-4 text-muted-foreground">Statut</th>
                  <th className="text-left p-4 text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{user.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{user.email}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="p-4 text-foreground">{user.team}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-success/10 text-success">
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                          <Edit className="w-4 h-4 text-foreground" />
                        </button>
                        <button className="p-2 hover:bg-destructive/10 rounded-lg transition-colors">
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
    </Layout>
  );
}
