import React, { useState } from 'react';
import { Shield, EyeOff, Lock, Trash2, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function GDPRPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleAnonymize = () => {
    setLoading(true);
    // Simulate anonymization process
    setTimeout(() => {
      setLoading(false);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2>Sécurité & Conformité RGPD</h2>
        <p className="text-muted-foreground mt-1">Gérez la protection des données personnelles et la traçabilité des accès</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Policy Section */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center gap-3 text-primary mb-2">
            <Shield className="w-6 h-6" />
            <h3 className="font-bold">Politique de Rétention</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Conformément au RGPD, les enregistrements audio sont conservés pendant une durée de <strong>6 mois</strong>. 
            Les transcriptions textuelles sont anonymisées automatiquement après ce délai.
          </p>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
            <span>Délai de conservation</span>
            <span className="font-bold">180 Jours</span>
          </div>
        </div>

        {/* Access Tracing */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center gap-3 text-purple-500 mb-2">
            <Lock className="w-6 h-6" />
            <h3 className="font-bold">Traçabilité des accès</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Chaque consultation d'appel par un administrateur est journalisée avec l'IP et l'horodatage.
          </p>
          <button className="text-xs font-bold text-primary uppercase tracking-wider hover:underline">
            Consulter les logs d'audit ➔
          </button>
        </div>
      </div>

      {/* Action Zone */}
      <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <EyeOff className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-xl font-bold">Anonymisation des données</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Cette action remplacera les noms des clients et les numéros de téléphone par des astérisques dans tous les enregistrements de plus de 6 mois.
        </p>
        <div className="pt-4">
          <button 
            onClick={handleAnonymize}
            disabled={loading}
            className="px-8 py-3 bg-destructive text-destructive-foreground rounded-xl font-bold flex items-center gap-2 mx-auto hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
            {loading ? "Traitement en cours..." : "Lancer l'anonymisation massive"}
          </button>
          
          {done && (
            <div className="mt-4 flex items-center justify-center gap-2 text-success font-bold animate-bounce">
              <CheckCircle className="w-5 h-5" />
              Opération terminée avec succès
            </div>
          )}
        </div>
      </div>

      {/* Alert Card */}
      <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
        <p className="text-xs text-warning leading-relaxed">
          <strong>Attention :</strong> L'anonymisation est irréversible. Assurez-vous d'avoir exporté les rapports nécessaires avant de procéder.
        </p>
      </div>
    </div>
  );
}
