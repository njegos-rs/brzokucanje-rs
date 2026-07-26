import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { analyzeKeystrokes, serverSideCheck } from '@/lib/typing/anti-cheat'
import { calcAll } from '@/lib/typing/scoring'
import type { KeystrokeEntry } from '@/lib/typing/engine'
import type { Database } from '@/lib/supabase/types'
import { detectDevice } from '@/lib/device/server'

type ScoreInsert = Database['public']['Tables']['scores']['Insert']

interface ScorePayload {
  id?: string
  category: 'reci' | 'recenice'
  script: 'cirilica' | 'latinica' | 'latinica-bez-kvacica'
  mode: 'vezba' | 'rank'
  duration_seconds: number
  correct_chars: number
  total_chars: number
  errors: number
  keystroke_log: KeystrokeEntry[]
  text_id?: string
  timer_seconds?: number | null
  strict_mode?: boolean
  level?: string | null
}

const VALID_CATEGORIES = new Set<ScorePayload['category']>(['reci', 'recenice'])
const VALID_SCRIPTS = new Set<ScorePayload['script']>(['cirilica', 'latinica', 'latinica-bez-kvacica'])
const VALID_MODES = new Set<ScorePayload['mode']>(['vezba', 'rank'])
const VALID_LEVELS = new Set(['easy', 'medium', 'hard', 'expert'])

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0
}

function isKeystrokeEntry(value: unknown): value is KeystrokeEntry {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.char === 'string' &&
    isFiniteNumber(item.ts) &&
    item.ts >= 0 &&
    (item.action === 'correct' || item.action === 'incorrect' || item.action === 'backspace')
  )
}

function normalizeTextId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > 120) return null
  return trimmed
}

