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
      alert_configurations: {
        Row: {
          alert_type: string
          created_at: string
          dashboard_enabled: boolean
          email_address: string | null
          email_enabled: boolean
          id: string
          is_enabled: boolean
          threshold_settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          dashboard_enabled?: boolean
          email_address?: string | null
          email_enabled?: boolean
          id?: string
          is_enabled?: boolean
          threshold_settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          dashboard_enabled?: boolean
          email_address?: string | null
          email_enabled?: boolean
          id?: string
          is_enabled?: boolean
          threshold_settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_read: boolean
          location_code: string | null
          message: string
          metadata: Json | null
          severity: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_read?: boolean
          location_code?: string | null
          message: string
          metadata?: Json | null
          severity?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean
          location_code?: string | null
          message?: string
          metadata?: Json | null
          severity?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      app_analysis_history: {
        Row: {
          created_at: string
          data: Json
          id: string
          summary: Json
          timestamp: string
          version: string
        }
        Insert: {
          created_at?: string
          data: Json
          id?: string
          summary?: Json
          timestamp?: string
          version: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          summary?: Json
          timestamp?: string
          version?: string
        }
        Relationships: []
      }
      archived_users: {
        Row: {
          archived_at: string
          archived_by: string | null
          can_reactivate: boolean | null
          department: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          locations: string[] | null
          metadata: Json | null
          original_invitation_id: string | null
          original_user_id: string | null
          position: string | null
          previous_status: string
          reason: string | null
        }
        Insert: {
          archived_at?: string
          archived_by?: string | null
          can_reactivate?: boolean | null
          department?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          locations?: string[] | null
          metadata?: Json | null
          original_invitation_id?: string | null
          original_user_id?: string | null
          position?: string | null
          previous_status: string
          reason?: string | null
        }
        Update: {
          archived_at?: string
          archived_by?: string | null
          can_reactivate?: boolean | null
          department?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          locations?: string[] | null
          metadata?: Json | null
          original_invitation_id?: string | null
          original_user_id?: string | null
          position?: string | null
          previous_status?: string
          reason?: string | null
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
      chat_message_archives: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          chat_id: string
          content: string | null
          id: string
          media_size: number | null
          media_type: string | null
          media_url: string | null
          message_type: Database["public"]["Enums"]["message_type"] | null
          metadata: Json | null
          original_created_at: string
          original_message_id: string
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          chat_id: string
          content?: string | null
          id?: string
          media_size?: number | null
          media_type?: string | null
          media_url?: string | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          metadata?: Json | null
          original_created_at: string
          original_message_id: string
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          chat_id?: string
          content?: string | null
          id?: string
          media_size?: number | null
          media_type?: string | null
          media_url?: string | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          metadata?: Json | null
          original_created_at?: string
          original_message_id?: string
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_archives_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
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
          is_federated: boolean | null
          last_message_at: string | null
          location: string
          location_group_id: string | null
          metadata: Json | null
          name: string | null
          participant_count: number | null
          type: Database["public"]["Enums"]["chat_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          is_federated?: boolean | null
          last_message_at?: string | null
          location: string
          location_group_id?: string | null
          metadata?: Json | null
          name?: string | null
          participant_count?: number | null
          type: Database["public"]["Enums"]["chat_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          is_federated?: boolean | null
          last_message_at?: string | null
          location?: string
          location_group_id?: string | null
          metadata?: Json | null
          name?: string | null
          participant_count?: number | null
          type?: Database["public"]["Enums"]["chat_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_location_group_id_fkey"
            columns: ["location_group_id"]
            isOneToOne: false
            referencedRelation: "location_chat_groups"
            referencedColumns: ["id"]
          },
        ]
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
      detected_functions: {
        Row: {
          created_at: string
          detection_method: string
          file_path: string
          function_name: string
          function_signature: string | null
          id: string
          is_test_ready: boolean
          last_detected_at: string
          metadata: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          detection_method: string
          file_path: string
          function_name: string
          function_signature?: string | null
          id?: string
          is_test_ready?: boolean
          last_detected_at?: string
          metadata?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          detection_method?: string
          file_path?: string
          function_name?: string
          function_signature?: string | null
          id?: string
          is_test_ready?: boolean
          last_detected_at?: string
          metadata?: Json | null
          updated_at?: string
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
          name: string
          unit: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          location: string
          name: string
          unit?: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          location?: string
          name?: string
          unit?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      location_chat_groups: {
        Row: {
          archive_after_days: number | null
          auto_join_enabled: boolean | null
          chat_type: Database["public"]["Enums"]["federated_chat_type"]
          created_at: string | null
          created_by: string | null
          description: string | null
          hierarchy_level: number
          id: string
          is_active: boolean | null
          location_pattern: string[]
          max_participants: number | null
          metadata: Json | null
          name: string
          priority: number | null
          required_roles: string[] | null
          updated_at: string | null
        }
        Insert: {
          archive_after_days?: number | null
          auto_join_enabled?: boolean | null
          chat_type: Database["public"]["Enums"]["federated_chat_type"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          hierarchy_level?: number
          id?: string
          is_active?: boolean | null
          location_pattern: string[]
          max_participants?: number | null
          metadata?: Json | null
          name: string
          priority?: number | null
          required_roles?: string[] | null
          updated_at?: string | null
        }
        Update: {
          archive_after_days?: number | null
          auto_join_enabled?: boolean | null
          chat_type?: Database["public"]["Enums"]["federated_chat_type"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          hierarchy_level?: number
          id?: string
          is_active?: boolean | null
          location_pattern?: string[]
          max_participants?: number | null
          metadata?: Json | null
          name?: string
          priority?: number | null
          required_roles?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      location_dashboard_configs: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          layout: Json
          location_id: string
          theme: Json
          updated_at: string
          widgets: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          layout?: Json
          location_id: string
          theme?: Json
          updated_at?: string
          widgets?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          layout?: Json
          location_id?: string
          theme?: Json
          updated_at?: string
          widgets?: Json
        }
        Relationships: []
      }
      locations: {
        Row: {
          code: string
          created_at: string | null
          depth: number | null
          hierarchy: Json | null
          id: string
          is_active: boolean | null
          name: string
          parent_location_id: string | null
          path: string[] | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          depth?: number | null
          hierarchy?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_location_id?: string | null
          path?: string[] | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          depth?: number | null
          hierarchy?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_location_id?: string | null
          path?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_parent_location_id_fkey"
            columns: ["parent_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
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
      message_reminders: {
        Row: {
          chat_id: string
          created_at: string
          id: string
          message_id: string
          scheduled_at: string
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          id?: string
          message_id: string
          scheduled_at: string
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          id?: string
          message_id?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reminders_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reminders_message_id_fkey"
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
      performance_test_results: {
        Row: {
          alerts_generated: number | null
          created_at: string
          end_time: string | null
          id: string
          metrics: Json | null
          start_time: string
          status: string
          test_function: string
          test_suite: string
          updated_at: string
        }
        Insert: {
          alerts_generated?: number | null
          created_at?: string
          end_time?: string | null
          id?: string
          metrics?: Json | null
          start_time: string
          status?: string
          test_function: string
          test_suite: string
          updated_at?: string
        }
        Update: {
          alerts_generated?: number | null
          created_at?: string
          end_time?: string | null
          id?: string
          metrics?: Json | null
          start_time?: string
          status?: string
          test_function?: string
          test_suite?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          last_login_at: string | null
          last_name: string
          locations: string[] | null
          phone: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_login_at?: string | null
          last_name: string
          locations?: string[] | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_login_at?: string | null
          last_name?: string
          locations?: string[] | null
          phone?: string | null
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
          locations: string[] | null
          metadata: Json | null
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
          locations?: string[] | null
          metadata?: Json | null
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
          locations?: string[] | null
          metadata?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      user_locations: {
        Row: {
          assigned_at: string | null
          id: string
          location_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          location_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          id?: string
          location_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_old_messages: {
        Args: { chat_id_param: string; days_old?: number }
        Returns: number
      }
      auto_join_federated_chats: {
        Args: { target_user_id: string }
        Returns: {
          action: string
          group_name: string
          chat_id: string
          message: string
        }[]
      }
      backfill_user_chat_memberships: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_count: number
          memberships_added: number
        }[]
      }
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
      create_alert: {
        Args: {
          p_alert_type: string
          p_title: string
          p_message: string
          p_severity?: string
          p_metadata?: Json
          p_user_id?: string
          p_location_code?: string
        }
        Returns: string
      }
      create_private_chat: {
        Args: { other_user_id: string }
        Returns: string
      }
      debug_user_auth_state: {
        Args: Record<PropertyKey, never>
        Returns: {
          auth_user_id: string
          profile_exists: boolean
          profile_data: Json
          expected_chats: string[]
          actual_chat_memberships: string[]
          issues: string[]
        }[]
      }
      emergency_create_user_profile: {
        Args: {
          target_user_id: string
          user_email?: string
          user_location?: string
        }
        Returns: {
          success: boolean
          message: string
          profile_data: Json
        }[]
      }
      emergency_ensure_all_default_chats: {
        Args: Record<PropertyKey, never>
        Returns: {
          action: string
          chat_type: string
          location: string
          chat_id: string
          chat_name: string
        }[]
      }
      emergency_join_current_user_to_chats: {
        Args: Record<PropertyKey, never>
        Returns: {
          action: string
          chat_type: string
          location: string
          chat_id: string
          message: string
        }[]
      }
      ensure_chats_for_all_locations: {
        Args: Record<PropertyKey, never>
        Returns: {
          action: string
          location_code: string
          chat_type: string
          chat_id: string
          message: string
        }[]
      }
      ensure_default_chats: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      force_create_default_chats: {
        Args: Record<PropertyKey, never>
        Returns: {
          action: string
          chat_type: string
          location: string
          chat_id: string
          message: string
        }[]
      }
      force_join_user_to_chats: {
        Args: { target_user_id: string }
        Returns: {
          action: string
          chat_type: string
          location: string
          chat_id: string
          message: string
        }[]
      }
      get_active_locations: {
        Args: Record<PropertyKey, never>
        Returns: {
          code: string
          name: string
        }[]
      }
      get_available_locations: {
        Args: { user_role?: string }
        Returns: {
          location: string
        }[]
      }
      get_chat_messages_paginated: {
        Args: {
          chat_id_param: string
          page_size?: number
          before_timestamp?: string
          include_archived?: boolean
        }
        Returns: {
          message_id: string
          content: string
          sender_id: string
          sender_name: string
          message_type: Database["public"]["Enums"]["message_type"]
          media_url: string
          media_type: string
          created_at: string
          is_edited: boolean
          is_archived: boolean
          reply_to_id: string
        }[]
      }
      get_chat_unread_count_optimized: {
        Args: { p_chat_id: string; p_user_id: string }
        Returns: number
      }
      get_chats_with_unread_counts: {
        Args: { user_id: string; user_locations: string[] }
        Returns: {
          id: string
          type: Database["public"]["Enums"]["chat_type"]
          name: string
          location: string
          description: string
          is_archived: boolean
          metadata: Json
          last_message_at: string
          created_at: string
          updated_at: string
          created_by: string
          participants: Json
          last_message: Json
          unread_count: number
        }[]
      }
      get_comprehensive_chat_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_chats: number
          total_users: number
          total_memberships: number
          chats_detail: Json
          users_without_chats: Json
        }[]
      }
      get_connection_status: {
        Args: { user1_id: string; user2_id: string }
        Returns: string
      }
      get_current_user_locations: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_location_ancestors: {
        Args: { location_id: string }
        Returns: {
          id: string
          code: string
          name: string
          depth: number
        }[]
      }
      get_location_aware_data: {
        Args: {
          target_user_id: string
          table_name: string
          location_codes?: string[]
          date_filter?: string
          status_filter?: string
        }
        Returns: {
          location_code: string
          data_count: number
          latest_created_at: string
        }[]
      }
      get_location_descendants: {
        Args: { location_id: string }
        Returns: {
          id: string
          code: string
          name: string
          depth: number
          full_path: string
        }[]
      }
      get_locations_by_level: {
        Args: { level_name?: string }
        Returns: {
          id: string
          code: string
          name: string
          hierarchy: Json
          full_path: string
        }[]
      }
      get_paginated_messages: {
        Args: {
          p_chat_id: string
          p_cursor?: string
          p_limit?: number
          p_direction?: string
        }
        Returns: {
          id: string
          chat_id: string
          sender_id: string
          content: string
          message_type: string
          media_url: string
          created_at: string
          is_edited: boolean
          is_deleted: boolean
          sender_info: Json
          read_receipts: Json
          total_count: number
        }[]
      }
      get_user_alert_configurations: {
        Args: { target_user_id: string }
        Returns: {
          alert_type: string
          is_enabled: boolean
          email_enabled: boolean
          dashboard_enabled: boolean
          email_address: string
          threshold_settings: Json
        }[]
      }
      get_user_chat_ids: {
        Args: { user_uuid?: string }
        Returns: string[]
      }
      get_user_chats_bulk: {
        Args: { target_user_id: string }
        Returns: {
          chat_id: string
          chat_type: Database["public"]["Enums"]["chat_type"]
          chat_name: string
          location_code: string
          unread_count: number
          last_message_at: string
          user_role: string
        }[]
      }
      get_user_location_data: {
        Args: { target_user_id: string; location_codes?: string[] }
        Returns: {
          location_code: string
          has_access: boolean
          role: string
          permissions: Json
        }[]
      }
      get_user_locations: {
        Args: { user_uuid?: string }
        Returns: string[]
      }
      get_user_unread_counts: {
        Args: { user_id: string }
        Returns: {
          total: number
          bychat: Json
        }[]
      }
      is_email_permanently_deleted: {
        Args: { check_email: string }
        Returns: boolean
      }
      refresh_location_hierarchy_view: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sync_all_users_to_location_chats: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_count: number
          total_syncs: number
          errors: string[]
        }[]
      }
      sync_user_chat_memberships: {
        Args: { target_user_id: string }
        Returns: {
          action: string
          location_code: string
          chat_type: string
          chat_id: string
          message: string
        }[]
      }
      user_can_access_chat: {
        Args: { chat_uuid: string; user_uuid?: string }
        Returns: boolean
      }
      user_has_access_to_location: {
        Args: { check_location: string; user_uuid?: string }
        Returns: boolean
      }
      user_has_location_access_optimized: {
        Args: { target_user_id: string; location_code: string }
        Returns: boolean
      }
      user_matches_location_group: {
        Args: { target_user_id: string; group_location_patterns: string[] }
        Returns: boolean
      }
      validate_chat_system_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          status: string
          details: string
          user_count: number
        }[]
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
      validate_location_system_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          status: string
          details: string
          count: number
        }[]
      }
      validate_user_locations_batch: {
        Args: { target_user_id: string; location_codes: string[] }
        Returns: {
          location_code: string
          has_access: boolean
          location_exists: boolean
        }[]
      }
    }
    Enums: {
      chat_type: "private" | "group" | "global" | "announcements"
      connection_status: "pending" | "accepted" | "declined" | "blocked"
      federated_chat_type:
        | "regional"
        | "city_wide"
        | "district"
        | "department"
        | "role_based"
        | "emergency"
      message_type: "text" | "image" | "voice" | "document" | "system"
      notification_priority: "normal" | "urgent" | "forced"
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
      chat_type: ["private", "group", "global", "announcements"],
      connection_status: ["pending", "accepted", "declined", "blocked"],
      federated_chat_type: [
        "regional",
        "city_wide",
        "district",
        "department",
        "role_based",
        "emergency",
      ],
      message_type: ["text", "image", "voice", "document", "system"],
      notification_priority: ["normal", "urgent", "forced"],
    },
  },
} as const
