import React from 'react';
import { Toaster } from 'sonner';
import { ChatProvider } from '../../components/chat/ChatContext';
import { ChatLayout } from '../../components/chat/ChatLayout';

function MessagesContent() {
  return (
    <div className="min-h-0 flex-1 flex flex-col bg-background">
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
      />
    </ChatProvider>
  );
}