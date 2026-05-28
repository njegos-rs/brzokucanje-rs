import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { RankClient } from './RankClient'
import { getDailyTextData } from '@/lib/words/daily'
import { getCurrentDateInAppTimeZone, getDayRangeInAppTimeZone } from '@/lib/date'

type Script = 'latinica' | 'cirilica' | 'latinica-bez-kvacica'
const VALID_SCRIPTS: Script[] = ['latinica', 'cirilica', 'latinica-bez-kvacica']

const SCRIPT_LABELS: Record<Script, string> = {
  latinica: 'Latinica',
  cirilica: 'Ćirilica',
  'latinica-bez-kvacica': 'Latinica bez kvačica',
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
  const serviceSupabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/prijava')

  const script = pismo as Script

  // Koristimo Beograd timezone da se poklopi sa unique indexom u bazi
  const today = getCurrentDateInAppTimeZone()
  const { startIso, endIso } = getDayRangeInAppTimeZone()

  const { data: usedScore } = await serviceSupabase
    .from('scores')
    .select('id')
    .eq('user_id', user.id)
    .eq('script', script)
    .eq('mode', 'rank')
    .gt('wpm', 0)
    .gte('created_at', startIso)
    .lt('created_at', endIso)
    .limit(1)
    .single()

  const alreadyPlayed = !!usedScore

  // Učitavamo dnevni tekst odmah na serveru da sprečimo treperenje i odlaganje
  const initialDailyText = getDailyTextData(script, today)

  return (
    <RankClient
      pismo={script}
      userId={user.id}
      alreadyPlayed={alreadyPlayed}
      initialDailyText={initialDailyText}
    />
  )
}
