import { useState, useEffect, useRef, useCallback } from 'react';
import type { Conversation, Message, WsMessage } from '../types/chat';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const WS_BASE = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
const WS_URL = `${WS_BASE}/ws/messages`;
const WS_MAX_RETRIES = 5;
const WS_RETRY_DELAY = 3000;

export function useChat() {
  const { user: currentUser } = useAuth();
  const myId = currentUser?.id != null ? Number(currentUser.id) : null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState<Map<number, string>>(new Map());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedUserRef = useRef<number | null>(null);

  const wsRetryCount = useRef(0);
  const wsEnabled = useRef(true);

  const loadConversations = useCallback(async () => {
    try {
      const data = await api.getConversations();
      setConversations(prev => {
        const merged = data.map(c => ({
          ...c,
          is_online: prev.find(p => p.user_id === c.user_id)?.is_online ?? c.is_online ?? false,
        }));
        return merged;
      });
    } catch {
      if (conversations.length === 0) {
        setConversations([
          { user_id: 1, user_name: 'Superviseur', user_role: 'admin', last_message: 'Sélectionnez une conversation', last_message_time: new Date().toISOString(), unread_count: 0, is_online: true },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (uid: number) => {
    try {
      const data = await api.getMessages(uid);
      setMessages(data);
    } catch {
      setMessages([]);
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket
  useEffect(() => {
    if (myId == null) return;

    let closed = false;

    const connectWs = () => {
      if (closed || !wsEnabled.current) return;
      try {
        const ws = new WebSocket(`${WS_URL}/${myId}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const parsed: WsMessage = JSON.parse(event.data);
            switch (parsed.type) {
              case 'new_message': {
                const msg = parsed.data as Message;
                if (
                  (msg.sender_id === myId && msg.receiver_id === selectedUserRef.current) ||
                  (msg.receiver_id === myId && msg.sender_id === selectedUserRef.current) ||
                  (msg.receiver_id === myId && msg.sender_id !== selectedUserRef.current)
                ) {
                  if (msg.sender_id === selectedUserRef.current || msg.receiver_id === selectedUserRef.current) {
                    setMessages(prev => [...prev, msg]);
                  }
                  if (msg.receiver_id === myId && msg.sender_id !== selectedUserRef.current) {
                    toast(`${msg.sender_name}: ${msg.content.substring(0, 50)}...`, { icon: '💬' });
                  }
                }
                loadConversations();
                break;
              }
              case 'typing': {
                const { user_id, user_name, is_typing } = parsed.data;
                setTypingUsers(prev => {
                  const next = new Map(prev);
                  if (is_typing) next.set(user_id, user_name);
                  else next.delete(user_id);
                  return next;
                });
                break;
              }
              case 'user_online':
              case 'user_offline': {
                const { user_id } = parsed.data;
                setConversations(prev =>
                  prev.map(c => c.user_id === user_id ? { ...c, is_online: parsed.type === 'user_online' } : c)
                );
                break;
              }
            }
          } catch {}
        };

        ws.onopen = () => {
          wsRetryCount.current = 0;
        };

        ws.onclose = () => {
          if (closed) return;
          if (wsRetryCount.current < WS_MAX_RETRIES) {
            wsRetryCount.current++;
            setTimeout(connectWs, WS_RETRY_DELAY);
          } else {
            wsEnabled.current = false;
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        wsEnabled.current = false;
      }
    };

    connectWs();
    return () => { closed = true; wsRef.current?.close(); };
  }, [myId, loadConversations]);

  // Initial load
  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  // Load messages on selection
  useEffect(() => {
    selectedUserRef.current = selectedUserId;
    if (selectedUserId) loadMessages(selectedUserId);
  }, [selectedUserId, loadMessages]);

  const wsSend = useCallback((data: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !wsEnabled.current) return;
    ws.send(data);
  }, []);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (!selectedUserRef.current || !myId) return;

    if (isTyping) {
      wsSend(JSON.stringify({
        type: 'typing',
        data: { user_id: myId, user_name: currentUser?.name || currentUser?.username, is_typing: true, target_id: selectedUserRef.current }
      }));
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        wsSend(JSON.stringify({
          type: 'typing',
          data: { user_id: myId, is_typing: false, target_id: selectedUserRef.current }
        }));
      }, 2000);
    }
  }, [myId, currentUser, wsSend]);

  const sendMessage = useCallback(async (content: string, isUrgent: boolean = false) => {
    if (!content.trim() || !selectedUserId || sending) return;
    setSending(true);
    try {
      const msg = await api.sendMessage(selectedUserId, content, isUrgent);
      setMessages(prev => [...prev, msg]);
      sendTyping(false);
      return msg;
    } catch {
      const mockMsg: Message = {
        id: Date.now(),
        sender_id: myId || 0,
        sender_name: currentUser?.username || 'Moi',
        receiver_id: selectedUserId,
        receiver_name: conversations.find(c => c.user_id === selectedUserId)?.user_name || '',
        content,
        is_read: false,
        is_urgent: isUrgent,
        is_broadcast: false,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, mockMsg]);
      return mockMsg;
    } finally {
      setSending(false);
    }
  }, [selectedUserId, sending, myId, currentUser, conversations, sendTyping]);

  const broadcastMessage = useCallback(async (content: string) => {
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      for (const conv of conversations) {
        await api.sendMessage(conv.user_id, `📢 [Diffusion] ${content}`, false);
      }
      toast.success('Message diffusé à tous');
    } catch {
      toast.error('Échec de la diffusion');
    } finally {
      setSending(false);
    }
  }, [conversations, sending]);

  const markAsRead = useCallback(async (messageId: number) => {
    try {
      await api.markMessageAsRead(messageId);
    } catch {}
  }, []);

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = c.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.last_message.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Restriction pour les agents : ils ne voient que les admins et le service qualité
    if (currentUser?.role === 'agent') {
      return matchesSearch && (c.user_role === 'admin' || c.user_role === 'qualite');
    }
    
    return matchesSearch;
  });

  return {
    myId,
    conversations: filteredConversations,
    allConversations: conversations,
    messages,
    selectedUserId,
    selectedConversation: conversations.find(c => c.user_id === selectedUserId) || null,
    loading,
    sending,
    searchQuery,
    setSearchQuery,
    typingUsers,
    messagesEndRef,
    setSelectedUserId,
    sendMessage,
    broadcastMessage,
    markAsRead,
    sendTyping,
    loadConversations,
  };
}