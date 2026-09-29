import { API_BASE } from '../services/api';
import React, { useState } from 'react';
import { Mail, Lock, KeyRound } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth, homePathFor } from '../contexts/AuthContext';

const API_URL = API_BASE;

export default function FirstLoginPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const [email, setEmail] = useState(params.get('email') || '');
  const [tempPassword, setTempPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/auth/first-login`, {
        email,
        motDePasseTemporaire: tempPassword,
        nouveauMotDePasse: newPassword
      });
      
      if (response.data.token) {
        const data = response.data;
        setSession(data.token, data);
        navigate(homePathFor({ role: (data.role || '').toLowerCase(), typeConfirmatrice: data.typeConfirmatrice?.toUpperCase() }));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'activation du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary p-6 text-center">
          <KeyRound className="w-12 h-12 text-white mx-auto mb-3" />
          <h1 className="text-white text-3xl font-black italic tracking-tighter text-foreground">Première connexion</h1>
          <p className="text-white/80 mt-1">Veuillez changer votre mot de passe</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/40"
                placeholder="votre@email.com"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe temporaire</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-primary/40"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Nouveau mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-primary/40"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Confirmer le mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-primary/40"
                required
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showPassword"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="showPassword" className="text-sm text-muted-foreground">
              Afficher les mots de passe
            </label>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Chargement...' : 'Activer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
}