import React from 'react';
import { usePrivateMessageNotifications } from '@/hooks/usePrivateMessageNotifications';
import { useMobileNotifications } from '@/hooks/useMobileNotifications';

export const NotificationHandler: React.FC = () => {
  // Use the new private message notification hook
  usePrivateMessageNotifications();
  
  // Use mobile notifications hook for Capacitor support
  useMobileNotifications();

  return null; // This component doesn't render anything
};