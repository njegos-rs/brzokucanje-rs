import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import { getDayRangeInAppTimeZone } from '@/lib/date'
import { detectDevice } from '@/lib/device/server'

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
  const serviceSupabase = await createServiceClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Niste prijavljeni' }, { status: 401 })
  }

  const { data: profile } = await serviceSupabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.username?.trim()) {
    return NextResponse.json({ error: 'Prvo izaberite svoje ime' }, { status: 403 })
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

  const { startIso, endIso } = getDayRangeInAppTimeZone()

  const { data: existingToday, error: existingError } = await serviceSupabase
    .from('scores')
    .select('id, wpm, score')
    .eq('user_id', user.id)
    .eq('script', script)
    .eq('category', category)
    .eq('mode', 'rank')
    .gte('created_at', startIso)
    .lt('created_at', endIso)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }

  if (existingToday) {
    if (existingToday.wpm > 0 || existingToday.score > 0) {
      return NextResponse.json(
        { error: 'Već ste iskoristili dnevni pokušaj za ovu kategoriju i pismo.' },
        { status: 409 },
      )
    }

    // Placeholder pokušaj već postoji za danas; nastavljamo sa njim.
    return NextResponse.json({ id: existingToday.id })
  }

  const device = detectDevice(req)

  const insert: ScoreInsert = {
    user_id: user.id,
    device_type: device.device_type,
    device_confidence: device.device_confidence,
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

  const { data, error } = await serviceSupabase.from('scores').insert(insert).select('id').single()

  if (error) {
    if (error.code === '23505') {
      const { data: fallbackExisting, error: fallbackError } = await serviceSupabase
        .from('scores')
        .select('id, wpm, score')
        .eq('user_id', user.id)
        .eq('script', script)
        .eq('category', category)
        .eq('mode', 'rank')
        .gte('created_at', startIso)
        .lt('created_at', endIso)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 })
      }

      if (fallbackExisting && fallbackExisting.wpm === 0 && fallbackExisting.score === 0) {
        return NextResponse.json({ id: fallbackExisting.id })
      }

      return NextResponse.json(
        { error: 'Već ste iskoristili dnevni pokušaj za ovu kategoriju i pismo.' },
        { status: 409 },
      )
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id })
}
