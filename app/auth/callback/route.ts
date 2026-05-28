import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRequestOrigin } from '@/lib/site'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const origin = getRequestOrigin(request)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Password reset flow — next=/reset-lozinke, ne proveravaj username
      if (next === '/reset-lozinke') {
        return NextResponse.redirect(`${origin}/reset-lozinke`)
      }

      // Proveri da li OAuth korisnik već ima username u profiles tabeli
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()

        // Ako nema username → nova OAuth registracija, traži unos username-a
        if (!profile?.username) {
          return NextResponse.redirect(`${origin}/postavi-username`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/prijava?error=auth_callback_failed`)
}
