export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      checkins: {
        Row: {
          created_at: string
          day: string
          mood: string
          note: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day?: string
          mood?: string
          note?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          mood?: string
          note?: string
          user_id?: string
        }
        Relationships: []
      }
      cheers: {
        Row: {
          created_at: string
          emoji: string
          from_user: string
          id: string
          message: string
          to_user: string
        }
        Insert: {
          created_at?: string
          emoji?: string
          from_user: string
          id?: string
          message?: string
          to_user: string
        }
        Update: {
          created_at?: string
          emoji?: string
          from_user?: string
          id?: string
          message?: string
          to_user?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          certificate_url: string | null
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          position: number
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          position?: number
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          position?: number
          user_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee: string
          created_at: string
          id: string
          requester: string
          status: string
        }
        Insert: {
          addressee: string
          created_at?: string
          id?: string
          requester: string
          status?: string
        }
        Update: {
          addressee?: string
          created_at?: string
          id?: string
          requester?: string
          status?: string
        }
        Relationships: []
      }
      lesson_completions: {
        Row: {
          completed_on: string
          course_id: string
          created_at: string
          id: string
          minutes: number
          unit_index: number
          user_id: string
        }
        Insert: {
          completed_on?: string
          course_id: string
          created_at?: string
          id?: string
          minutes?: number
          unit_index: number
          user_id: string
        }
        Update: {
          completed_on?: string
          course_id?: string
          created_at?: string
          id?: string
          minutes?: number
          unit_index?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_emoji: string
          bio: string
          created_at: string
          current_streak: number
          display_name: string
          hours_per_week: number
          id: string
          last_active_date: string | null
          longest_streak: number
          pace_mode: string
          target_date: string | null
          track_id: string | null
          username: string
          xp: number
        }
        Insert: {
          avatar_emoji?: string
          bio?: string
          created_at?: string
          current_streak?: number
          display_name?: string
          hours_per_week?: number
          id: string
          last_active_date?: string | null
          longest_streak?: number
          pace_mode?: string
          target_date?: string | null
          track_id?: string | null
          username: string
          xp?: number
        }
        Update: {
          avatar_emoji?: string
          bio?: string
          created_at?: string
          current_streak?: number
          display_name?: string
          hours_per_week?: number
          id?: string
          last_active_date?: string | null
          longest_streak?: number
          pace_mode?: string
          target_date?: string | null
          track_id?: string | null
          username?: string
          xp?: number
        }
        Relationships: []
      }
      squad_members: {
        Row: {
          joined_at: string
          squad_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          squad_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          squad_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_members_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          created_at: string
          emoji: string
          id: string
          invite_code: string
          name: string
          owner_id: string
          weekly_xp_goal: number
        }
        Insert: {
          created_at?: string
          emoji?: string
          id?: string
          invite_code?: string
          name: string
          owner_id: string
          weekly_xp_goal?: number
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          invite_code?: string
          name?: string
          owner_id?: string
          weekly_xp_goal?: number
        }
        Relationships: []
      }
      xp_events: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _award: {
        Args: { _reason: string; _uid: string; _xp: number }
        Returns: undefined
      }
      complete_course: {
        Args: { _cert: string; _course: string }
        Returns: undefined
      }
      complete_unit: {
        Args: { _course: string; _minutes: number; _unit: number }
        Returns: undefined
      }
      daily_checkin: {
        Args: { _mood: string; _note: string }
        Returns: undefined
      }
      is_squad_member: {
        Args: { _squad: string; _uid: string }
        Returns: boolean
      }
      join_squad: { Args: { _code: string }; Returns: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
