import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { MessageInput } from './MessageInput';
import { useChatContext } from './ChatContext';

export function ChatLayout() {
  const {
    myId,
    conversations,
    messages,
    selectedUserId,
    selectedConversation,
    loading,
    sending,
    searchQuery,
    setSearchQuery,
    typingUsers,
    messagesEndRef,
    setSelectedUserId,
    sendMessage,
    broadcastMessage,
    sendTyping
  } = useChatContext();

  const handleSend = (content: string, isUrgent: boolean) => {
    sendMessage(content, isUrgent);
  };

  const handleBroadcast = (content: string) => {
    broadcastMessage(content);
  };

  const typingUserName = selectedUserId && typingUsers.has(selectedUserId) 
    ? typingUsers.get(selectedUserId) || null 
    : null;

  return (
    <div className="flex flex-1 h-full min-h-0 overflow-hidden bg-background">
      {/* Conversation List - Left Sidebar */}
      <div className="w-80 min-h-0 overflow-hidden border-r border-border flex flex-col bg-card">
        <ConversationList
          conversations={conversations}
          selectedUserId={selectedUserId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelect={setSelectedUserId}
          loading={loading}
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
        {selectedConversation ? (
          <>
            <ChatWindow
              messages={messages}
              selectedConversation={selectedConversation}
              myId={myId}
              typingUserName={typingUserName}
              messagesEndRef={messagesEndRef}
            />
            <MessageInput
              onSend={handleSend}
              onBroadcast={handleBroadcast}
              onTyping={sendTyping}
              sending={sending}
            />
          </>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-background"
    >
      <div className="w-24 h-24 rounded-full bg-card flex items-center justify-center mb-6 border border-border">
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">Bienvenue dans les messages</h3>
      <p className="text-sm text-muted-foreground">Sélectionnez une conversation pour commencer</p>
    </motion.div>
  );
}
