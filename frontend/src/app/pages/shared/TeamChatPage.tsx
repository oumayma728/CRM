import { API_ORIGIN, getToken } from '../../services/api';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/crmApi';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ChatMsg {
  id: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  content: string;
  channel: string;
  sentAt: string;
}

interface Channel {
  id: string;
  label: string;
  canRead: boolean;    // read the history + receive live messages
  canWrite: boolean;   // send a message (one can write to a group one cannot read)
}

const BACKEND_URL = API_ORIGIN;

// ─── Couleur par rôle ────────────────────────────────────────────────────────
function roleColor(role: string): string {
  const r = role?.toUpperCase();
  if (r === 'ADMIN' || r === 'SUPERADMIN') return 'bg-destructive/15 text-destructive';
  if (r === 'AGENT') return 'bg-primary/15 text-primary';
  if (r === 'CONFIRMATRICE') return 'bg-primary/15 text-primary';
  if (r === 'QUALITE') return 'bg-warning/15 text-warning';
  if (r === 'TECH') return 'bg-success/15 text-success';
  return 'bg-muted text-muted-foreground';
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function TeamChatPage() {
  const { user } = useAuth();
  const token = getToken() ?? '';

  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState('GENERAL');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sendError, setSendError] = useState('');
  const [recipient, setRecipient] = useState('');     // the group the message is SENT to (chosen in the "À :" selector)
  const [notice, setNotice] = useState('');           // "Message envoyé à ..." when it goes to a group shown elsewhere

  const hubRef = useRef<signalR.HubConnection | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const currentChannelRef = useRef(activeChannel);

  // ── 1. Fetch channels from backend ───────────────────────────────────────
  useEffect(() => {
    api.get('/chat').then(r => {
      setChannels(r.data as Channel[]);          // already filtered by the server according to the role
    }).catch(() => {
      // fallback: only the general channel (announcements, read by everybody)
      setChannels([{ id: 'GENERAL', label: 'Général', canRead: true, canWrite: false }]);
    });
  }, []);

  useEffect(() => {
    if (channels.length === 0) return;
    setRecipient(prev => {
      if (prev && channels.some(c => c.id === prev && c.canWrite)) return prev;
      const open = channels.find(c => c.id === currentChannelRef.current && c.canWrite);
      return (open ?? channels.find(c => c.canWrite))?.id ?? '';
    });
  }, [channels]);

  // ── 2. Load history when channel changes ─────────────────────────────────
  const loadHistory = useCallback(async (channel: string) => {
    setLoadingHistory(true);
    try {
      const r = await api.get(`/chat/${channel}`);
      setMessages(r.data);
    } catch {
      setMessages([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // ── 3. SignalR connection ─────────────────────────────────────────────────
  useEffect(() => {
    const hub = new signalR.HubConnectionBuilder()
      .withUrl(`${BACKEND_URL}/hubs/chat`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    hub.on('ReceiveMessage', (msg: ChatMsg) => {
      if (msg.channel === currentChannelRef.current) {
        setMessages(prev => [...prev, msg]);
      }
    });

    hub.start()
      .then(() => {
        setConnected(true);
        // Join initial channel
        hub.invoke('JoinChannel', currentChannelRef.current).catch(() => {});
      })
      .catch(() => setConnected(false));

    hubRef.current = hub;
    return () => { hub.stop(); };
  }, [token]);

  // ── 4. Switch channel ─────────────────────────────────────────────────────
  const switchChannel = async (channel: string) => {
    const hub = hubRef.current;
    const next = channels.find(c => c.id === channel);
    if (hub && hub.state === signalR.HubConnectionState.Connected) {
      await hub.invoke('LeaveChannel', currentChannelRef.current).catch(() => {});
      if (next?.canRead) await hub.invoke('JoinChannel', channel).catch(() => {});
    }
    currentChannelRef.current = channel;
    setMessages([]);
    setSendError('');
    setActiveChannel(channel);
    if (next?.canWrite) setRecipient(channel);       // opening a group you can write to selects it as the recipient
  };

  // history of the active channel (not for a write-only group: the server would answer 403)
  useEffect(() => {
    if (channels.length === 0) return;
    const info = channels.find(c => c.id === activeChannel);
    if (info && !info.canRead) { setMessages([]); return; }
    loadHistory(activeChannel);
  }, [activeChannel, channels]);

  // ── 5. Auto-scroll ───────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── 6. Send message ──────────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !recipient) return;
    const hub = hubRef.current;
    if (hub && hub.state === signalR.HubConnectionState.Connected) {
      try {
        await hub.invoke('SendMessage', recipient, text);
        setSendError('');
        if (recipient !== activeChannel) {
          // the message goes to a group that is not the one on screen: confirm it
          const label = channels.find(c => c.id === recipient)?.label ?? recipient;
          setNotice(`Message envoyé à « ${label} »`);
          setTimeout(() => setNotice(''), 4000);
        }
      } catch (e: any) {
        // SignalR wraps the server message: "...HubException: <message>"
        const raw = String(e?.message ?? '');
        setSendError(raw.includes('HubException:') ? raw.split('HubException:').pop()!.trim() : "Le message n'a pas pu être envoyé.");
        return;                                    // keep the text so that nothing is lost
      }
    }
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const activeInfo = channels.find(c => c.id === activeChannel);
  const readable = channels.filter(c => c.canRead);       // groups whose conversation I can follow (left list)
  const writable = channels.filter(c => c.canWrite);      // groups I can send a message to ("À :" selector)

  const channelButton = (c: Channel) => (
    <button
      key={c.id}
      onClick={() => switchChannel(c.id)}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
        activeChannel === c.id
          ? 'bg-primary text-primary-foreground font-medium'
          : 'text-foreground hover:bg-muted'
      }`}
    >
      <span className="truncate">{c.label}</span>
    </button>
  );

  return (
    <div className="flex h-[calc(100vh-120px)] bg-card rounded-xl border border-border overflow-hidden">

      {/* ── Sidebar canaux ─────────────────────────────────────────────── */}
      <div className="w-56 shrink-0 border-r border-border flex flex-col bg-muted/30">
        {/* Header */}
        <div className="px-4 py-4 border-b border-border">
          <div className="mb-1">
            <span className="font-semibold text-sm">Messages</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-success' : 'bg-destructive/60'}`} />
            <span className="text-xs text-muted-foreground">{connected ? 'Connecté' : 'Déconnecté'}</span>
          </div>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
          <p className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mes conversations</p>
          {readable.map(channelButton)}
        </div>

        {/* Current user */}
        <div className="px-3 py-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium truncate">{user?.name ?? 'Utilisateur'}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role ?? ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Zone messages ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header canal */}
        <div className="px-5 py-3 border-b border-border flex items-center gap-3 shrink-0">
          <div>
            <h2 className="font-semibold text-sm">{activeInfo?.label ?? activeChannel}</h2>
            <p className="text-xs text-muted-foreground">Messages reçus dans ce groupe</p>
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            <span>Discussion en temps réel</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loadingHistory ? (
            <div className="flex justify-center pt-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 pt-8">
              <p className="text-sm">Aucun message dans ce groupe</p>
              <p className="text-xs opacity-60">Choisissez le destinataire dans « À : » pour écrire à un rôle.</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.senderId === user?.id;
              const showAvatar = i === 0 || messages[i - 1].senderId !== msg.senderId;
              return (
                <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {msg.senderName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                    {showAvatar && (
                      <div className={`flex items-center gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-xs font-semibold">{msg.senderName}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${roleColor(msg.senderRole)}`}>
                          {msg.senderRole}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatTime(msg.sentAt)}</span>
                      </div>
                    )}
                    <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                      isMe
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted text-foreground rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer: choose WHO the message goes to, then write it */}
        <div className="px-5 py-3 border-t border-border shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <label htmlFor="chat-recipient" className="text-xs font-semibold text-muted-foreground shrink-0">À :</label>
            <select
              id="chat-recipient"
              value={recipient}
              onChange={e => { setRecipient(e.target.value); setSendError(''); }}
              disabled={writable.length === 0}
              className="flex-1 max-w-xs bg-muted/50 border border-input rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {writable.length === 0 && <option value="">Aucun destinataire</option>}
              {writable.map(c => (
                <option key={c.id} value={c.id}>{c.label}{c.canRead ? '' : ' (envoi seulement)'}</option>
              ))}
            </select>
            {notice && <span className="text-xs text-success font-medium">{notice}</span>}
          </div>
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={recipient ? `Message pour « ${channels.find(c => c.id === recipient)?.label ?? recipient} »…` : 'Choisissez un destinataire'}
              disabled={!recipient}
              rows={1}
              className="glass-input flex-1 resize-none bg-muted/50 border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary max-h-32 overflow-y-auto"
              style={{ minHeight: '42px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || !connected || !recipient}
              className="flex items-center justify-center h-10 px-4 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition disabled:opacity-40 shrink-0"
            >
              Envoyer
            </button>
          </div>
          {sendError
            ? <p className="text-xs text-destructive mt-1.5">{sendError}</p>
            : <p className="text-xs text-muted-foreground mt-1.5">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</p>}
        </div>
      </div>
    </div>
  );
}
