import React from 'react';
import { ChatDashboard } from '@/components/chat/ChatDashboard';
import { ChatProvider } from '@/context/ChatContext';
import { useChatNotifications } from '@/hooks/useChatNotifications';

const CommunicationContent = () => {
  useChatNotifications(); // Integrate notification handling
  return <ChatDashboard />;
};

export const Communication = () => {
  return (
    <div className="h-full">
      <ChatProvider>
        <CommunicationContent />
      </ChatProvider>
    </div>
  );
};