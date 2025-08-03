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
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          room_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          room_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_participants: {
        Row: {
          joined_at: string
          last_read_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          last_read_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          last_read_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: number
          is_read: boolean
          payload: Json | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_read?: boolean
          payload?: Json | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          is_read?: boolean
          payload?: Json | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          birth_year: number | null
          created_at: string | null
          gender: string | null
          id: string
          is_manager: boolean | null
          is_provider: number | null
          phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          birth_year?: number | null
          created_at?: string | null
          gender?: string | null
          id: string
          is_manager?: boolean | null
          is_provider?: number | null
          phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          birth_year?: number | null
          created_at?: string | null
          gender?: string | null
          id?: string
          is_manager?: boolean | null
          is_provider?: number | null
          phone_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      provider_applications: {
        Row: {
          applicant_id: string
          business_reg: string
          created_at: string | null
          id: number
          memo: string | null
          portfolio: string | null
          reject_reason: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: number
          updated_at: string | null
        }
        Insert: {
          applicant_id: string
          business_reg: string
          created_at?: string | null
          id?: never
          memo?: string | null
          portfolio?: string | null
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: number
          updated_at?: string | null
        }
        Update: {
          applicant_id?: string
          business_reg?: string
          created_at?: string | null
          id?: never
          memo?: string | null
          portfolio?: string | null
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          categories: string[] | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          service_areas: string[] | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          categories?: string[] | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          service_areas?: string[] | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          categories?: string[] | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          service_areas?: string[] | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_dm_room: {
        Args: { u1: string; u2: string }
        Returns: string
      }
      create_or_get_dm_room: {
        Args: { u1: string; u2: string }
        Returns: string
      }
      is_room_member: {
        Args: { room: string }
        Returns: boolean
      }
      my_chat_list: {
        Args: { u: string }
        Returns: {
          room_id: string
          other_id: string
          last_content: string
          last_at: string
          unread_count: number
        }[]
      }
    }
    Enums: {
      chat_room_type: "dm" | "support"
      conversation_type: "dm" | "support"
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
      chat_room_type: ["dm", "support"],
      conversation_type: ["dm", "support"],
    },
  },
} as const
