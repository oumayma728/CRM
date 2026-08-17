import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { 
  Bot, Send, Sparkles, Brain, Mic, Paperclip, 
  Plus, History, MessageSquare, Settings, User, 
  Copy, Check, Code2, Terminal, ChevronRight
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isCode?: boolean;
}

interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
}

const Chatbot: React.FC = () => {
  const { user } = useAuth();

  const quickActionsByRole: Record<string, { label: string; prompt: string }[]> = {
    agent: [
      { label: 'Mes RDV du jour', prompt: 'Quels sont mes rendez-vous pour aujourd\'hui ?' },
      { label: 'Score de mes leads', prompt: 'Quel est le score moyen de mes leads cette semaine ?' },
      { label: 'Aides éligibles', prompt: 'Quelles aides financières sont disponibles pour mes clients (CEE, Coup de Pouce) ?' },
      { label: 'Script objection prix', prompt: 'Donne-moi le script pour répondre à l\'objection prix sur la PAC' },
    ],
    qualite: [
      { label: 'Évaluations du jour', prompt: 'Résume les évaluations qualité d\'aujourd\'hui' },
      { label: 'Agents en alerte', prompt: 'Quels agents ont un score inférieur à 70% ?' },
      { label: 'Faux RDV détectés', prompt: 'Combien de faux RDV ont été détectés récemment ?' },
      { label: 'Stats conformité', prompt: 'Quel est le taux de conformité global cette semaine ?' },
    ],
    admin: [
      { label: 'Performance globale', prompt: 'Donne-moi un rapport de performance global de l\'équipe' },
      { label: 'Taux de conversion', prompt: 'Quel est le taux de conversion RDV → Vente ce mois-ci ?' },
      { label: 'Optimisation scoring', prompt: 'Quels critères de scoring IA devrais-je ajuster ?' },
      { label: 'Alertes critiques', prompt: 'Résume les alertes critiques de la journée' },
    ],
  };

  const roleActions = quickActionsByRole[user?.role || 'agent'] || quickActionsByRole.agent;

  // States
  const [activeTab, setActiveTab] = useState('conversations');
  const [currentChatId, setCurrentChatId] = useState('current');
  const [history, setHistory] = useState<ChatHistory[]>([
    { id: '1', title: 'Analysis Client ABC', messages: [] },
    { id: '2', title: 'Performance Report', messages: [] },
    { id: '3', title: 'Lead Qualification', messages: [] },
  ]);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: user?.role === 'admin'
        ? 'Bonjour Administrateur ! Je suis votre assistant CRM IA. Je peux vous aider avec les rapports de performance, l\'optimisation du scoring, et la supervision. Que souhaitez-vous ?'
        : user?.role === 'qualite'
        ? 'Bonjour Superviseur ! Je suis votre assistant CRM IA. Je peux analyser les évaluations qualité, détecter les faux RDV, et suivre la conformité. Comment puis-je vous aider ?'
        : 'Bonjour ! Je suis votre assistant CRM IA. Je peux vous aider avec vos rendez-vous, les scores de vos leads, les aides financières, et les scripts d\'appels. Que voulez-vous savoir ?',
      timestamp: new Date(),
    },
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSend(`📎 [Fichier joint: ${file.name}]`);
    }
    e.target.value = '';
  };

  // Actions
  const handleNewChat = () => {
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content: 'Nouveau chat démarré. Comment puis-je vous aider ?',
        timestamp: new Date(),
      },
    ]);
    setCurrentChatId('new-' + Date.now());
  };

  const loadChatFromHistory = (chat: ChatHistory) => {
    // Simulated chat loading
    setMessages([
      {
        id: 'hist-' + chat.id,
        role: 'assistant',
        content: `Chargement de la conversation : "${chat.title}"...`,
        timestamp: new Date(),
      },
      {
        id: 'hist-msg-' + chat.id,
        role: 'assistant',
        content: `Ceci est une simulation de l'historique pour "${chat.title}".`,
        timestamp: new Date(),
      }
    ]);
    setCurrentChatId(chat.id);
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.sendChatMessage(
        userMessage.content,
        user?.role || 'agent',
        user?.username
      );
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response || 'Désolé, je n\'ai pas pu traiter votre demande.',
        timestamp: new Date(),
        isCode: response.response?.includes('```')
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Erreur: ${error.message || 'Impossible de contacter le serveur.'}`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderContent = (content: string, id: string) => {
    if (content.includes('```')) {
      const parts = content.split('```');
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          return (
            <div key={index} className="my-4 bg-muted rounded-xl border border-border overflow-hidden shadow-lg">
              <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Code Block</span>
                </div>
                <button 
                  onClick={() => copyToClipboard(part, `${id}-${index}`)}
                  className="p-1 hover:bg-background rounded-md transition-colors"
                >
                  {copiedId === `${id}-${index}` ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-xs font-mono text-foreground leading-relaxed">
                <code>{part.trim()}</code>
              </pre>
            </div>
          );
        }
        return <p key={index} className="leading-relaxed">{part}</p>;
      });
    }
    return <p className="leading-relaxed">{content}</p>;
  };

  return (
    <div className="flex w-full h-full bg-background text-foreground overflow-hidden">
      
      {/* 1. Zone Centrale de Conversation (A GAUCHE) */}
      <main className="flex-1 flex flex-col bg-background relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,var(--primary-rgb,rgba(37,99,235,0.05)),transparent)] pointer-events-none" />
        
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 custom-scrollbar">
          {messages.map((message) => (
            <div key={message.id} className={`flex w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              <div className={`max-w-[85%] lg:max-w-[70%] flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg ${
                  message.role === 'assistant' 
                    ? 'bg-gradient-to-br from-[#00D4FF] to-[#2563EB] shadow-blue-500/20' 
                    : 'bg-[#1E293B] border border-blue-500/30'
                }`}>
                  {message.role === 'assistant' ? <Bot className="w-5 h-5 text-gray-900 dark:text-white" /> : <User className="w-5 h-5 text-blue-400" />}
                </div>
                
                <div className={`p-5 rounded-3xl shadow-xl ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-primary to-blue-600 text-white rounded-tr-none shadow-primary/20'
                    : 'bg-card text-foreground border border-border rounded-tl-none'
                }`}>
                  <div className="text-sm font-medium">
                    {renderContent(message.content, message.id)}
                  </div>
                  <div className={`text-[9px] font-black uppercase tracking-widest mt-3 opacity-40 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00D4FF] to-[#2563EB] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-gray-900 dark:text-white" />
                </div>
                <div className="bg-card p-4 rounded-3xl rounded-tl-none border border-border flex gap-1.5 items-center">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 3. Barre d'entrée intelligente */}
        <div className="p-6 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-[28px] opacity-20 group-focus-within:opacity-40 blur transition duration-500" />
            
            <div className="relative bg-card border border-border rounded-[24px] shadow-2xl flex items-center p-2 gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-gray-500 dark:text-gray-400 hover:text-[#00D4FF] transition-colors rounded-xl hover:bg-white dark:bg-slate-900/5"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Posez une question sur votre CRM..."
                className="flex-1 bg-transparent border-none focus:outline-none text-sm font-medium py-3 px-2 min-h-[50px] max-h-32 text-foreground placeholder:text-muted-foreground resize-none"
                rows={1}
              />
              
              <div className="flex items-center gap-2 pr-2">
                <button 
                  onClick={() => setIsRecording(!isRecording)}
                  className={`p-3 transition-colors rounded-xl hidden sm:flex ${
                    isRecording 
                      ? 'text-red-500 bg-red-500/10 animate-pulse' 
                      : 'text-gray-400 hover:text-[#00D4FF] hover:bg-white dark:bg-slate-900/5'
                  }`}
                  title={isRecording ? "Arrêter l'enregistrement" : "Démarrer l'enregistrement"}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button  
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="w-12 h-12 bg-gradient-to-r from-primary to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            
      <div className="flex justify-center gap-3 mt-4 overflow-x-auto py-2 no-scrollbar flex-wrap">
        {roleActions.map((action, i) => (
          <button
            key={i}
            onClick={() => handleSend(action.prompt)}
            className="px-4 py-1.5 bg-[#1E293B]/50 border border-[#7c3aed]/20 rounded-full text-[10px] font-black uppercase tracking-widest text-[#a78bfa] hover:bg-[#7c3aed]/10 hover:border-[#7c3aed]/40 transition-all whitespace-nowrap"
          >
            {action.label}
          </button>
        ))}
      </div>
          </div>
        </div>
      </main>

      {/* 2. Sidebar Latérale (A DROITE) */}
      <aside className="w-72 bg-card border-l border-border flex flex-col p-6 hidden lg:flex">


        <button 
          onClick={handleNewChat}
          className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-primary to-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest text-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_20px_rgba(37,99,235,0.3)] mb-8"
        >
          <Plus className="w-4 h-4" /> Nouveau Chat
        </button>

        <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-blue-400/60 mb-4 px-2">Navigation</div>
          {[
    { id: 'conversations', icon: MessageSquare, label: 'Conversations' },
        { id: 'analytics', icon: Sparkles, label: 'Analyse IA' },
        { id: 'logs', icon: History, label: 'Historique' },
        { id: 'settings', icon: Settings, label: 'Paramètres' },
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {activeTab === item.id && <ChevronRight className="w-3 h-3 ml-auto" />}
            </button>
          ))}
          
          <div className="pt-8 text-[10px] font-black uppercase tracking-widest text-blue-400/60 mb-4 px-2">History</div>
          {history.map((chat) => (
            <button 
              key={chat.id} 
              onClick={() => loadChatFromHistory(chat)}
              className={`flex items-center gap-3 w-full px-4 py-2 text-xs font-medium transition-colors truncate ${currentChatId === chat.id ? 'text-[#00D4FF] bg-blue-500/5 rounded-lg' : 'text-gray-500 hover:text-blue-300'}`}
            >
              <MessageSquare className="w-3 h-3 shrink-0" />
              <span className="truncate">{chat.title}</span>
            </button>
          ))}
        </nav>


      </aside>

    </div>
  );
};

export default Chatbot;