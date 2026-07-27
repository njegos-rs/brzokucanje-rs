import { notFound } from 'next/navigation'
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
  return {
    title: `RANK — ${SCRIPT_LABELS[pismo as Script]} | brzokucanje.rs`,
    robots: { index: false, follow: false },
  }
}

export default async function RankPismoPage({ params }: Props) {
  const { pismo } = await params

  if (!VALID_SCRIPTS.includes(pismo as Script)) notFound()

  const script = pismo as Script
  const today = getCurrentDateInAppTimeZone()
  const initialDailyText = getDailyTextData(script, today)

  let alreadyPlayed = false
  let userId = 'anonymous'

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      userId = user.id
      const serviceSupabase = await createServiceClient()
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
        .maybeSingle()

      alreadyPlayed = !!usedScore
    }
  } catch {
    alreadyPlayed = false
  }

  return (
    <RankClient
      pismo={script}
      userId={userId}
      alreadyPlayed={alreadyPlayed}
      initialDailyText={initialDailyText}
    />
  )
}

