import React, { useState, useEffect } from 'react';
import { useEnhancedAuth } from '@/providers/EnhancedAuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, X, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  location: string;
  created_at: string;
  read_at?: string;
}

export const NotificationCenter: React.FC = () => {
  const { profile } = useEnhancedAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications on mount
  useEffect(() => {
    if (profile) {
      loadNotifications();
      
      // Set up real-time subscription
      const subscription = supabase
        .channel('notifications')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${profile.user_id}`
          }, 
          () => {
            loadNotifications();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [profile]);

  const loadNotifications = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString() 
        })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'inventory_reminder':
      case 'inventory_due':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'inventory_completed':
      case 'inventory_approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'task_assigned':
      case 'maintenance_assigned':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs px-2 py-1">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b hover:bg-muted/50 focus:bg-muted/50 active:bg-muted/50 transition-colors ${
                    !notification.read ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {notification.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(notification.created_at)}
                        </div>
                      </div>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="h-6 w-6 p-0 shrink-0"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// Hook for notifications count
export const useNotificationCount = () => {
  const { profile } = useEnhancedAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile) return;

    const loadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.user_id)
          .eq('read', false);

        if (error) throw error;
        setUnreadCount(count || 0);
      } catch (error) {
        console.error('Error loading notification count:', error);
      }
    };

    loadCount();

    // Set up real-time subscription for count updates
    const subscription = supabase
      .channel('notification-count')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${profile.user_id}`
        }, 
        () => {
          loadCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [profile]);

  return unreadCount;
};