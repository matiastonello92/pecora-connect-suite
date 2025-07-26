export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      cash_closures: {
        Row: {
          cash_collected: number | null
          closing_amount: number | null
          created_at: string | null
          date: string
          expenses: number | null
          id: string
          lightspeed_payments: number | null
          location: string
          notes: string | null
          opening_amount: number | null
          status: string | null
          total_sales: number | null
          updated_at: string | null
          user_id: string
          variance: number | null
        }
        Insert: {
          cash_collected?: number | null
          closing_amount?: number | null
          created_at?: string | null
          date: string
          expenses?: number | null
          id?: string
          lightspeed_payments?: number | null
          location: string
          notes?: string | null
          opening_amount?: number | null
          status?: string | null
          total_sales?: number | null
          updated_at?: string | null
          user_id: string
          variance?: number | null
        }
        Update: {
          cash_collected?: number | null
          closing_amount?: number | null
          created_at?: string | null
          date?: string
          expenses?: number | null
          id?: string
          lightspeed_payments?: number | null
          location?: string
          notes?: string | null
          opening_amount?: number | null
          status?: string | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string
          variance?: number | null
        }
        Relationships: []
      }
      checklist_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_critical: boolean | null
          order_index: number | null
          template_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_critical?: boolean | null
          order_index?: number | null
          template_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_critical?: boolean | null
          order_index?: number | null
          template_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          location: string
          started_at: string | null
          status: string | null
          template_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          location: string
          started_at?: string | null
          status?: string | null
          template_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          location?: string
          started_at?: string | null
          status?: string | null
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          department: string
          description: string | null
          id: string
          location: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          department: string
          description?: string | null
          id?: string
          location: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          department?: string
          description?: string | null
          id?: string
          location?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      equipment: {
        Row: {
          category: string
          created_at: string | null
          department: string
          id: string
          last_maintenance: string | null
          location: string
          manual_url: string | null
          model: string | null
          name: string
          next_maintenance: string | null
          notes: string | null
          purchase_date: string | null
          serial_number: string | null
          status: string | null
          updated_at: string | null
          warranty_expiry: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          department: string
          id?: string
          last_maintenance?: string | null
          location: string
          manual_url?: string | null
          model?: string | null
          name: string
          next_maintenance?: string | null
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          department?: string
          id?: string
          last_maintenance?: string | null
          location?: string
          manual_url?: string | null
          model?: string | null
          name?: string
          next_maintenance?: string | null
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Relationships: []
      }
      kitchen_products: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_favorite: boolean | null
          location: string
          name_key: string
          unit: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          location: string
          name_key: string
          unit?: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          location?: string
          name_key?: string
          unit?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      maintenance_records: {
        Row: {
          cost: number | null
          created_at: string | null
          description: string
          duration_hours: number | null
          equipment_id: string | null
          id: string
          next_maintenance_date: string | null
          notes: string | null
          performed_at: string | null
          performed_by: string | null
          type: string
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          description: string
          duration_hours?: number | null
          equipment_id?: string | null
          id?: string
          next_maintenance_date?: string | null
          notes?: string | null
          performed_at?: string | null
          performed_by?: string | null
          type: string
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          description?: string
          duration_hours?: number | null
          equipment_id?: string | null
          id?: string
          next_maintenance_date?: string | null
          notes?: string | null
          performed_at?: string | null
          performed_by?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          from_user: string
          id: string
          location: string
          priority: string | null
          read_at: string | null
          status: string | null
          subject: string | null
          to_user: string | null
          type: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          from_user: string
          id?: string
          location: string
          priority?: string | null
          read_at?: string | null
          status?: string | null
          subject?: string | null
          to_user?: string | null
          type?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          from_user?: string
          id?: string
          location?: string
          priority?: string | null
          read_at?: string | null
          status?: string | null
          subject?: string | null
          to_user?: string | null
          type?: string | null
        }
        Relationships: []
      }
      monthly_inventories: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          department: string
          id: string
          location: string
          status: string | null
          total_value: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          department: string
          id?: string
          location: string
          status?: string | null
          total_value?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          department?: string
          id?: string
          location?: string
          status?: string | null
          total_value?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      monthly_inventory_items: {
        Row: {
          created_at: string | null
          id: string
          inventory_id: string | null
          notes: string | null
          product_id: string | null
          quantity: number | null
          total_value: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_id?: string | null
          notes?: string | null
          product_id?: string | null
          quantity?: number | null
          total_value?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_id?: string | null
          notes?: string | null
          product_id?: string | null
          quantity?: number | null
          total_value?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_inventory_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "monthly_inventories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_inventory_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "kitchen_products"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          location: string
          message: string
          read: boolean | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          location: string
          message: string
          read?: boolean | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          location?: string
          message?: string
          read?: boolean | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string | null
          delivery_date: string | null
          id: string
          location: string
          notes: string | null
          order_date: string | null
          order_number: string | null
          status: string | null
          supplier_id: string | null
          total_amount: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delivery_date?: string | null
          id?: string
          location: string
          notes?: string | null
          order_date?: string | null
          order_number?: string | null
          status?: string | null
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          delivery_date?: string | null
          id?: string
          location?: string
          notes?: string | null
          order_date?: string | null
          order_number?: string | null
          status?: string | null
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          department: string | null
          first_name: string
          id: string
          last_name: string
          location: string
          phone: string | null
          position: string | null
          role: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          first_name: string
          id?: string
          last_name: string
          location: string
          phone?: string | null
          position?: string | null
          role: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          first_name?: string
          id?: string
          last_name?: string
          location?: string
          phone?: string | null
          position?: string | null
          role?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          category: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          location: string
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          location: string
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          location?: string
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          completed_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          first_name: string
          id: string
          invitation_token: string | null
          invited_by: string | null
          last_name: string
          location: string
          role: string
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          first_name: string
          id?: string
          invitation_token?: string | null
          invited_by?: string | null
          last_name: string
          location: string
          role: string
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          first_name?: string
          id?: string
          invitation_token?: string | null
          invited_by?: string | null
          last_name?: string
          location?: string
          role?: string
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_all_locations: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_available_locations: {
        Args: { user_role?: string }
        Returns: {
          location: string
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
