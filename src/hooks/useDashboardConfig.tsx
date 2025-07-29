import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LocationDashboardConfig, DashboardWidget, DashboardLayout, DashboardTheme } from '@/types/dashboard';
import { useSimpleAuth } from '@/context/SimpleAuthContext';

/**
 * Hook for managing dashboard configurations with lazy loading
 */
export const useDashboardConfig = (locationId: string | null) => {
  const { user } = useSimpleAuth();
  const queryClient = useQueryClient();

  // Query for dashboard configuration
  const {
    data: dashboardConfig,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['dashboard-config', locationId],
    queryFn: async (): Promise<LocationDashboardConfig | null> => {
      if (!locationId) return null;

      const { data, error } = await supabase
        .from('location_dashboard_configs')
        .select('*')
        .eq('location_id', locationId)
        .maybeSingle();

      if (error) throw error;
      
      // Return default config if none exists
      if (!data) {
        return createDefaultConfig(locationId);
      }

      return {
        ...data,
        widgets: (data.widgets as any) || [],
        layout: (data.layout as any) || createDefaultLayout(),
        theme: (data.theme as any) || createDefaultTheme(),
      };
    },
    enabled: !!locationId && !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation for saving dashboard configuration
  const saveDashboardConfigMutation = useMutation({
    mutationFn: async (config: Partial<LocationDashboardConfig>) => {
      if (!locationId || !user?.id) throw new Error('Missing location or user');

      const { data, error } = await supabase
        .from('location_dashboard_configs')
        .upsert([{
          location_id: locationId,
          widgets: config.widgets as any || [],
          layout: config.layout as any || createDefaultLayout(),
          theme: config.theme as any || createDefaultTheme(),
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-config', locationId] });
    },
  });

  // Mutation for updating widgets
  const updateWidgetsMutation = useMutation({
    mutationFn: async (widgets: DashboardWidget[]) => {
      if (!locationId) throw new Error('No location selected');

      const { data, error } = await supabase
        .from('location_dashboard_configs')
        .update({ widgets: widgets as any })
        .eq('location_id', locationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-config', locationId] });
    },
  });

  // Mutation for updating layout
  const updateLayoutMutation = useMutation({
    mutationFn: async (layout: DashboardLayout) => {
      if (!locationId) throw new Error('No location selected');

      const { data, error } = await supabase
        .from('location_dashboard_configs')
        .update({ layout: layout as any })
        .eq('location_id', locationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-config', locationId] });
    },
  });

  // Mutation for updating theme
  const updateThemeMutation = useMutation({
    mutationFn: async (theme: DashboardTheme) => {
      if (!locationId) throw new Error('No location selected');

      const { data, error } = await supabase
        .from('location_dashboard_configs')
        .update({ theme: theme as any })
        .eq('location_id', locationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-config', locationId] });
    },
  });

  return {
    dashboardConfig,
    isLoading,
    error,
    refetch,
    saveDashboardConfig: saveDashboardConfigMutation.mutateAsync,
    updateWidgets: updateWidgetsMutation.mutateAsync,
    updateLayout: updateLayoutMutation.mutateAsync,
    updateTheme: updateThemeMutation.mutateAsync,
    isSaving: saveDashboardConfigMutation.isPending || 
              updateWidgetsMutation.isPending || 
              updateLayoutMutation.isPending || 
              updateThemeMutation.isPending,
  };
};

/**
 * Hook for fetching dashboard data based on widgets
 */
export const useDashboardData = (widgets: DashboardWidget[], locationId: string | null) => {
  return useQuery({
    queryKey: ['dashboard-data', locationId, widgets.map(w => w.id).join(',')],
    queryFn: async () => {
      if (!locationId || !widgets.length) return {};

      const dataPromises = widgets.map(async (widget) => {
        try {
          let data;
          
          switch (widget.data_source) {
            case 'cash_closures':
              const { data: cashData } = await supabase
                .from('cash_closures')
                .select('*')
                .eq('location', locationId)
                .limit(widget.config.limit || 10);
              data = cashData;
              break;
              
            case 'monthly_inventories':
              const { data: inventoryData } = await supabase
                .from('monthly_inventories')
                .select('*')
                .eq('location', locationId)
                .limit(widget.config.limit || 10);
              data = inventoryData;
              break;
              
            case 'equipment':
              const { data: equipmentData } = await supabase
                .from('equipment')
                .select('*')
                .eq('location', locationId)
                .limit(widget.config.limit || 10);
              data = equipmentData;
              break;
              
            default:
              data = [];
          }
          
          return { [widget.id]: data };
        } catch (error) {
          console.error(`Error fetching data for widget ${widget.id}:`, error);
          return { [widget.id]: [] };
        }
      });

      const results = await Promise.all(dataPromises);
      return results.reduce((acc, result) => ({ ...acc, ...result }), {});
    },
    enabled: !!locationId && widgets.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Helper functions
const createDefaultConfig = (locationId: string): LocationDashboardConfig => ({
  id: '',
  location_id: locationId,
  widgets: createDefaultWidgets(),
  layout: createDefaultLayout(),
  theme: createDefaultTheme(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: '',
});

const createDefaultWidgets = (): DashboardWidget[] => [
  {
    id: 'cash-overview',
    type: 'metric',
    title: 'Cash Overview',
    data_source: 'cash_closures',
    config: { limit: 1, metric: 'closing_amount' },
    position: { x: 0, y: 0, width: 2, height: 1 },
    is_visible: true,
  },
  {
    id: 'inventory-status',
    type: 'chart',
    title: 'Inventory Status',
    data_source: 'monthly_inventories',
    config: { limit: 5, chart_type: 'bar' },
    position: { x: 2, y: 0, width: 2, height: 2 },
    is_visible: true,
  },
  {
    id: 'equipment-list',
    type: 'list',
    title: 'Equipment',
    data_source: 'equipment',
    config: { limit: 5 },
    position: { x: 0, y: 1, width: 2, height: 2 },
    is_visible: true,
  },
];

const createDefaultLayout = (): DashboardLayout => ({
  columns: 4,
  rows: 6,
  grid_gap: 16,
  responsive_breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1280,
  },
});

const createDefaultTheme = (): DashboardTheme => ({
  primary_color: 'hsl(var(--primary))',
  secondary_color: 'hsl(var(--secondary))',
  background_color: 'hsl(var(--background))',
  text_color: 'hsl(var(--foreground))',
  accent_color: 'hsl(var(--accent))',
  font_family: 'var(--font-sans)',
  border_radius: 8,
  shadow_style: 'var(--shadow)',
});