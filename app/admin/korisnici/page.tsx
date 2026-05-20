import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { KorisniciTable } from '@/components/admin/KorisniciTable'
export const metadata: Metadata = { title: 'Admin — Korisnici' }

export default async function AdminKorisniciPage() {
  const supabase = await createServiceClient()

  const { data } = await supabase
    .from('profiles')
    .select('id, username, created_at, is_admin, is_banned, ban_reason, current_streak')
    .order('created_at', { ascending: false })
    .limit(200)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profiles = (data ?? []) as any[]

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-[var(--foreground)]">Korisnici</h1>
      <p className="mb-6 text-sm text-[var(--muted-foreground)]">
        {profiles.length} registrovanih korisnika
      </p>
      <KorisniciTable profiles={profiles} />
    </div>
  )
}
