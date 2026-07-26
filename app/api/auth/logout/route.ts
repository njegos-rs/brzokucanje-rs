import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = await createAdminClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    return NextResponse.json({ error: 'Odjava nije uspela.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}