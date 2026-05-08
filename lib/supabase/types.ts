// Auto-generated tip: npx supabase gen types typescript --project-id izdfrplpkrxjqlkwrbgd > lib/supabase/types.ts
// Ručno prošireno da odražava sve kolone iz migracija 001-007

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
          username: string
          email: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          is_admin: boolean
          is_banned: boolean
          ban_reason: string | null
          banned_at: string | null
          banned_by: string | null
          daily_limit_override: number | null
          streak_current: number
          streak_longest: number
          last_test_date: string | null
          newsletter_subscribed: boolean
          settings: Json | null
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      scores: {
        Row: {
          id: string
          user_id: string
          category: 'reci' | 'recenice' | 'citati' | 'price' | 'vesti'
          script: 'cirilica' | 'latinica' | 'easy'
          mode: 'vezba' | 'rank'
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
          reviewed_by: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
          text_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['scores']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['scores']['Insert']>
      }
      personal_bests: {
        Row: {
          id: string
          user_id: string
          category: string
          script: string
          best_wpm: number
          best_score: number
          best_accuracy: number
          achieved_at: string
          score_id: string
        }
        Insert: Omit<Database['public']['Tables']['personal_bests']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['personal_bests']['Insert']>
      }
      text_pool: {
        Row: {
          id: string
          content_lat: string
          content_cyr: string
          content_easy: string
          category: string
          source: string | null
          difficulty: 'lake' | 'srednje' | 'teske' | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['text_pool']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['text_pool']['Insert']>
      }
      daily_texts: {
        Row: {
          id: string
          date: string
          script: 'cirilica' | 'latinica' | 'easy'
          category: string
          text_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['daily_texts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['daily_texts']['Insert']>
      }
      profanity_words: {
        Row: {
          id: string
          word: string
          category: string | null
          added_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profanity_words']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['profanity_words']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['admin_actions']['Row'], 'id' | 'created_at'>
        Update: never
      }
    }
    Views: {
      v_daily_leaderboard: {
        Row: {
          id: string
          user_id: string
          username: string
          script: 'cirilica' | 'latinica' | 'easy'
          category: string
          wpm: number
          raw_wpm: number
          accuracy: number
          score: number
          created_at: string
          daily_rank: number
        }
      }
      v_weekly_leaderboard: {
        Row: {
          user_id: string
          username: string
          script: 'cirilica' | 'latinica' | 'easy'
          category: string
          wpm: number
          score: number
          accuracy: number
          test_count: number
          weekly_rank: number
        }
      }
      v_monthly_leaderboard: {
        Row: {
          user_id: string
          username: string
          script: 'cirilica' | 'latinica' | 'easy'
          category: string
          wpm: number
          score: number
          accuracy: number
          test_count: number
          monthly_rank: number
        }
      }
    }
    Functions: {
      ban_user: {
        Args: { p_admin_id: string; p_user_id: string; p_reason: string }
        Returns: void
      }
      unban_user: {
        Args: { p_admin_id: string; p_user_id: string }
        Returns: void
      }
      generate_daily_texts: {
        Args: { p_date?: string }
        Returns: void
      }
    }
    Enums: Record<string, never>
  }
}
