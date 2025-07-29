export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'list' | 'calendar' | 'announcement';
  title: string;
  data_source?: string;
  config: Record<string, any>;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  is_visible: boolean;
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  grid_gap: number;
  responsive_breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

export interface DashboardTheme {
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  accent_color: string;
  font_family: string;
  border_radius: number;
  shadow_style: string;
}

export interface LocationDashboardConfig {
  id: string;
  location_id: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  theme: DashboardTheme;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface DashboardData {
  [key: string]: any; // Dynamic data based on widget type and data source
}