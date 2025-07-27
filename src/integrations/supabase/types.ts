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
      archived_users: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"] | null
          archived_at: string
          archived_by: string | null
          can_reactivate: boolean | null
          department: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          location: string
          metadata: Json | null
          original_invitation_id: string | null
          original_user_id: string | null
          position: string | null
          previous_status: string
          reason: string | null
          restaurant_role: Database["public"]["Enums"]["restaurant_role"] | null
          role: string
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level"] | null
          archived_at?: string
          archived_by?: string | null
          can_reactivate?: boolean | null
          department?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          location: string
          metadata?: Json | null
          original_invitation_id?: string | null
          original_user_id?: string | null
          position?: string | null
          previous_status: string
          reason?: string | null
          restaurant_role?:
            | Database["public"]["Enums"]["restaurant_role"]
            | null
          role: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"] | null
          archived_at?: string
          archived_by?: string | null
          can_reactivate?: boolean | null
          department?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          location?: string
          metadata?: Json | null
          original_invitation_id?: string | null
          original_user_id?: string | null
          position?: string | null
          previous_status?: string
          reason?: string | null
          restaurant_role?:
            | Database["public"]["Enums"]["restaurant_role"]
            | null
          role?: string
        }
        Relationships: []
      }
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
      chat_messages: {
        Row: {
          chat_id: string
          content: string | null
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          media_size: number | null
          media_type: string | null
          media_url: string | null
          message_type: Database["public"]["Enums"]["message_type"] | null
          metadata: Json | null
          reply_to_id: string | null
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          chat_id: string
          content?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          media_size?: number | null
          media_type?: string | null
          media_url?: string | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          metadata?: Json | null
          reply_to_id?: string | null
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          chat_id?: string
          content?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          media_size?: number | null
          media_type?: string | null
          media_url?: string | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          metadata?: Json | null
          reply_to_id?: string | null
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      chat_notifications: {
        Row: {
          body: string
          chat_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message_id: string | null
          metadata: Json | null
          priority: Database["public"]["Enums"]["notification_priority"] | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          chat_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message_id?: string | null
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          chat_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message_id?: string | null
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_notifications_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_notifications_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          chat_id: string
          id: string
          is_muted: boolean | null
          joined_at: string | null
          last_read_at: string | null
          muted_until: string | null
          notification_settings: Json | null
          role: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          muted_until?: string | null
          notification_settings?: Json | null
          role?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          muted_until?: string | null
          notification_settings?: Json | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_archived: boolean | null
          last_message_at: string | null
          location: string
          metadata: Json | null
          name: string | null
          type: Database["public"]["Enums"]["chat_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          last_message_at?: string | null
          location: string
          metadata?: Json | null
          name?: string | null
          type: Database["public"]["Enums"]["chat_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          last_message_at?: string | null
          location?: string
          metadata?: Json | null
          name?: string | null
          type?: Database["public"]["Enums"]["chat_type"]
          updated_at?: string | null
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
      connection_requests: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          recipient_id: string
          requester_id: string
          status: Database["public"]["Enums"]["connection_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          recipient_id: string
          requester_id: string
          status?: Database["public"]["Enums"]["connection_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          recipient_id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["connection_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connection_requests_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "connection_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
      message_read_receipts: {
        Row: {
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
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
          access_level: Database["public"]["Enums"]["access_level"]
          avatar_url: string | null
          created_at: string | null
          department: string | null
          email: string | null
          first_name: string
          has_custom_permissions: boolean
          id: string
          last_login_at: string | null
          last_name: string
          location: string
          phone: string | null
          position: string | null
          restaurant_role: Database["public"]["Enums"]["restaurant_role"] | null
          role: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level"]
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          first_name: string
          has_custom_permissions?: boolean
          id?: string
          last_login_at?: string | null
          last_name: string
          location: string
          phone?: string | null
          position?: string | null
          restaurant_role?:
            | Database["public"]["Enums"]["restaurant_role"]
            | null
          role: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          first_name?: string
          has_custom_permissions?: boolean
          id?: string
          last_login_at?: string | null
          last_name?: string
          location?: string
          phone?: string | null
          position?: string | null
          restaurant_role?:
            | Database["public"]["Enums"]["restaurant_role"]
            | null
          role?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      role_audit_log: {
        Row: {
          action: string
          changed_user_id: string
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_user_id: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_user_id?: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
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
          access_level: Database["public"]["Enums"]["access_level"]
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
          metadata: Json | null
          restaurant_role: Database["public"]["Enums"]["restaurant_role"] | null
          role: string
          status: string | null
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level"]
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
          metadata?: Json | null
          restaurant_role?:
            | Database["public"]["Enums"]["restaurant_role"]
            | null
          role: string
          status?: string | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
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
          metadata?: Json | null
          restaurant_role?:
            | Database["public"]["Enums"]["restaurant_role"]
            | null
          role?: string
          status?: string | null
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          can_delete: boolean
          can_read: boolean
          can_validate: boolean
          can_write: boolean
          created_at: string
          id: string
          module: Database["public"]["Enums"]["app_module"]
          updated_at: string
          user_id: string
        }
        Insert: {
          can_delete?: boolean
          can_read?: boolean
          can_validate?: boolean
          can_write?: boolean
          created_at?: string
          id?: string
          module: Database["public"]["Enums"]["app_module"]
          updated_at?: string
          user_id: string
        }
        Update: {
          can_delete?: boolean
          can_read?: boolean
          can_validate?: boolean
          can_write?: boolean
          created_at?: string
          id?: string
          module?: Database["public"]["Enums"]["app_module"]
          updated_at?: string
          user_id?: string
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
      can_send_connection_request: {
        Args: { requester_user_id: string; recipient_user_id: string }
        Returns: boolean
      }
      cleanup_expired_invitations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_invitation_system: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      complete_invitation_signup: {
        Args: {
          token_to_complete: string
          user_email: string
          new_user_id: string
        }
        Returns: {
          success: boolean
          error_code: string
          error_message: string
        }[]
      }
      create_private_chat: {
        Args: { other_user_id: string }
        Returns: string
      }
      ensure_default_chats: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_available_locations: {
        Args: { user_role?: string }
        Returns: {
          location: string
        }[]
      }
      get_connection_status: {
        Args: { user1_id: string; user2_id: string }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_access_level: {
        Args: { user_uuid?: string }
        Returns: Database["public"]["Enums"]["access_level"]
      }
      has_module_permission: {
        Args: {
          module_name: Database["public"]["Enums"]["app_module"]
          permission_type?: string
          user_uuid?: string
        }
        Returns: boolean
      }
      is_email_permanently_deleted: {
        Args: { check_email: string }
        Returns: boolean
      }
      validate_invitation_comprehensive: {
        Args: { token_to_check: string }
        Returns: {
          is_valid: boolean
          error_code: string
          error_message: string
          invitation_data: Json
        }[]
      }
      validate_invitation_token: {
        Args: { token_to_check: string }
        Returns: {
          is_valid: boolean
          error_code: string
          error_message: string
          invitation_data: Json
        }[]
      }
    }
    Enums: {
      access_level:
        | "base"
        | "manager_sala"
        | "manager_cucina"
        | "general_manager"
        | "assistant_manager"
        | "financial_department"
        | "communication_department"
        | "observer"
      app_module:
        | "chat"
        | "inventory_sala"
        | "inventory_kitchen"
        | "checklists"
        | "suppliers"
        | "equipment"
        | "financial"
        | "cash_closure"
        | "reports"
        | "tasks"
        | "communication"
        | "announcements"
        | "user_management"
      chat_type: "private" | "group" | "global" | "announcements"
      connection_status: "pending" | "accepted" | "declined" | "blocked"
      message_type: "text" | "image" | "voice" | "document" | "system"
      notification_priority: "normal" | "urgent" | "forced"
      restaurant_role:
        | "waiter"
        | "runner"
        | "bartender"
        | "floor_manager"
        | "location_director"
        | "general_director"
        | "cook"
        | "kitchen_assistant"
        | "pizza_chef"
        | "dishwasher"
        | "stock_manager"
        | "cleaning_staff"
        | "accountant"
        | "procurement_manager"
        | "social_media_manager"
        | "maintenance_manager"
        | "human_resources"
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
    Enums: {
      access_level: [
        "base",
        "manager_sala",
        "manager_cucina",
        "general_manager",
        "assistant_manager",
        "financial_department",
        "communication_department",
        "observer",
      ],
      app_module: [
        "chat",
        "inventory_sala",
        "inventory_kitchen",
        "checklists",
        "suppliers",
        "equipment",
        "financial",
        "cash_closure",
        "reports",
        "tasks",
        "communication",
        "announcements",
        "user_management",
      ],
      chat_type: ["private", "group", "global", "announcements"],
      connection_status: ["pending", "accepted", "declined", "blocked"],
      message_type: ["text", "image", "voice", "document", "system"],
      notification_priority: ["normal", "urgent", "forced"],
      restaurant_role: [
        "waiter",
        "runner",
        "bartender",
        "floor_manager",
        "location_director",
        "general_director",
        "cook",
        "kitchen_assistant",
        "pizza_chef",
        "dishwasher",
        "stock_manager",
        "cleaning_staff",
        "accountant",
        "procurement_manager",
        "social_media_manager",
        "maintenance_manager",
        "human_resources",
      ],
    },
  },
} as const
