import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    let body: { email?: string; password?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Neispravni podaci' }, { status: 400 })
    }

    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email i lozinka su obavezni.' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    if (!url || url.includes('placeholder') || url.includes('your-project')) {
      return NextResponse.json({ error: 'Supabase URL nije podešen u .env.local fajlu.' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      let msg = error.message
      if (msg.includes('Invalid login credentials')) {
        msg = 'Pogrešan email ili lozinka.'
      } else if (msg.includes('Email not confirmed')) {
        msg = 'Email adresa nije verifikovana.'
      } else if (msg.includes('Failed to fetch') || msg.includes('fetch')) {
        msg = 'Neuspešna veza ka Supabase serveru. Proverite da li je baza aktivna.'
      }
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    return NextResponse.json({ success: true, user: data.user })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Greška pri prijavljivanju.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
