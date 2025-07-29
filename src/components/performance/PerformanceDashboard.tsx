import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Download, Trash2, Settings } from 'lucide-react';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { PerformanceStats, PerformanceAlert } from '@/types/performance';

export const PerformanceDashboard: React.FC = () => {
  const {
    getAllStats,
    getAlerts,
    acknowledgeAlert,
    clearAlerts,
    clearMetrics,
    exportMetrics,
    isHealthy,
    healthScore,
    config,
  } = usePerformanceMonitoring();

  const [activeTab, setActiveTab] = useState('overview');
  const stats = getAllStats();
  const alerts = getAlerts();
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);

  const handleExportMetrics = () => {
    const data = exportMetrics();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            {isHealthy ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {healthScore}%
            </div>
            <Progress value={healthScore} className="w-full" />
            <p className="text-xs text-muted-foreground mt-2">
              {isHealthy ? 'All systems operational' : 'Performance issues detected'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {unacknowledgedAlerts.length}
            </div>
            <div className="flex gap-1">
              {['critical', 'error', 'warning'].map(severity => {
                const count = unacknowledgedAlerts.filter(a => a.severity === severity).length;
                return (
                  <Badge 
                    key={severity}
                    variant={severity === 'critical' ? 'destructive' : severity === 'error' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {count} {severity}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metrics Tracked</CardTitle>
            <Settings className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {stats.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Sampling: {(config.samplingRate * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportMetrics}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={clearMetrics}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <PerformanceOverview stats={stats} />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <PerformanceMetrics stats={stats} />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <PerformanceAlerts 
            alerts={alerts} 
            onAcknowledge={acknowledgeAlert}
            onClearAll={clearAlerts}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Sub-components
const PerformanceOverview: React.FC<{ stats: PerformanceStats[] }> = ({ stats }) => {
  const keyMetrics = stats.filter(s => 
    ['location_switch_time', 'query_time', 'data_load_time', 'realtime_latency'].includes(s.metric)
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {keyMetrics.map((stat) => (
        <Card key={stat.metric}>
          <CardHeader>
            <CardTitle className="text-base">
              {stat.metric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Average:</span>
                <span className="font-medium">{stat.avg.toFixed(2)}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">P95:</span>
                <span className="font-medium">{stat.p95.toFixed(2)}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last:</span>
                <span className="font-medium">{stat.lastValue.toFixed(2)}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Trend:</span>
                <Badge 
                  variant={
                    stat.trend === 'improving' ? 'default' : 
                    stat.trend === 'degrading' ? 'destructive' : 'secondary'
                  }
                >
                  {stat.trend}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const PerformanceMetrics: React.FC<{ stats: PerformanceStats[] }> = ({ stats }) => {
  return (
    <div className="space-y-4">
      {stats.map((stat) => (
        <Card key={stat.metric}>
          <CardHeader>
            <CardTitle className="text-base">
              {stat.metric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Count</div>
                <div className="font-medium">{stat.count}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Average</div>
                <div className="font-medium">{stat.avg.toFixed(2)}ms</div>
              </div>
              <div>
                <div className="text-muted-foreground">Min / Max</div>
                <div className="font-medium">{stat.min.toFixed(1)} / {stat.max.toFixed(1)}ms</div>
              </div>
              <div>
                <div className="text-muted-foreground">P95 / P99</div>
                <div className="font-medium">{stat.p95.toFixed(1)} / {stat.p99.toFixed(1)}ms</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const PerformanceAlerts: React.FC<{
  alerts: PerformanceAlert[];
  onAcknowledge: (id: string) => void;
  onClearAll: () => void;
}> = ({ alerts, onAcknowledge, onClearAll }) => {
  const unacknowledged = alerts.filter(a => !a.acknowledged);
  const acknowledged = alerts.filter(a => a.acknowledged);

  return (
    <div className="space-y-4">
      {unacknowledged.length > 0 && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Active Alerts ({unacknowledged.length})</h3>
          <Button variant="outline" size="sm" onClick={onClearAll}>
            Clear All
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {unacknowledged.map((alert) => (
          <Card key={alert.id} className="border-l-4 border-l-red-500">
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        alert.severity === 'critical' ? 'destructive' :
                        alert.severity === 'error' ? 'secondary' : 'outline'
                      }
                    >
                      {alert.severity}
                    </Badge>
                    <span className="font-medium">{alert.metric}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {alert.value.toFixed(2)}ms exceeded threshold of {alert.threshold}ms
                  </div>
                  {alert.location && (
                    <div className="text-xs text-muted-foreground">
                      Location: {alert.location}
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onAcknowledge(alert.id)}
                >
                  Acknowledge
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {acknowledged.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Acknowledged ({acknowledged.length})</h3>
          <div className="space-y-2">
            {acknowledged.slice(-5).map((alert) => (
              <Card key={alert.id} className="opacity-60">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{alert.severity}</Badge>
                    <span className="text-sm">{alert.metric}</span>
                    <span className="text-xs text-muted-foreground">
                      {alert.value.toFixed(2)}ms &gt; {alert.threshold}ms
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};