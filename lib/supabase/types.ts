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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      daily_texts: {
        Row: {
          category: string
          created_at: string
          date: string
          id: string
          script: string
          text_id: string
        }
        Insert: {
          category: string
          created_at?: string
          date: string
          id?: string
          script: string
          text_id: string
        }
        Update: {
          category?: string
          created_at?: string
          date?: string
          id?: string
          script?: string
          text_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_texts_text_id_fkey"
            columns: ["text_id"]
            isOneToOne: false
            referencedRelation: "text_pool"
            referencedColumns: ["id"]
          },
        ]
      }
      game_scores: {
        Row: {
          created_at: string
          elapsed_seconds: number
          id: string
          level: number
          score: number
          user_id: string
          words_destroyed: number
        }
        Insert: {
          created_at?: string
          elapsed_seconds?: number
          id?: string
          level: number
          score: number
          user_id: string
          words_destroyed: number
        }
        Update: {
          created_at?: string
          elapsed_seconds?: number
          id?: string
          level?: number
          score?: number
          user_id?: string
          words_destroyed?: number
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          confirmation_token: string | null
          email: string
          id: string
          is_confirmed: boolean
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          confirmation_token?: string | null
          email: string
          id?: string
          is_confirmed?: boolean
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          confirmation_token?: string | null
          email?: string
          id?: string
          is_confirmed?: boolean
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      personal_bests: {
        Row: {
          achieved_at: string
          best_accuracy: number
          best_score: number
          best_wpm: number
          category: string
          game_mode: string
          id: string
          level: string | null
          score_id: string
          script: string
          strict_mode: boolean
          timer_seconds: number | null
          user_id: string
        }
        Insert: {
          achieved_at?: string
          best_accuracy: number
          best_score: number
          best_wpm: number
          category: string
          game_mode?: string
          id?: string
          level?: string | null
          score_id: string
          script: string
          strict_mode?: boolean
          timer_seconds?: number | null
          user_id: string
        }
        Update: {
          achieved_at?: string
          best_accuracy?: number
          best_score?: number
          best_wpm?: number
          category?: string
          game_mode?: string
          id?: string
          level?: string | null
          score_id?: string
          script?: string
          strict_mode?: boolean
          timer_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_bests_score_id_fkey"
            columns: ["score_id"]
            isOneToOne: false
            referencedRelation: "scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_bests_score_id_fkey"
            columns: ["score_id"]
            isOneToOne: false
            referencedRelation: "v_daily_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      profanity_words: {
        Row: {
          added_by: string | null
          category: string | null
          created_at: string
          id: string
          word: string
        }
        Insert: {
          added_by?: string | null
          category?: string | null
          created_at?: string
          id?: string
          word: string
        }
        Update: {
          added_by?: string | null
          category?: string | null
          created_at?: string
          id?: string
          word?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ban_reason: string | null
          banned_at: string | null
          banned_by: string | null
          created_at: string
          current_streak: number
          daily_limit_override: number | null
          id: string
          is_admin: boolean
          is_banned: boolean
          last_active_date: string | null
          longest_streak: number
          updated_at: string
          username: string
        }
        Insert: {
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          created_at?: string
          current_streak?: number
          daily_limit_override?: number | null
          id: string
          is_admin?: boolean
          is_banned?: boolean
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string
          username: string
        }
        Update: {
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          created_at?: string
          current_streak?: number
          daily_limit_override?: number | null
          id?: string
          is_admin?: boolean
          is_banned?: boolean
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      scores: {
        Row: {
          accuracy: number
          category: string
          consistency: number
          correct_chars: number
          created_at: string
          duration_seconds: number
          errors: number
          flag_reason: string | null
          id: string
          is_flagged: boolean
          keystroke_log: Json | null
          level: string | null
          mode: string
          paste_detected: boolean
          raw_wpm: number
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          score: number
          script: string
          strict_mode: boolean
          tab_switch_count: number
          text_id: string | null
          timer_seconds: number | null
          timing_mean: number | null
          timing_stddev: number | null
          total_chars: number
          user_id: string
          wpm: number
        }
        Insert: {
          accuracy: number
          category: string
          consistency: number
          correct_chars: number
          created_at?: string
          duration_seconds: number
          errors?: number
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean
          keystroke_log?: Json | null
          level?: string | null
          mode?: string
          paste_detected?: boolean
          raw_wpm: number
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          score: number
          script: string
          strict_mode?: boolean
          tab_switch_count?: number
          text_id?: string | null
          timer_seconds?: number | null
          timing_mean?: number | null
          timing_stddev?: number | null
          total_chars: number
          user_id: string
          wpm: number
        }
        Update: {
          accuracy?: number
          category?: string
          consistency?: number
          correct_chars?: number
          created_at?: string
          duration_seconds?: number
          errors?: number
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean
          keystroke_log?: Json | null
          level?: string | null
          mode?: string
          paste_detected?: boolean
          raw_wpm?: number
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number
          script?: string
          strict_mode?: boolean
          tab_switch_count?: number
          text_id?: string | null
          timer_seconds?: number | null
          timing_mean?: number | null
          timing_stddev?: number | null
          total_chars?: number
          user_id?: string
          wpm?: number
        }
        Relationships: [
          {
            foreignKeyName: "scores_text_id_fkey"
            columns: ["text_id"]
            isOneToOne: false
            referencedRelation: "text_pool"
            referencedColumns: ["id"]
          },
        ]
      }
      text_pool: {
        Row: {
          category: string
          char_count: number | null
          content_cyr: string
          content_easy: string
          content_lat: string
          created_at: string
          difficulty: string | null
          id: string
          is_active: boolean
          pool_mode: string
          script: string | null
          source: string | null
          word_count: number | null
        }
        Insert: {
          category: string
          char_count?: number | null
          content_cyr: string
          content_easy: string
          content_lat: string
          created_at?: string
          difficulty?: string | null
          id?: string
          is_active?: boolean
          pool_mode?: string
          script?: string | null
          source?: string | null
          word_count?: number | null
        }
        Update: {
          category?: string
          char_count?: number | null
          content_cyr?: string
          content_easy?: string
          content_lat?: string
          created_at?: string
          difficulty?: string | null
          id?: string
          is_active?: boolean
          pool_mode?: string
          script?: string | null
          source?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      wins: {
        Row: {
          category: string
          created_at: string
          id: string
          script: string
          user_id: string
          win_date: string
          wpm: number
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          script: string
          user_id: string
          win_date: string
          wpm: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          script?: string
          user_id?: string
          win_date?: string
          wpm?: number
        }
        Relationships: []
      }
    }
    Views: {
      game_leaderboard: {
        Row: {
          max_level: number | null
          max_score: number | null
          max_words: number | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
      game_personal_bests: {
        Row: {
          best_level: number | null
          best_score: number | null
          created_at: string | null
          elapsed_seconds: number | null
          user_id: string | null
          words_destroyed: number | null
        }
        Relationships: []
      }
      v_daily_leaderboard: {
        Row: {
          accuracy: number | null
          category: string | null
          created_at: string | null
          daily_rank: number | null
          id: string | null
          raw_wpm: number | null
          score: number | null
          script: string | null
          user_id: string | null
          username: string | null
          wpm: number | null
        }
        Relationships: []
      }
      v_monthly_leaderboard: {
        Row: {
          active_days: number | null
          avg_accuracy: number | null
          avg_wpm: number | null
          category: string | null
          period_rank: number | null
          period_score: number | null
          script: string | null
          total_days: number | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
      v_weekly_leaderboard: {
        Row: {
          active_days: number | null
          avg_accuracy: number | null
          avg_wpm: number | null
          category: string | null
          period_rank: number | null
          period_score: number | null
          script: string | null
          total_days: number | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
      v_yearly_leaderboard: {
        Row: {
          active_days: number | null
          avg_accuracy: number | null
          avg_wpm: number | null
          category: string | null
          period_rank: number | null
          period_score: number | null
          script: string | null
          total_days: number | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      ban_user: {
        Args: { p_admin_id: string; p_reason: string; p_user_id: string }
        Returns: undefined
      }
      generate_daily_texts: { Args: { p_date?: string }; Returns: undefined }
      get_db_size_mb: { Args: never; Returns: number }
      record_daily_winners: { Args: { p_date?: string }; Returns: undefined }
      unban_user: {
        Args: { p_admin_id: string; p_user_id: string }
        Returns: undefined
      }
      update_user_streak: { Args: { p_user_id: string }; Returns: undefined }
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
