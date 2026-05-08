import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import { SadrzajTable } from './SadrzajTable'

export const metadata: Metadata = { title: 'Admin — Sadržaj' }

type TextRow = Database['public']['Tables']['text_pool']['Row']

export default async function AdminSadrzajPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('text_pool')
    .select('*')
    .order('created_at', { ascending: false })

  const texts = (data ?? []) as TextRow[]

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-[var(--foreground)]">Sadržaj</h1>
      <p className="mb-6 text-sm text-[var(--muted-foreground)]">
        {texts.length} tekstova u bazi
      </p>
      <SadrzajTable texts={texts} />
    </div>
  )
}
