import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WebSocketConnectionPool } from '@/utils/WebSocketConnectionPool';

interface RealtimeSubscription {
  id: string;
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  callback: (payload: any) => void;
}

interface RealtimeSubscriptionContextType {
  subscribe: (subscription: RealtimeSubscription) => string;
  unsubscribe: (id: string) => void;
  getActiveSubscriptions: () => RealtimeSubscription[];
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  subscriptionCount: number;
}

const RealtimeSubscriptionContext = createContext<RealtimeSubscriptionContextType | undefined>(undefined);

export const useRealtimeSubscription = () => {
  const context = useContext(RealtimeSubscriptionContext);
  if (!context) {
    throw new Error('useRealtimeSubscription must be used within RealtimeSubscriptionProvider');
  }
  return context;
};

interface RealtimeSubscriptionProviderProps {
  children: React.ReactNode;
}

export const RealtimeSubscriptionProvider: React.FC<RealtimeSubscriptionProviderProps> = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState<Map<string, RealtimeSubscription>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');
  const channelRef = useRef<any>(null);
  const wsPool = useRef<WebSocketConnectionPool>(WebSocketConnectionPool.getInstance());
  const subscriptionCounter = useRef(0);

  // Initialize Supabase realtime connection
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        setConnectionStatus('connecting');
        
        // Create a single shared channel for all subscriptions
        channelRef.current = supabase
          .channel('shared-realtime-channel')
          .on('broadcast', { event: 'subscription_data' }, (payload) => {
            handleRealtimeMessage(payload);
          })
          .subscribe((status) => {
            console.log('Supabase realtime status:', status);
            setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
          });

      } catch (error) {
        console.error('Failed to initialize realtime connection:', error);
        setConnectionStatus('error');
      }
    };

    initializeConnection();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Handle incoming realtime messages
  const handleRealtimeMessage = useCallback((payload: any) => {
    const { table, event, data, old_record } = payload;
    
    // Route message to appropriate subscribers
    subscriptions.forEach((subscription) => {
      if (subscription.table === table && (subscription.event === '*' || subscription.event === event)) {
        // Apply filter if specified
        if (subscription.filter) {
          // Simple filter implementation - can be enhanced
          const filterParts = subscription.filter.split('=');
          if (filterParts.length === 2) {
            const [field, value] = filterParts.map(p => p.trim());
            if (data[field] !== value) {
              return; // Skip this subscription
            }
          }
        }

        try {
          subscription.callback({
            eventType: event,
            new: data,
            old: old_record,
            table: table
          });
        } catch (error) {
          console.error(`Error in subscription callback ${subscription.id}:`, error);
        }
      }
    });
  }, [subscriptions]);

  // Subscribe to realtime events
  const subscribe = useCallback((subscription: RealtimeSubscription) => {
    const id = subscription.id || `sub_${++subscriptionCounter.current}`;
    
    setSubscriptions(prev => new Map(prev.set(id, { ...subscription, id })));

    // Add database-level subscription
    if (channelRef.current && connectionStatus === 'connected') {
      channelRef.current.on(
        'postgres_changes',
        {
          event: subscription.event,
          schema: 'public',
          table: subscription.table,
          filter: subscription.filter
        },
        (payload: any) => {
          subscription.callback(payload);
        }
      );
    }

    console.log(`Subscribed to ${subscription.table}:${subscription.event} with ID ${id}`);
    return id;
  }, [connectionStatus]);

  // Unsubscribe from realtime events
  const unsubscribe = useCallback((id: string) => {
    const subscription = subscriptions.get(id);
    if (subscription) {
      setSubscriptions(prev => {
        const newSubs = new Map(prev);
        newSubs.delete(id);
        return newSubs;
      });

      console.log(`Unsubscribed from ${id}`);
    }
  }, [subscriptions]);

  // Get active subscriptions
  const getActiveSubscriptions = useCallback(() => {
    return Array.from(subscriptions.values());
  }, [subscriptions]);

  // Re-establish subscriptions when connection is restored
  useEffect(() => {
    if (connectionStatus === 'connected' && channelRef.current) {
      // Re-subscribe all active subscriptions
      subscriptions.forEach((subscription) => {
        channelRef.current?.on(
          'postgres_changes',
          {
            event: subscription.event,
            schema: 'public',
            table: subscription.table,
            filter: subscription.filter
          },
          (payload: any) => {
            subscription.callback(payload);
          }
        );
      });
    }
  }, [connectionStatus, subscriptions]);

  const value: RealtimeSubscriptionContextType = {
    subscribe,
    unsubscribe,
    getActiveSubscriptions,
    connectionStatus,
    subscriptionCount: subscriptions.size
  };

  return (
    <RealtimeSubscriptionContext.Provider value={value}>
      {children}
    </RealtimeSubscriptionContext.Provider>
  );
};