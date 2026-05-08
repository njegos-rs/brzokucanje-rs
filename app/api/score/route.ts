import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeKeystrokes, serverSideCheck } from '@/lib/typing/anti-cheat'
import { calcWpm, calcRawWpm } from '@/lib/typing/scoring'
import type { KeystrokeEntry } from '@/lib/typing/engine'
import type { Database } from '@/lib/supabase/types'

type ScoreInsert = Database['public']['Tables']['scores']['Insert']

interface ScorePayload {
  category: 'reci' | 'recenice' | 'citati' | 'price' | 'vesti'
  script: 'cirilica' | 'latinica' | 'easy'
  mode: 'vezba' | 'rank'
  wpm: number
  raw_wpm: number
  accuracy: number
  consistency: number
  score: number
  duration_seconds: number
  correct_chars: number
  total_chars: number
  errors: number
  keystroke_log: KeystrokeEntry[]
  text_id?: string
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Niste prijavljeni' }, { status: 401 })
  }

  let body: ScorePayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Neispravan zahtev' }, { status: 400 })
  }

  const {
    category, script, mode, accuracy, consistency, score,
    duration_seconds, correct_chars, total_chars, errors,
    keystroke_log, text_id,
  } = body

  // Server-side re-kalkulacija WPM (ne verujemo frontend brojevima)
  const keystrokes = Array.isArray(keystroke_log) ? keystroke_log : []
  const insertKs = keystrokes.filter((k) => k.action === 'correct' || k.action === 'incorrect')
  const durationMs = duration_seconds * 1000
  const serverWpm = Math.round(calcWpm(correct_chars, durationMs))
  const serverRaw = Math.round(calcRawWpm(insertKs.length, durationMs))

  // Sloj 1: max WPM
  if (serverWpm > 220) {
    return NextResponse.json({ error: 'WPM prelazi dozvoljenu granicu' }, { status: 422 })
  }

  const acFlags = analyzeKeystrokes(keystrokes, serverWpm)
  const srFlags = serverSideCheck(serverWpm, accuracy)
  const allFlags = [...acFlags.flags, ...srFlags]
  const isFlagged = allFlags.length > 0

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? null
  const userAgent = req.headers.get('user-agent') ?? null

  const insert: ScoreInsert = {
    user_id: user.id,
    category: category as ScoreInsert['category'],
    script: script as ScoreInsert['script'],
    mode: mode as ScoreInsert['mode'],
    wpm: serverWpm,
    raw_wpm: serverRaw,
    accuracy,
    consistency,
    score,
    duration_seconds,
    correct_chars,
    total_chars,
    errors,
    keystroke_log: keystrokes as unknown as import('@/lib/supabase/types').Json,
    is_flagged: isFlagged,
    flag_reason: isFlagged ? allFlags.join(', ') : null,
    flag_reviewed: false,
    review_decision: null,
    reviewed_by: null,
    text_id: text_id ?? null,
    ip_address: ip,
    user_agent: userAgent,
  }

  const { data, error } = await supabase.from('scores').insert(insert).select('id').single()

  if (error) {
    // UNIQUE constraint — daily limit dostignut
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Već ste iskoristili dnevni pokušaj za ovu kategoriju.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    id: data.id,
    wpm: serverWpm,
    raw_wpm: serverRaw,
    is_flagged: isFlagged,
    flags: allFlags,
  })
}
