import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Phone, PhoneOff, Pause, Play, Volume2, Mic, MicOff, User, Building, Mail, MapPin, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (callActive && !isPaused) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval !== undefined) {
        clearInterval(interval);
      }
    };
  }, [callActive, isPaused]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const transcription = [
    { speaker: 'Agent', text: 'Bonjour, je suis Sarah de EBI Call Center. Puis-je parler à M. Dupont ?', time: '00:02', sentiment: 'positive' },
    { speaker: 'Client', text: 'Oui, c\'est moi. De quoi s\'agit-il ?', time: '00:08', sentiment: 'neutral' },
    { speaker: 'Agent', text: 'Je vous appelle concernant votre demande de devis pour nos services de téléphonie...', time: '00:12', sentiment: 'positive' },
    { speaker: 'Client', text: 'Ah oui, je suis intéressé. Quels sont vos tarifs ?', time: '00:25', sentiment: 'positive' }
  ];

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-foreground">Appel en cours</h3>
                <p className="text-sm text-muted-foreground">+33 6 12 34 56 78</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${
                callActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
              }`}>
                {callActive ? 'En ligne' : 'En attente'}
              </div>
            </div>

            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className={`w-32 h-32 rounded-full ${callActive ? 'bg-gradient-to-br from-primary to-secondary' : 'bg-muted'} flex items-center justify-center`}>
                  <Phone className="w-16 h-16 text-white" />
                </div>
                {callActive && (
                  <div className="absolute inset-0 rounded-full animate-ping bg-primary opacity-20"></div>
                )}
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-4xl font-medium text-foreground">{formatDuration(callDuration)}</p>
            </div>

            <div className="flex items-center justify-center gap-3">
              {!callActive ? (
                <button
                  onClick={() => setCallActive(true)}
                  className="bg-success hover:bg-success/90 text-success-foreground p-4 rounded-full transition-colors"
                >
                  <Phone className="w-6 h-6" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="bg-warning hover:bg-warning/90 text-warning-foreground p-4 rounded-full transition-colors"
                  >
                    {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                  </button>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="bg-muted hover:bg-muted/80 text-foreground p-4 rounded-full transition-colors"
                  >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                  <button className="bg-muted hover:bg-muted/80 text-foreground p-4 rounded-full transition-colors">
                    <Volume2 className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => {
                      setCallActive(false);
                      setCallDuration(0);
                      setIsPaused(false);
                    }}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground p-4 rounded-full transition-colors"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h3>Transcription en temps réel</h3>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {transcription.map((item, index) => (
                <div key={index} className={`p-3 rounded-lg ${
                  item.speaker === 'Agent' ? 'bg-primary/10 ml-8' : 'bg-muted mr-8'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-foreground">{item.speaker}</span>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                  <p className="text-sm text-foreground">{item.text}</p>
                  <div className="mt-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      item.sentiment === 'positive' ? 'bg-success/20 text-success' :
                      item.sentiment === 'negative' ? 'bg-destructive/20 text-destructive' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {item.sentiment === 'positive' ? '😊 Positif' : item.sentiment === 'negative' ? '😞 Négatif' : '😐 Neutre'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="mb-4">Informations Contact</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Société</p>
                  <p className="text-foreground">Société ABC SAS</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="text-foreground">Jean Dupont</p>
                  <p className="text-sm text-muted-foreground">Directeur Commercial</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-foreground">j.dupont@societeabc.fr</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Adresse</p>
                  <p className="text-foreground">15 Avenue des Champs-Élysées, 75008 Paris</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="mb-4">Formulaire de qualification</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-foreground">Besoin identifié</label>
                <select className="w-full px-3 py-2 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground">
                  <option>Téléphonie d'entreprise</option>
                  <option>Centre d'appels</option>
                  <option>Standard virtuel</option>
                  <option>Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2 text-foreground">Budget estimé</label>
                <input
                  type="text"
                  placeholder="Ex: 5000€"
                  className="w-full px-3 py-2 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-foreground">Niveau d'intérêt</label>
                <div className="flex gap-2">
                  {['Faible', 'Moyen', 'Élevé', 'Très élevé'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      className="flex-1 px-3 py-2 border border-input rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors text-foreground"
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 text-foreground">Notes</label>
                <textarea
                  rows={4}
                  placeholder="Ajouter des notes..."
                  className="w-full px-3 py-2 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground resize-none"
                ></textarea>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 px-4 py-2 bg-success text-success-foreground rounded-lg hover:bg-success/90 transition-colors"
                >
                  Converti
                </button>
                <button
                  type="button"
                  className="flex-1 px-4 py-2 bg-warning text-warning-foreground rounded-lg hover:bg-warning/90 transition-colors"
                >
                  Rappel
                </button>
                <button
                  type="button"
                  className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                >
                  Refusé
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
