import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { RankClient } from './RankClient'

type Script = 'latinica' | 'cirilica' | 'easy'
const VALID_SCRIPTS: Script[] = ['latinica', 'cirilica', 'easy']

const SCRIPT_LABELS: Record<Script, string> = {
  latinica: 'Latinica',
  cirilica: 'Ćirilica',
  easy: 'Easy',
}

interface Props {
  params: Promise<{ pismo: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pismo } = await params
  if (!VALID_SCRIPTS.includes(pismo as Script)) return {}
  return { title: `RANK — ${SCRIPT_LABELS[pismo as Script]} | brzokucanje.rs` }
}

export default async function RankPismoPage({ params }: Props) {
  const { pismo } = await params

  if (!VALID_SCRIPTS.includes(pismo as Script)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/prijava')

  const script = pismo as Script
  const today = new Date().toISOString().slice(0, 10)

  // Proveri daily limit — koje kategorije su već iskorišćene danas
  const { data: usedScores } = await supabase
    .from('scores')
    .select('category')
    .eq('user_id', user.id)
    .eq('script', script)
    .eq('mode', 'rank')
    .gte('created_at', `${today}T00:00:00`)

  const usedCategories = new Set((usedScores ?? []).map((s) => s.category))

  return (
    <RankClient
      pismo={script}
      userId={user.id}
      usedCategories={Array.from(usedCategories)}
    />
  )
}
