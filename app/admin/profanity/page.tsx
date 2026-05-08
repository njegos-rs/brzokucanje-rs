import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import { ProfanityTable } from './ProfanityTable'

export const metadata: Metadata = { title: 'Admin — Profanity' }

type WordRow = Database['public']['Tables']['profanity_words']['Row']

export default async function AdminProfanityPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('profanity_words')
    .select('*')
    .order('created_at', { ascending: false })

  const words = (data ?? []) as WordRow[]

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-[var(--foreground)]">Profanity filter</h1>
      <p className="mb-6 text-sm text-[var(--muted-foreground)]">
        {words.length} reči u filteru
      </p>
      <ProfanityTable words={words} />
    </div>
  )
}
