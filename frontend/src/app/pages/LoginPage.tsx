import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, TrendingUp, Users, BarChart3, Sparkles, Shield, Zap, ChevronRight, Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      toast.success('Connexion réussie !', {
        style: {
          background: '#1e293b',
          color: '#fff',
          border: '1px solid rgba(16, 185, 129, 0.2)',
        },
      });
      navigate('/');
    } catch (err: any) {
      const msg = err.message || 'Identifiants incorrects';
      setError(msg);
      toast.error(msg, {
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
    <div className="min-h-screen flex bg-background relative overflow-hidden font-sans selection:bg-primary/30">
      
      {/* Dynamic Ambient Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Glow Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '7s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/15 rounded-full blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        
        {/* Premium Noise Overlay */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}></div>
        
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] opacity-50" />
      </div>

      <div className="w-full max-w-[1500px] mx-auto flex flex-col lg:flex-row relative z-10 p-6 lg:p-16 items-center gap-20">
        
        {/* Left Side: Brand & Hero Messaging */}
        <div className="flex-1 text-center lg:text-left flex flex-col justify-center">
          
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-card/60 border border-border rounded-full mb-10 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-foreground">Système CRM de Nouvelle Génération</span>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 mb-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-150 fill-mode-both">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-tr from-cyan-500 to-purple-500 rounded-3xl blur-lg opacity-40 group-hover:opacity-70 transition duration-700" />
              <div className="relative w-24 h-24 bg-card/80 backdrop-blur-xl border border-border rounded-3xl flex items-center justify-center transform group-hover:scale-105 group-hover:-rotate-3 transition-all duration-500 shadow-2xl">
                <Brain className="w-12 h-12 text-blue-500" />
              </div>
            </div>
            
            <div className="text-center lg:text-left mt-2 lg:mt-0">
              <h1 className="text-6xl lg:text-8xl font-black tracking-tighter text-foreground leading-none">
                AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">CRM</span>
              </h1>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground mt-3">Intelligence & Performance</p>
            </div>
          </div>

          <p className="text-xl lg:text-2xl text-foreground/90 max-w-2xl leading-relaxed mb-14 font-medium animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
            Propulsez vos ventes dans le futur. Une gestion client ultra-fluide, automatisée et sublimée par l'intelligence artificielle.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 fill-mode-both">
            {[
              { icon: Users, value: '500+', label: 'Clients Actifs', color: 'from-blue-400 to-cyan-400' },
              { icon: TrendingUp, value: '85%', label: 'Taux Conversion', color: 'from-emerald-400 to-teal-400' },
              { icon: BarChart3, value: '12M', label: 'Points de Données', color: 'from-purple-400 to-pink-400' },
            ].map((stat, i) => (
              <div key={i} className="relative group cursor-default">
                <div className="absolute inset-0 bg-gradient-to-br from-card/60 to-card/20 rounded-3xl border border-border backdrop-blur-sm group-hover:border-border/60 transition-all duration-500" />
                <div className="relative p-8 flex flex-col items-center lg:items-start">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} bg-opacity-10 mb-4 transform group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                     <stat.icon className="w-6 h-6 text-foreground drop-shadow-md" />
                  </div>
                  <p className="text-3xl font-black text-foreground tracking-tighter tabular-nums mb-1 drop-shadow-sm">{stat.value}</p>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 opacity-60 animate-in fade-in duration-1000 delay-700 fill-mode-both">
            <div className="flex items-center gap-2 font-black uppercase text-[11px] tracking-[0.2em] text-muted-foreground"><Shield className="w-4 h-4 text-cyan-400" /> Sécurité Avancée</div>
            <div className="flex items-center gap-2 font-black uppercase text-[11px] tracking-[0.2em] text-muted-foreground"><Zap className="w-4 h-4 text-amber-400" /> Temps Réel</div>
            <div className="flex items-center gap-2 font-black uppercase text-[11px] tracking-[0.2em] text-muted-foreground"><Sparkles className="w-4 h-4 text-purple-400" /> IA Native</div>
          </div>
        </div>

        {/* Right Side: Login Form (Pro Max Glassmorphism) */}
        <div className="w-full lg:w-[540px] animate-in fade-in zoom-in-95 duration-1000 delay-300 fill-mode-both">
          <div className="relative group">
            {/* Glowing border effect */}
            <div className="absolute -inset-[2px] bg-gradient-to-b from-cyan-500/50 via-indigo-500/20 to-purple-500/50 rounded-[2.5rem] opacity-70 blur-md group-hover:opacity-100 transition duration-1000" />
            
            <div className="relative bg-card/60 backdrop-blur-2xl border border-border rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.6)] p-10 lg:p-14 overflow-hidden">
              
              {/* Decorative inner glow */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                <Brain className="w-40 h-40 text-blue-500 transform rotate-12" />
              </div>

              <div className="relative z-10 mb-12">
                <h2 className="text-4xl font-black tracking-tight text-foreground mb-3">Connexion</h2>
                <p className="text-muted-foreground text-[13px] font-medium tracking-wide">Accédez à votre espace agent sécurisé</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-7 relative z-10">
                
                {/* Form fields */}
                <div className="space-y-3">
                  <Label htmlFor="username" className="text-muted-foreground text-[11px] font-bold uppercase tracking-[0.15em] ml-2">
                    Identifiant / Email
                  </Label>
                  <div className="relative group/input">
                    <User className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${error ? 'text-red-400' : 'text-muted-foreground/60 group-focus-within/input:text-primary'}`} />
                    <Input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full pl-14 pr-6 py-7 rounded-2xl bg-input/20 text-foreground placeholder:text-muted-foreground/50 border transition-all duration-300 text-base font-medium shadow-inner ${
                        error 
                          ? 'border-red-500/50 focus-visible:ring-1 focus-visible:ring-red-500/50 focus-visible:border-red-500' 
                          : 'border-border focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50 hover:border-border'
                      }`}
                      placeholder="votre.email@crm.ai"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
<Label htmlFor="password" className="text-muted-foreground text-[11px] font-bold uppercase tracking-[0.15em] ml-2">
                    Mot de passe
                  </Label>
                  <div className="relative group/input">
                    <Lock className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${error ? 'text-red-400' : 'text-muted-foreground/60 group-focus-within/input:text-primary'}`} />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-14 pr-14 py-7 rounded-2xl bg-input/20 text-foreground placeholder:text-muted-foreground/50 border transition-all duration-300 text-base font-medium shadow-inner ${
                        error 
                          ? 'border-red-500/50 focus-visible:ring-1 focus-visible:ring-red-500/50 focus-visible:border-red-500' 
                          : 'border-border focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50 hover:border-border'
                      }`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer p-2 rounded-lg hover:bg-accent ${error ? 'text-red-400' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                       <p className="text-red-400 text-xs font-bold uppercase tracking-wider">{error}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between px-2 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-5 h-5 rounded-md border border-border bg-input/30 group-hover:border-primary/60 transition-colors">
                       <input type="checkbox" className="peer sr-only" />
                       <div className="absolute inset-0 bg-cyan-500 opacity-0 peer-checked:opacity-100 rounded-md transition-opacity" />
                       <CheckIcon className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 relative z-10 transition-opacity" />
                    </div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">Mémoriser</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={() => navigate('/forgot-password')}
                    className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-16 mt-4 relative overflow-hidden bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 group border-0 shadow-lg shadow-emerald-500/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Lancer la session <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-12 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/50">
                  Système Core v3.0.0
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple check icon for the custom checkbox
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}