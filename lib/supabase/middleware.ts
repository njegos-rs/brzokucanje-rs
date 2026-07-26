import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/supabase/types'

const ADMIN_COOKIE_NAME = 'brzokucanje-admin-auth'

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder'

  const createSessionClient = (cookieName?: string) => createServerClient<Database>(url, key, {
    ...(cookieName ? { cookieOptions: { name: cookieName } } : {}),
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  await createSessionClient().auth.getUser()
  await createSessionClient(ADMIN_COOKIE_NAME).auth.getUser()
  return supabaseResponse
}