import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Plus, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useDashboardConfig, useDashboardData } from '@/hooks/useDashboardConfig';
import { useActiveLocations } from '@/hooks/useLocations';
import { DashboardWidget } from '@/types/dashboard';
import { toast } from 'sonner';

interface LocationDashboardProps {
  className?: string;
}

export const LocationDashboard: React.FC<LocationDashboardProps> = ({ className }) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  const { data: locations, isLoading: locationsLoading } = useActiveLocations();
  
  const {
    dashboardConfig,
    isLoading: configLoading,
    updateWidgets,
    updateLayout,
    updateTheme,
    isSaving,
  } = useDashboardConfig(selectedLocationId);

  const widgets = dashboardConfig?.widgets || [];
  const visibleWidgets = widgets.filter(w => w.is_visible);
  
  const { data: dashboardData, isLoading: dataLoading } = useDashboardData(
    visibleWidgets,
    selectedLocationId
  );

  // Apply theme styles
  const themeStyles = useMemo(() => {
    if (!dashboardConfig?.theme) return {};
    
    const theme = dashboardConfig.theme;
    return {
      '--dashboard-primary': theme.primary_color,
      '--dashboard-secondary': theme.secondary_color,
      '--dashboard-background': theme.background_color,
      '--dashboard-text': theme.text_color,
      '--dashboard-accent': theme.accent_color,
      '--dashboard-font': theme.font_family,
      '--dashboard-radius': `${theme.border_radius}px`,
    } as React.CSSProperties;
  }, [dashboardConfig?.theme]);

  // Grid layout calculations
  const gridLayout = useMemo(() => {
    if (!dashboardConfig?.layout) return {};
    
    const layout = dashboardConfig.layout;
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
      gridTemplateRows: `repeat(${layout.rows}, minmax(200px, auto))`,
      gap: `${layout.grid_gap}px`,
    } as React.CSSProperties;
  }, [dashboardConfig?.layout]);

  const handleToggleWidget = async (widgetId: string) => {
    try {
      const updatedWidgets = widgets.map(w => 
        w.id === widgetId ? { ...w, is_visible: !w.is_visible } : w
      );
      await updateWidgets(updatedWidgets);
      toast.success('Widget visibility updated');
    } catch (error) {
      toast.error('Failed to update widget');
    }
  };

  const handleRefreshData = () => {
    window.location.reload(); // Simple refresh for now
  };

  if (locationsLoading || !locations) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={themeStyles}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Select value={selectedLocationId || ''} onValueChange={setSelectedLocationId}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.code} value={location.code}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedLocationId && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshData}
              disabled={dataLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${dataLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(!editMode)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {editMode ? 'View' : 'Edit'}
            </Button>
          </div>
        )}
      </div>

      {/* Main Dashboard Content */}
      {!selectedLocationId ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Select a Location</h3>
              <p className="text-muted-foreground">
                Choose a location from the dropdown to view its dashboard
              </p>
            </div>
          </CardContent>
        </Card>
      ) : configLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <>
          {/* Edit Mode Widget Controls */}
          {editMode && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Widget Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {widgets.map((widget) => (
                    <Button
                      key={widget.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleWidget(widget.id)}
                      className="flex items-center gap-2"
                    >
                      {widget.is_visible ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                      {widget.title}
                      <Badge variant={widget.is_visible ? 'default' : 'secondary'}>
                        {widget.is_visible ? 'Visible' : 'Hidden'}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Widgets Grid */}
          <div style={gridLayout} className="min-h-[400px]">
            {visibleWidgets.map((widget) => (
              <DashboardWidgetRenderer
                key={widget.id}
                widget={widget}
                data={dashboardData?.[widget.id]}
                isLoading={dataLoading}
                style={{
                  gridColumn: `${widget.position.x + 1} / span ${widget.position.width}`,
                  gridRow: `${widget.position.y + 1} / span ${widget.position.height}`,
                }}
              />
            ))}
          </div>

          {/* Empty State */}
          {visibleWidgets.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">No Widgets Available</h3>
                  <p className="text-muted-foreground mb-4">
                    Enable widgets in edit mode to see dashboard data
                  </p>
                  <Button onClick={() => setEditMode(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Configure Widgets
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

// Widget Renderer Component
interface DashboardWidgetRendererProps {
  widget: DashboardWidget;
  data: any;
  isLoading: boolean;
  style?: React.CSSProperties;
}

const DashboardWidgetRenderer: React.FC<DashboardWidgetRendererProps> = ({
  widget,
  data,
  isLoading,
  style,
}) => {
  if (isLoading) {
    return (
      <Card style={style}>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const renderWidgetContent = () => {
    switch (widget.type) {
      case 'metric':
        const metricValue = data?.[0]?.[widget.config.metric] || 0;
        return (
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {typeof metricValue === 'number' ? metricValue.toLocaleString() : metricValue}
            </div>
            <p className="text-sm text-muted-foreground">
              {widget.config.metric?.replace('_', ' ').toUpperCase()}
            </p>
          </div>
        );

      case 'list':
        return (
          <div className="space-y-2">
            {data?.slice(0, widget.config.limit || 5).map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center py-1 border-b">
                <span className="text-sm truncate">{item.name || item.title || `Item ${index + 1}`}</span>
                <Badge variant="outline" className="text-xs">
                  {item.status || 'N/A'}
                </Badge>
              </div>
            ))}
            {(!data || data.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No data available
              </p>
            )}
          </div>
        );

      case 'chart':
        return (
          <div className="h-32 flex items-center justify-center bg-muted rounded">
            <p className="text-sm text-muted-foreground">
              Chart visualization (requires charting library)
            </p>
          </div>
        );

      case 'table':
        const tableData = data?.slice(0, widget.config.limit || 5) || [];
        const headers = tableData.length > 0 ? Object.keys(tableData[0]).slice(0, 3) : [];
        
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {headers.map((header) => (
                    <th key={header} className="text-left py-1 px-2 font-medium">
                      {header.replace('_', ' ').toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row: any, index: number) => (
                  <tr key={index} className="border-b">
                    {headers.map((header) => (
                      <td key={header} className="py-1 px-2 truncate">
                        {row[header] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {tableData.length === 0 && (
              <p className="text-center py-4 text-muted-foreground">No data</p>
            )}
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-24">
            <p className="text-sm text-muted-foreground">
              Widget type: {widget.type}
            </p>
          </div>
        );
    }
  };

  return (
    <Card style={style} className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {renderWidgetContent()}
      </CardContent>
    </Card>
  );
};