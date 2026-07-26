import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'

const ADMIN_COOKIE_NAME = 'brzokucanje-admin-auth'

export async function createAdminClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder'

  return createServerClient<Database>(url, key, {
    cookieOptions: { name: ADMIN_COOKIE_NAME },
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { /* middleware refreshes server components */ }
      },
    },
  })
}

export { ADMIN_COOKIE_NAME }