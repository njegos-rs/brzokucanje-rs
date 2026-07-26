import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function requireAdmin() {
  const supabase = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'Niste prijavljeni' }, { status: 401 }) }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !profile?.is_admin) {
    return { user: null, error: NextResponse.json({ error: 'Nemate admin pristup' }, { status: 403 }) }
  }

  return { user, error: null }
}
