import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, CheckCheck } from 'lucide-react';
import type { Message, Conversation } from '../../../types/chat';

interface ChatWindowProps {
  messages: Message[];
  selectedConversation: Conversation | null;
  myId: number | null;
  typingUserName: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

function formatTime(isoStr: string): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name: string) {
  return name.substring(0, 2).toUpperCase();
}

const getAvatarGradient = (name: string, id: number) => {
  const colors = [
    'from-blue-500 to-cyan-500',
    'from-violet-500 to-purple-600',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-green-600',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-blue-600',
  ];
  return colors[(id + name.length) % colors.length];
};

export function ChatWindow({
  messages,
  selectedConversation,
  myId,
  typingUserName,
  messagesEndRef,
}: ChatWindowProps) {
  if (!selectedConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background">
        <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mb-6 border border-border">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Bienvenue</h3>
        <p className="text-muted-foreground text-sm font-medium max-w-xs text-center leading-relaxed">
          Sélectionnez une conversation pour commencer
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-background z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold bg-muted text-foreground shadow-sm">
            {getInitials(selectedConversation.user_name)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-[17px] font-bold text-foreground">{selectedConversation.user_name}</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded uppercase tracking-wider">
                {selectedConversation.user_role === 'qualite' ? 'QUALITÉ' : selectedConversation.user_role === 'admin' ? 'ADMINISTRATEUR' : 'AGENT'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[12px] font-medium ${
                selectedConversation.is_online ? 'text-success' : 'text-muted-foreground'
              }`}>
                {selectedConversation.is_online ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-6 py-6 custom-scrollbar relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.03),transparent_70%)] pointer-events-none" />
        <div className="flex flex-col gap-6 min-h-full justify-end">
          <AnimatePresence>
            {messages.map((msg) => {
              const isMe = myId !== null && Number(msg.sender_id) === myId;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`group max-w-[70%] flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                      isMe
                        ? 'bg-muted border border-border'
                        : `bg-gradient-to-br ${getAvatarGradient(msg.sender_name, msg.sender_id)}`
                    }`}>
                      <span className={`text-[9px] font-black ${isMe ? 'text-muted-foreground' : 'text-white'}`}>
                        {getInitials(msg.sender_name)}
                      </span>
                    </div>
                    <div className={`relative px-4 py-3 rounded-2xl shadow-md transition-all group-hover:shadow-lg ${
                      isMe
                        ? 'bg-gradient-to-br from-primary to-indigo-600 text-primary-foreground rounded-tr-sm'
                        : 'bg-muted border border-border text-foreground rounded-tl-sm'
                    } ${msg.is_urgent ? 'ring-2 ring-destructive/30 border-destructive/20' : ''}`}>
                      {msg.is_urgent ? (
                        <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
                          <AlertCircle className="w-3 h-3" /> Urgent
                        </div>
                      ) : null}
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words font-medium">{msg.content}</p>
                      <div className={`flex items-center gap-1.5 mt-2 text-[10px] font-semibold opacity-60 ${
                        isMe ? 'text-primary-foreground' : 'text-muted-foreground'
                      }`}>
                        {formatTime(msg.created_at)}
                        {isMe && (
                          msg.is_read
                            ? <CheckCheck className="w-3 h-3" />
                            : <Check className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {typingUserName && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 ml-11"
            >
              <div className="px-4 py-2.5 rounded-2xl bg-muted border border-border rounded-tl-sm">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
