import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import type { Conversation } from '../../types/chat';
import { useMemo } from 'react';

interface ConversationListProps {
  conversations?: Conversation[];
  selectedUserId: number | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelect: (id: number) => void;
  loading: boolean;
}

function formatTime(isoStr: string): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
}

function getInitials(name: string) {
  return name.substring(0, 2).toUpperCase();
}

const roleGradients: Record<string, string> = {
  admin: 'from-violet-500 to-purple-700',
  qualite: 'from-amber-500 to-orange-600',
  agent: 'from-blue-500 to-cyan-600',
};

export function ConversationList({
  conversations,
  selectedUserId,
  searchQuery,
  onSearchChange,
  onSelect,
  loading,
}: ConversationListProps) {
  return (
    <div className="w-80 flex-shrink-0 h-full min-h-0 bg-card border-r border-border flex flex-col overflow-hidden">
      <div className="p-4 shrink-0">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2 space-y-0.5 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {(conversations || []).map((conv) => (
            <motion.button
              key={conv.user_id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              onClick={() => onSelect(conv.user_id)}
              className={`w-full p-4 flex items-center gap-3 text-left rounded-xl transition-all duration-200 relative group mb-1 ${
                selectedUserId === conv.user_id
                  ? 'bg-primary shadow-lg'
                  : 'hover:bg-muted transition-colors'
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold bg-muted text-foreground">
                  {getInitials(conv.user_name)}
                </div>
                {conv.is_online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-card" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col mb-0.5">
                  <span className={`font-bold text-[15px] truncate ${selectedUserId === conv.user_id ? 'text-white' : 'text-foreground'}`}>
                    {conv.user_name}
                  </span>
                </div>
                <p className={`text-[13px] truncate ${selectedUserId === conv.user_id ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {conv.last_message || 'Aucun message'}
                </p>
                <p className={`text-[11px] mt-0.5 font-bold ${selectedUserId === conv.user_id ? 'text-white/60' : 'text-muted-foreground/60'}`}>
                  {formatTime(conv.last_message_time) || 'Invalid Date'}
                </p>
              </div>

              {conv.unread_count > 0 && selectedUserId !== conv.user_id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 min-w-[18px] h-[18px] bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30"
                >
                  <span className="text-[9px] font-bold text-white px-1">{conv.unread_count}</span>
                </motion.div>
              )}
            </motion.button>
          ))}

          {!loading && (conversations || []).length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Search className="w-8 h-8 mb-3 opacity-40" />
              <p className="text-xs font-medium">Aucune conversation</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}