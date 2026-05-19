import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { KorisniciTable } from '@/components/admin/KorisniciTable'
import type { Database } from '@/lib/supabase/types'

export const metadata: Metadata = { title: 'Admin — Korisnici' }

type ProfileRow = Database['public']['Tables']['profiles']['Row']

export default async function AdminKorisniciPage() {
  const supabase = await createServiceClient()

  const { data } = await supabase
    .from('profiles')
    .select('id, username, email, created_at, is_admin, is_banned, ban_reason, current_streak, newsletter_subscribed')
    .order('created_at', { ascending: false })
    .limit(200)

  const profiles = (data ?? []) as Pick<ProfileRow,
    'id' | 'username' | 'email' | 'created_at' | 'is_admin' | 'is_banned' | 'ban_reason' | 'current_streak' | 'newsletter_subscribed'
  >[]

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
