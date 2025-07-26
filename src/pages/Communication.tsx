import React from 'react';
import { ChatDashboard } from '@/components/chat/ChatDashboard';
import { ChatProvider } from '@/context/ChatContext';

export const Communication = () => {
  return (
    <div className="h-full">
      <ChatProvider>
        <ChatDashboard />
      </ChatProvider>
    </div>
  );
};