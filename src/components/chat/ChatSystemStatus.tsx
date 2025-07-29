import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, RefreshCw, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { toast } from '@/hooks/use-toast';

interface HealthCheck {
  check_name: string;
  status: string;
  details: string;
  user_count?: number;
}

export const ChatSystemStatus: React.FC = () => {
  const { profile } = useSimpleAuth();
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(false);

  const runHealthCheck = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('validate_chat_system_health');
      
      if (error) {
        console.error('Health check error:', error);
        toast({
          title: "Health Check Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setHealthChecks(data || []);
      
      const failedChecks = (data || []).filter(check => check.status === 'FAIL');
      if (failedChecks.length > 0) {
        toast({
          title: "System Issues Detected",
          description: `${failedChecks.length} issues found. Check details below.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "System Healthy",
          description: "All chat system checks passed!",
        });
      }
    } catch (error) {
      console.error('Health check exception:', error);
      toast({
        title: "Health Check Error",
        description: "Failed to run system health check",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const syncCurrentUser = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('sync_user_chat_memberships', {
        target_user_id: profile.user_id
      });
      
      if (error) {
        console.error('Sync error:', error);
        toast({
          title: "Sync Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('Sync result:', data);
      toast({
        title: "User Synced",
        description: "Successfully synced to location chats",
      });
      
      // Refresh health check
      await runHealthCheck();
    } catch (error) {
      console.error('Sync exception:', error);
      toast({
        title: "Sync Error",
        description: "Failed to sync user to chats",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAIL':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Settings className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS':
        return <Badge variant="default" className="bg-green-100 text-green-800">PASS</Badge>;
      case 'FAIL':
        return <Badge variant="destructive">FAIL</Badge>;
      default:
        return <Badge variant="secondary">INFO</Badge>;
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Chat System Status</span>
          <div className="flex gap-2">
            <Button 
              onClick={syncCurrentUser} 
              disabled={loading}
              size="sm"
              variant="outline"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Sync User"}
            </Button>
            <Button 
              onClick={runHealthCheck} 
              disabled={loading}
              size="sm"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Run Health Check"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {profile && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="text-sm">
              <div><strong>User:</strong> {profile.firstName} {profile.lastName} ({profile.email})</div>
              <div><strong>Locations:</strong> {(profile.locations || []).join(', ') || 'None'}</div>
              <div><strong>Role:</strong> {profile.role} | <strong>Access Level:</strong> {profile.accessLevel}</div>
            </div>
          </div>
        )}
        
        {healthChecks.length > 0 && (
          <div className="space-y-2">
            {healthChecks.map((check, index) => (
              <div 
                key={index}
                className="flex items-start justify-between p-3 border rounded-lg"
              >
                <div className="flex items-start space-x-2 flex-1">
                  {getStatusIcon(check.status)}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{check.check_name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {check.details}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {check.user_count !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      {check.user_count}
                    </Badge>
                  )}
                  {getStatusBadge(check.status)}
                </div>
              </div>
            ))}
          </div>
        )}

        {healthChecks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Click "Run Health Check" to validate the chat system
          </div>
        )}
      </CardContent>
    </Card>
  );
};