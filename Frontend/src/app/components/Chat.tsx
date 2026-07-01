/**
 * Chat.tsx — Messagerie temps réel SignalR
 * Hub : wss://localhost:5001/hubs/chat
 * Usage : <Chat /> dans n'importe quelle page protégée
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatMessage {
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
  icon: string;
}

const CHANNELS: Channel[] = [
  { id: 'GENERAL',        label: 'Général',          icon: '💬' },
  { id: 'AGENTS',         label: 'Agents',            icon: '📞' },
  { id: 'CONFIRMATRICES', label: 'Confirmatrices',    icon: '✅' },
  { id: 'QUALITE',        label: 'Service Qualité',   icon: '⭐' },
  { id: 'TECHNIQUE',      label: 'Service Technique', icon: '🔧' },
  { id: 'ADMIN',          label: 'Administration',    icon: '👑' },
];

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function getToken(): string {
  return localStorage.getItem('token') ?? '';
}

// ─── Composant principal ──────────────────────────────────────────────────────
const Chat: React.FC = () => {
  const [isOpen,      setIsOpen]      = useState(false);
  const [channel,     setChannel]     = useState('GENERAL');
  const [messages,    setMessages]    = useState<ChatMessage[]>([]);
  const [input,       setInput]       = useState('');
  const [connected,   setConnected]   = useState(false);
  const [unread,      setUnread]      = useState(0);
  const [loading,     setLoading]     = useState(false);

  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const bottomRef     = useRef<HTMLDivElement>(null);
  const prevChannel   = useRef<string>('');

  // ── Défilement automatique ─────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // ── Connexion SignalR ──────────────────────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/hubs/chat?access_token=${token}`)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    conn.on('ReceiveMessage', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
      if (!isOpen) setUnread(u => u + 1);
    });

    conn.on('JoinedChannel', (ch: string) => {
      console.log('[Chat] Joined channel:', ch);
    });

    conn.onreconnected(() => setConnected(true));
    conn.onclose(() => setConnected(false));

    conn.start()
      .then(() => {
        setConnected(true);
        conn.invoke('JoinChannel', 'GENERAL');
      })
      .catch(err => console.error('[Chat] Connection failed:', err));

    connectionRef.current = conn;

    return () => { conn.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Changement de canal ────────────────────────────────────────────────────
  const switchChannel = useCallback(async (newChannel: string) => {
    const conn = connectionRef.current;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;

    // Quitter l'ancien canal
    if (prevChannel.current && prevChannel.current !== newChannel) {
      await conn.invoke('LeaveChannel', prevChannel.current).catch(() => {});
    }

    // Charger l'historique
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/chat/${newChannel}?limit=50`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data: ChatMessage[] = await res.json();
        setMessages(data);
      }
    } catch { /* silently fail */ }
    setLoading(false);

    await conn.invoke('JoinChannel', newChannel).catch(() => {});
    prevChannel.current = newChannel;
    setChannel(newChannel);
  }, []);

  // Rejoindre le canal initial à l'ouverture
  useEffect(() => {
    if (isOpen && prevChannel.current !== channel) {
      switchChannel(channel);
    }
    if (isOpen) setUnread(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Envoi de message ───────────────────────────────────────────────────────
  const sendMessage = async () => {
    const conn = connectionRef.current;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;
    if (!input.trim()) return;

    try {
      await conn.invoke('SendMessage', channel, input.trim());
      setInput('');
    } catch (err) {
      console.error('[Chat] Send failed:', err);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentChannel = CHANNELS.find(c => c.id === channel) ?? CHANNELS[0];

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 52, height: 52, borderRadius: '50%',
          background: connected ? '#2563eb' : '#9ca3af',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,.25)',
          transition: 'background .2s',
        }}
        title={connected ? 'Chat (connecté)' : 'Chat (hors ligne)'}
      >
        <span style={{ fontSize: 22 }}>💬</span>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: '#ef4444', color: '#fff',
            borderRadius: '50%', fontSize: 11, fontWeight: 700,
            minWidth: 18, height: 18, lineHeight: '18px',
            textAlign: 'center', padding: '0 3px',
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {/* Fenêtre chat */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: 88, right: 24, zIndex: 1000,
          width: 360, height: 520, borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,.2)',
          background: '#fff', display: 'flex', flexDirection: 'column',
          overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif',
        }}>

          {/* Header */}
          <div style={{
            background: '#1e3a5f', color: '#fff', padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>{currentChannel.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{currentChannel.label}</div>
              <div style={{ fontSize: 11, opacity: .7 }}>
                {connected ? '🟢 Connecté' : '🔴 Reconnexion...'}
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#fff',
                       cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
            >✕</button>
          </div>

          {/* Canaux */}
          <div style={{
            display: 'flex', overflowX: 'auto', gap: 4, padding: '8px 12px',
            borderBottom: '1px solid #e5e7eb',
            scrollbarWidth: 'none',
          }}>
            {CHANNELS.map(ch => (
              <button
                key={ch.id}
                onClick={() => switchChannel(ch.id)}
                style={{
                  flexShrink: 0, padding: '4px 10px', borderRadius: 20,
                  border: 'none', cursor: 'pointer', fontSize: 12,
                  background: ch.id === channel ? '#dbeafe' : '#f3f4f6',
                  color: ch.id === channel ? '#1d4ed8' : '#374151',
                  fontWeight: ch.id === channel ? 700 : 400,
                  transition: 'all .15s',
                }}
              >
                {ch.icon} {ch.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '10px 14px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {loading && (
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                Chargement…
              </div>
            )}
            {!loading && messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 40 }}>
                Pas encore de messages dans ce canal.
              </div>
            )}
            {messages.map(m => (
              <MessageBubble key={m.id} msg={m} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Zone de saisie */}
          <div style={{
            padding: '10px 12px', borderTop: '1px solid #e5e7eb',
            display: 'flex', gap: 8, background: '#fafafa',
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={connected ? 'Écrire un message… (Entrée pour envoyer)' : 'Connexion en cours…'}
              disabled={!connected}
              rows={2}
              style={{
                flex: 1, resize: 'none', border: '1px solid #d1d5db',
                borderRadius: 8, padding: '8px 10px', fontSize: 13,
                fontFamily: 'inherit', outline: 'none',
                background: connected ? '#fff' : '#f3f4f6',
                color: '#111827',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!connected || !input.trim()}
              style={{
                padding: '0 14px', borderRadius: 8,
                background: connected && input.trim() ? '#2563eb' : '#d1d5db',
                border: 'none', color: '#fff', cursor: 'pointer',
                fontSize: 18, transition: 'background .15s',
              }}
            >➤</button>
          </div>
        </div>
      )}
    </>
  );
};

// ── Bulle de message ────────────────────────────────────────────────────────
interface BubbleProps { msg: ChatMessage; }

const MessageBubble: React.FC<BubbleProps> = ({ msg }) => {
  const myId = Number(localStorage.getItem('userId') ?? 0);
  const isMe = msg.senderId === myId;

  const roleColor: Record<string, string> = {
    AGENT: '#2563eb', ADMIN: '#7c3aed', QUALITE: '#059669',
    TECHNIQUE: '#d97706', CONFIRMATRICE: '#db2777',
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: isMe ? 'flex-end' : 'flex-start',
    }}>
      {!isMe && (
        <span style={{ fontSize: 11, color: roleColor[msg.senderRole] ?? '#6b7280', marginBottom: 2, fontWeight: 600 }}>
          {msg.senderName} · {msg.senderRole}
        </span>
      )}
      <div style={{
        maxWidth: '80%', padding: '8px 12px', borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        background: isMe ? '#2563eb' : '#f3f4f6',
        color: isMe ? '#fff' : '#111827',
        fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word',
      }}>
        {msg.content}
      </div>
      <span style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
        {formatTime(msg.sentAt)}
      </span>
    </div>
  );
};

export default Chat;
