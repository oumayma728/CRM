import React from 'react';
import { Toaster } from 'sonner';
import { ChatProvider } from '../../components/chat/ChatContext';
import { ChatLayout } from '../../components/chat/ChatLayout';

function MessagesContent() {
  return (
    <div className="h-full flex flex-1 min-h-0 overflow-hidden bg-background">
      <ChatLayout />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <ChatProvider>
      <MessagesContent />
      <Toaster
        position="bottom-right"
        expand={false}
        richColors
        theme="dark"
      />
    </ChatProvider>
  );
}