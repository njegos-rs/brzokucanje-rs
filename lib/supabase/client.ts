import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/types'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder'

  return createBrowserClient<Database>(url, key)
}
