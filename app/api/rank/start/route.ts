import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import { getDayRangeInAppTimeZone } from '@/lib/date'

type ScoreInsert = Database['public']['Tables']['scores']['Insert']

interface StartPayload {
  category: 'reci' | 'recenice'
  script: 'cirilica' | 'latinica' | 'latinica-bez-kvacica'
  text_id?: string
}

const VALID_CATEGORIES = new Set<StartPayload['category']>(['reci', 'recenice'])
const VALID_SCRIPTS = new Set<StartPayload['script']>(['cirilica', 'latinica', 'latinica-bez-kvacica'])

function normalizeTextId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > 120) return null
  return trimmed
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Niste prijavljeni' }, { status: 401 })
  }

  let body: StartPayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Neispravan zahtev' }, { status: 400 })
  }

  const { category, script, text_id } = body

  if (!VALID_CATEGORIES.has(category) || !VALID_SCRIPTS.has(script)) {
    return NextResponse.json({ error: 'Neispravni parametri' }, { status: 400 })
  }

  const insert: ScoreInsert = {
    user_id: user.id,
    category: category as ScoreInsert['category'],
    script: script as ScoreInsert['script'],
    mode: 'rank',
    wpm: 0,
    raw_wpm: 0,
    accuracy: 0,
    consistency: 0,
    score: 0,
    duration_seconds: 0,
    correct_chars: 0,
    total_chars: 0,
    errors: 0,
    keystroke_log: [] as unknown as import('@/lib/supabase/types').Json,
    is_flagged: false,
    text_id: normalizeTextId(text_id),
  }

  // Ovo kreira pokušaj. Ako pokušaj već postoji za danas, jedinstveni indeks će baciti grešku 23505.
  const { data, error } = await supabase.from('scores').insert(insert).select('id').single()

  if (error) {
    if (error.code === '23505') {
      // Proveri da li je postojeći score napušten (wpm=0) — ako jeste, obrisi ga i pokusaj ponovo
      const { startIso, endIso } = getDayRangeInAppTimeZone()

      const { data: existing } = await supabase
        .from('scores')
        .select('id, wpm')
        .eq('user_id', user.id)
        .eq('script', script)
        .eq('category', category)
        .eq('mode', 'rank')
        .gte('created_at', startIso)
        .lt('created_at', endIso)
        .single()

      if (existing && existing.wpm === 0) {
        await supabase.from('personal_bests').delete().eq('score_id', existing.id)
        await supabase.from('scores').delete().eq('id', existing.id)
        const { data: retry, error: retryError } = await supabase
          .from('scores')
          .insert(insert)
          .select('id')
          .single()
        if (retryError) return NextResponse.json({ error: retryError.message }, { status: 500 })
        return NextResponse.json({ id: retry.id })
      }

      return NextResponse.json(
        { error: 'Već ste iskoristili dnevni pokušaj za ovu kategoriju i pismo.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id })
}
