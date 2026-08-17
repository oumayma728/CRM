import React, { createContext, useContext, ReactNode } from 'react';
import { useChat as useChatHook } from '../../hooks/useChat';

export type ChatContextType = ReturnType<typeof useChatHook>;

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const chatState = useChatHook();
  return (
    <ChatContext.Provider value={chatState}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}
