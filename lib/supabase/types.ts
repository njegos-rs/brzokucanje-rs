export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          created_at: string
          updated_at: string
          is_admin: boolean
          is_banned: boolean
          daily_limit_override: number | null
          ban_reason: string | null
          banned_at: string | null
          banned_by: string | null
          current_streak: number
          longest_streak: number
          last_active_date: string | null
          newsletter_subscribed: boolean
          email: string | null
        }
        Insert: {
          id: string
          username?: string | null
          created_at?: string
          updated_at?: string
          is_admin?: boolean
          is_banned?: boolean
          daily_limit_override?: number | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          current_streak?: number
          longest_streak?: number
          last_active_date?: string | null
          newsletter_subscribed?: boolean
          email?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          created_at?: string
          updated_at?: string
          is_admin?: boolean
          is_banned?: boolean
          daily_limit_override?: number | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          current_streak?: number
          longest_streak?: number
          last_active_date?: string | null
          newsletter_subscribed?: boolean
          email?: string | null
        }
        Relationships: []
      }
      scores: {
        Row: {
          id: string
          user_id: string
          category: string
          script: string
          mode: string
          wpm: number
          raw_wpm: number
          accuracy: number
          consistency: number
          score: number
          duration_seconds: number
          correct_chars: number
          total_chars: number
          errors: number
          keystroke_log: Json | null
          is_flagged: boolean
          flag_reason: string | null
          flag_reviewed: boolean
          review_decision: string | null
          review_status: string
          reviewed_by: string | null
          reviewed_at: string | null
          timing_stddev: number | null
          timing_mean: number | null
          paste_detected: boolean
          tab_switch_count: number
          timer_seconds: number | null
          strict_mode: boolean
          level: string | null
          text_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          script: string
          mode?: string
          wpm: number
          raw_wpm: number
          accuracy: number
          consistency: number
          score: number
          duration_seconds: number
          correct_chars: number
          total_chars: number
          errors?: number
          keystroke_log?: Json | null
          is_flagged?: boolean
          flag_reason?: string | null
          flag_reviewed?: boolean
          review_decision?: string | null
          review_status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          timing_stddev?: number | null
          timing_mean?: number | null
          paste_detected?: boolean
          tab_switch_count?: number
          timer_seconds?: number | null
          strict_mode?: boolean
          level?: string | null
          text_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          script?: string
          mode?: string
          wpm?: number
          raw_wpm?: number
          accuracy?: number
          consistency?: number
          score?: number
          duration_seconds?: number
          correct_chars?: number
          total_chars?: number
          errors?: number
          keystroke_log?: Json | null
          is_flagged?: boolean
          flag_reason?: string | null
          flag_reviewed?: boolean
          review_decision?: string | null
          review_status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          timing_stddev?: number | null
          timing_mean?: number | null
          paste_detected?: boolean
          tab_switch_count?: number
          timer_seconds?: number | null
          strict_mode?: boolean
          level?: string | null
          text_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      admin_actions: {
        Row: {
          id: string
          admin_id: string
          action: string
          target_type: string
          target_id: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          target_type: string
          target_id: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string
          target_type?: string
          target_id?: string
          details?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          id: string
          admin_id: string
          action: string
          target_type: string
          target_id: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          target_type: string
          target_id: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string
          target_type?: string
          target_id?: string
          details?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      text_pool: {
        Row: {
          id: string
          content_lat: string
          content_cyr: string
          content_easy: string
          category: string
          source: string
          difficulty: string | null
          is_active: boolean
          word_count: number | null
          char_count: number | null
          pool_mode: string
          script: string | null
          created_at: string
        }
        Insert: {
          id?: string
          content_lat: string
          content_cyr: string
          content_easy: string
          category: string
          source?: string
          difficulty?: string | null
          is_active?: boolean
          word_count?: number | null
          char_count?: number | null
          pool_mode?: string
          script?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          content_lat?: string
          content_cyr?: string
          content_easy?: string
          category?: string
          source?: string
          difficulty?: string | null
          is_active?: boolean
          word_count?: number | null
          char_count?: number | null
          pool_mode?: string
          script?: string | null
          created_at?: string
        }
        Relationships: []
      }
      daily_texts: {
        Row: {
          id: string
          date: string
          script: string
          category: string
          text_id: string
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          script: string
          category: string
          text_id: string
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          script?: string
          category?: string
          text_id?: string
          created_at?: string
        }
        Relationships: []
      }
      personal_bests: {
        Row: {
          id: string
          user_id: string
          category: string
          script: string
          game_mode: string
          timer_seconds: number | null
          strict_mode: boolean
          level: string | null
          best_wpm: number
          best_score: number
          best_accuracy: number
          achieved_at: string
          score_id: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          script: string
          game_mode?: string
          timer_seconds?: number | null
          strict_mode?: boolean
          level?: string | null
          best_wpm: number
          best_score: number
          best_accuracy: number
          achieved_at?: string
          score_id: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          script?: string
          game_mode?: string
          timer_seconds?: number | null
          strict_mode?: boolean
          level?: string | null
          best_wpm?: number
          best_score?: number
          best_accuracy?: number
          achieved_at?: string
          score_id?: string
        }
        Relationships: []
      }
      profanity_words: {
        Row: {
          id: string
          word: string
          category: string | null
          added_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          word: string
          category?: string | null
          added_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          word?: string
          category?: string | null
          added_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          is_confirmed: boolean
          confirmation_token: string | null
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          id?: string
          email: string
          is_confirmed?: boolean
          confirmation_token?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          is_confirmed?: boolean
          confirmation_token?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      wins: {
        Row: {
          id: string
          user_id: string
          win_date: string
          script: string
          category: string
          wpm: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          win_date: string
          script: string
          category: string
          wpm: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          win_date?: string
          script?: string
          category?: string
          wpm?: number
          created_at?: string
        }
        Relationships: []
      }
      game_scores: {
        Row: {
          id: string
          user_id: string
          score: number
          level: number
          words_destroyed: number
          elapsed_seconds: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          score: number
          level: number
          words_destroyed: number
          elapsed_seconds?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          score?: number
          level?: number
          words_destroyed?: number
          elapsed_seconds?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      game_leaderboard: {
        Row: {
          username: string | null
          user_id: string
          max_score: number | null
          max_level: number | null
          max_words: number | null
        }
        Insert: never
        Update: never
        Relationships: []
      }
      game_personal_bests: {
        Row: {
          user_id: string
          best_score: number | null
          best_level: number | null
          elapsed_seconds: number | null
          words_destroyed: number | null
          created_at: string | null
        }
        Insert: never
        Update: never
        Relationships: []
      }
    }
    Functions: {
      ban_user: {
        Args: {
          p_admin_id: string
          p_user_id: string
          p_reason: string
        }
        Returns: void
      }
      unban_user: {
        Args: {
          p_admin_id: string
          p_user_id: string
        }
        Returns: void
      }
      get_db_size_mb: {
        Args: Record<string, never>
        Returns: number
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
