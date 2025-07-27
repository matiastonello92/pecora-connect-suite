import React, { useEffect } from 'react';
import { usePrivateMessageNotifications } from '@/hooks/usePrivateMessageNotifications';
import { useMobileNotifications } from '@/hooks/useMobileNotifications';
import { reminderService } from '@/services/reminderService';
import { useSimpleAuth } from '@/context/SimpleAuthContext';

export const NotificationHandler: React.FC = () => {
  const { user } = useSimpleAuth();
  
  // Use the new private message notification hook
  usePrivateMessageNotifications();
  
  // Use mobile notifications hook for Capacitor support
  useMobileNotifications();

  // Start reminder service when user is authenticated
  useEffect(() => {
    if (user) {
      reminderService.start();
    } else {
      reminderService.stop();
    }

    return () => {
      reminderService.stop();
    };
  }, [user]);

  return null; // This component doesn't render anything
};