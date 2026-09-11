import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Brain, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { toast } from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await forgotPassword(email);
      setSubmitted(true);
      toast.success('Email de réinitialisation envoyé !', {
        style: {
          background: '#1e293b',
          color: '#fff',
          border: '1px solid rgba(16, 185, 129, 0.2)',
        },
      });
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'envoi', {
        style: {
          background: '#1e293b',
          color: '#fff',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 relative overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* Dynamic Ambient Background - matching login */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '7s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/15 rounded-full blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />
        
        {/* Premium Noise Overlay */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("/noise.svg")' }}></div>
        
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] opacity-50" />
      </div>

      <div className="w-full max-w-[540px] mx-auto flex flex-col justify-center relative z-10 p-6 animate-in fade-in zoom-in-95 duration-1000">
        <div className="relative group">
          {/* Glowing border effect */}
          <div className="absolute -inset-[2px] bg-gradient-to-b from-cyan-500/50 via-indigo-500/20 to-purple-500/50 rounded-[2.5rem] opacity-50 blur-md group-hover:opacity-100 transition duration-1000" />
          
          <div className="relative bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] p-10 lg:p-14 overflow-hidden">
            
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
              <Brain className="w-40 h-40 text-blue-500 transform rotate-12" />
            </div>

            <button 
              onClick={() => navigate('/login')}
              className="relative z-10 flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors text-[11px] font-bold uppercase tracking-[0.15em] mb-10"
            >
              <ArrowLeft className="w-4 h-4" /> Retour à la connexion
            </button>

            <div className="relative z-10 mb-12">
              <h2 className="text-4xl font-black tracking-tight text-white mb-3">Récupération</h2>
              <p className="text-slate-400 text-[13px] font-medium tracking-wide">Entrez votre email pour recevoir un lien</p>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-7 relative z-10">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-slate-300 text-[11px] font-bold uppercase tracking-[0.15em] ml-2">
                    Adresse Email
                  </Label>
                  <div className="relative group/input">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/input:text-cyan-400 transition-colors duration-300" />
                    <Input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-14 pr-6 py-8 rounded-2xl bg-slate-950/50 text-white placeholder:text-slate-600 border border-white/5 focus-visible:ring-1 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500/50 hover:border-white/10 hover:bg-slate-900/50 transition-all duration-300 text-base font-medium shadow-inner"
                      placeholder="votre.email@crm.ai"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-16 mt-4 relative overflow-hidden bg-white text-slate-950 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 group border-0 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      Envoyer le lien <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="relative z-10 text-center py-8 space-y-6 animate-in fade-in zoom-in-95">
                <div className="w-24 h-24 bg-cyan-500/10 border border-cyan-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                  <Mail className="w-12 h-12 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-black text-white">Email envoyé !</h3>
                <p className="text-slate-400 text-sm font-medium">
                  Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.
                </p>
                <Button 
                  onClick={() => navigate('/login')}
                  className="mt-8 h-14 bg-slate-950/50 border border-white/10 text-white hover:bg-white/5 hover:border-white/20 rounded-2xl transition-all"
                >
                  Retourner au Login
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