function normalizeAttemptId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  return /^[0-9a-f-]{36}$/i.test(value) ? value : null
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

  let body: ScorePayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Neispravan zahtev' }, { status: 400 })
  }

  const {
    id,
    category,
    script,
    mode,
    duration_seconds,
    correct_chars,
    total_chars,
    errors,
    keystroke_log,
    text_id,
    timer_seconds,
    strict_mode,
    level,
  } = body

  if (!VALID_CATEGORIES.has(category) || !VALID_SCRIPTS.has(script) || !VALID_MODES.has(mode)) {
    return NextResponse.json({ error: 'Neispravni parametri' }, { status: 400 })
  }

  if (mode === 'rank') {
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.username?.trim()) {
      return NextResponse.json({ error: 'Prvo izaberite svoje ime' }, { status: 403 })
    }
  }

  if (
    !isFiniteNumber(duration_seconds) ||
    duration_seconds <= 0 ||
    duration_seconds > 600 ||
    !isNonNegativeInteger(correct_chars) ||
    !isNonNegativeInteger(total_chars) ||
    !isNonNegativeInteger(errors)
  ) {
    return NextResponse.json({ error: 'Neispravni rezultati testa' }, { status: 400 })
  }

  const attemptId = normalizeAttemptId(id)
  if (mode === 'rank' && !attemptId) {
    return NextResponse.json({ error: 'Nedostaje attempt id za rank test' }, { status: 400 })
  }

  if (!Array.isArray(keystroke_log) || keystroke_log.length === 0) {
    return NextResponse.json({ error: 'Keystroke log je obavezan' }, { status: 400 })
  }

  const keystrokes = keystroke_log.filter(isKeystrokeEntry)
  if (keystrokes.length !== keystroke_log.length) {
    return NextResponse.json({ error: 'Neispravan keystroke log' }, { status: 400 })
  }

  const insertKs = keystrokes.filter((k) => k.action === 'correct' || k.action === 'incorrect')
  const derivedCorrectChars = insertKs.filter((k) => k.action === 'correct').length
  const derivedTotalChars = insertKs.length
  const derivedErrors = insertKs.filter((k) => k.action === 'incorrect').length

  if (
    derivedCorrectChars !== correct_chars ||
    derivedTotalChars !== total_chars ||
    derivedErrors !== errors ||
    derivedCorrectChars > derivedTotalChars
  ) {
    return NextResponse.json({ error: 'Rezultat nije usklađen sa keystroke logom' }, { status: 422 })
  }

  const durationMs = Math.round(duration_seconds * 1000)
  const intervals: number[] = []
  for (let i = 1; i < insertKs.length; i++) {
    const diff = insertKs[i].ts - insertKs[i - 1].ts
    if (diff > 0 && diff < 2000) intervals.push(diff)
  }

  const serverResult = calcAll({
    correctChars: derivedCorrectChars,
    allChars: derivedTotalChars,
    errors: derivedErrors,
    durationMs,
    intervals,
  })

  const serverWpm = Math.round(serverResult.wpm)

  const wpmLimit =
    derivedTotalChars < 20 ? 350 :
    derivedTotalChars < 60 ? 280 :
    derivedTotalChars < 150 ? 230 : 180

  if (serverWpm > wpmLimit) {
    return NextResponse.json({ error: 'WPM prelazi dozvoljenu granicu' }, { status: 422 })
  }

  const acFlags = analyzeKeystrokes(keystrokes, serverWpm)
  const srFlags = serverSideCheck(serverWpm, serverResult.accuracy)
  const allFlags = [...acFlags.flags, ...srFlags]
  const isFlagged = allFlags.length > 0

  const device = detectDevice(req)

  const insertData = {
    user_id: user.id,
    device_type: device.device_type,
    device_confidence: device.device_confidence,
    category: category as ScoreInsert['category'],
    script: script as ScoreInsert['script'],
    mode: mode as ScoreInsert['mode'],
    wpm: serverResult.wpm,
    raw_wpm: serverResult.rawWpm,
    accuracy: serverResult.accuracy,
    consistency: serverResult.consistency,
    score: serverResult.score,
    duration_seconds,
    correct_chars: derivedCorrectChars,
    total_chars: derivedTotalChars,
    errors: derivedErrors,
    keystroke_log: keystrokes as unknown as import('@/lib/supabase/types').Json,
    is_flagged: isFlagged,
    flag_reason: isFlagged ? allFlags.join(', ') : null,
    text_id: normalizeTextId(text_id),
    timer_seconds: typeof timer_seconds === 'number' ? timer_seconds : null,
    strict_mode: strict_mode === true,
    level: VALID_LEVELS.has(level ?? '') ? level : null,
  }

  let finalId = attemptId

  if (mode === 'rank' && attemptId) {
    const { data, error } = await serviceSupabase
      .from('scores')
      .update(insertData)
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (data) {
      finalId = data.id
    } else {
      // Placeholder nije pronađen — insert kao fallback
      const { data: inserted, error: insertError } = await serviceSupabase
        .from('scores')
        .insert(insertData)
        .select('id')
        .maybeSingle()

      if (insertError) {
        if (insertError.code === '23505') {
          return NextResponse.json(
            { error: 'Već ste iskoristili dnevni pokušaj za ovu kategoriju.' },
            { status: 409 },
          )
        }
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
      finalId = inserted?.id ?? null
    }
  } else {
    const { data, error } = await serviceSupabase
      .from('scores')
      .insert(insertData)
      .select('id')
      .maybeSingle()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Već ste iskoristili dnevni pokušaj za ovu kategoriju.' },
          { status: 409 },
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    finalId = data?.id ?? null
  }

  const { data: pbData } = await serviceSupabase
    .from('personal_bests')
    .select('best_score')
    .eq('user_id', user.id)
    .eq('category', category)
    .eq('script', script)
    .maybeSingle()

  const isNewPb = !pbData || serverResult.score > pbData.best_score

  return NextResponse.json({
    id: finalId,
    wpm: serverResult.wpm,
    raw_wpm: serverResult.rawWpm,
    accuracy: serverResult.accuracy,
    consistency: serverResult.consistency,
    score: serverResult.score,
    is_flagged: isFlagged,
    flags: allFlags,
    is_new_pb: isNewPb,
    device_type: device.device_type,
  })
}
