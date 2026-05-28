import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRequestOrigin } from '@/lib/site'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const code = searchParams.get('code')
  const origin = getRequestOrigin(request)

  if (token_hash && type === 'recovery') {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: 'recovery' })
    if (!error) {
      return NextResponse.redirect(`${origin}/reset-lozinke`)
    }
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/reset-lozinke`)
    }
  }

  return NextResponse.redirect(`${origin}/prijava?error=reset_link_expired`)
}
