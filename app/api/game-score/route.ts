import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectDevice } from '@/lib/device/server'

function isSafeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.username?.trim()) {
    return NextResponse.json({ error: 'Prvo izaberite svoje ime' }, { status: 403 })
  }

  let body: { score: unknown; level: unknown; words_destroyed: unknown; elapsed_seconds: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { score, level, words_destroyed, elapsed_seconds } = body
  if (
    !isSafeNumber(score) ||
    !isSafeNumber(level) ||
    !isSafeNumber(words_destroyed) ||
    !isSafeNumber(elapsed_seconds)
  ) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  if (
    !Number.isInteger(score) ||
    !Number.isInteger(level) ||
    !Number.isInteger(words_destroyed) ||
    score < 0 ||
    score > 1_000_000_000 ||
    level < 1 ||
    level > 10_000 ||
    words_destroyed < 0 ||
    words_destroyed > 1_000_000 ||
    elapsed_seconds <= 0 ||
    elapsed_seconds > 86_400
  ) {
    return NextResponse.json({ error: 'Out of range' }, { status: 422 })
  }

  const device = detectDevice(req)

  const { error } = await supabase.from('game_scores').insert({
    user_id: user.id,
    device_type: device.device_type,
    device_confidence: device.device_confidence,
    score,
    level,
    words_destroyed,
    elapsed_seconds,
  })

  if (error) {
    console.error('Error saving game score:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_leaderboard')
    .select('username, user_id, max_score, max_level')
    .order('max_score', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching game leaderboard:', error.message)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }

  let leaderboard = (data ?? []).filter((entry) => entry.username?.trim())

  if (leaderboard.length > 0) {
    const userIds = leaderboard.map((l) => l.user_id).filter((id): id is string => Boolean(id))
    if (userIds.length > 0) {
      const { data: gameDeviceRows } = await supabase
        .from('game_scores')
        .select('user_id, device_type, score')
        .in('user_id', userIds)
        .order('score', { ascending: false })

      const byUser = new Map<string, string>()
      for (const row of gameDeviceRows ?? []) {
        if (!byUser.has(row.user_id)) {
          byUser.set(row.user_id, row.device_type)
        }
      }

      leaderboard = leaderboard.map((entry) => ({
        ...entry,
        device_type: ((entry.user_id ? byUser.get(entry.user_id) : 'unknown') ?? 'unknown') as 'mobile' | 'tablet' | 'desktop' | 'unknown',
      }))
    }
  }

  const { data: { user } } = await supabase.auth.getUser()
  let userRank: number | null = null
  let userScore: number | null = null

  if (user) {
    const top = leaderboard
    const inTop10 = top.findIndex((d) => d.user_id === user.id)
    if (inTop10 !== -1) {
      userRank = inTop10 + 1
      userScore = top[inTop10].max_score
    } else {
      const { data: ownEntry } = await supabase
        .from('game_leaderboard')
        .select('user_id, username, max_score')
        .eq('user_id', user.id)
        .maybeSingle()

      if (ownEntry?.username?.trim()) {
        userScore = ownEntry.max_score

        const { count } = await supabase
          .from('game_leaderboard')
          .select('*', { count: 'exact', head: true })
          .gt('max_score', ownEntry.max_score)

        userRank = (count ?? 0) + 1
      }
    }
  }

  return NextResponse.json({
    leaderboard,
    currentUser: user ? { rank: userRank, score: userScore, userId: user.id } : null,
  })
}
