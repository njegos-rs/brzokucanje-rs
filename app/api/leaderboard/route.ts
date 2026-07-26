import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDayRangeInAppTimeZone } from '@/lib/date'

const scripts = ['cirilica', 'latinica', 'latinica-bez-kvacica'] as const
const categories = ['reci', 'recenice'] as const

type Script = (typeof scripts)[number]
type Category = (typeof categories)[number]
type LeaderboardScoreRow = {
  user_id: string
  wpm: number
  raw_wpm: number
  accuracy: number
  score: number
  created_at: string
  profiles: { username: string | null } | null
}
function isScript(value: string): value is Script {
  return scripts.includes(value as Script)
}

function isCategory(value: string): value is Category {
  return categories.includes(value as Category)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const scriptParam = searchParams.get('script') ?? 'latinica'
  const categoryParam = searchParams.get('category')
  const period = searchParams.get('period') ?? 'daily'
  const limitParam = parseInt(searchParams.get('limit') ?? '10', 10)
  const limit = Math.min(Math.max(limitParam, 1), 100)

  if (!isScript(scriptParam)) {
    return NextResponse.json({ error: 'Neispravni parametri' }, { status: 400 })
  }
  if (categoryParam && !isCategory(categoryParam)) {
    return NextResponse.json({ error: 'Neispravna kategorija' }, { status: 400 })
  }

  const script = scriptParam
  const category: Category | null = (categoryParam as Category) ?? null
  const supabase = await createClient()

  const { startIso, endIso } = getDayRangeInAppTimeZone()

  let data: unknown[] = []
  let error: { message: string } | null = null

  try {
    if (period === 'daily') {
      let q = supabase
        .from('v_daily_leaderboard' as 'scores')
        .select('id, user_id, username, wpm, raw_wpm, accuracy, score, created_at, daily_rank')
        .eq('script', script)
        .gte('created_at', startIso)
        .lt('created_at', endIso)
      if (category) q = q.eq('category', category) as typeof q
      const res = await q.order('daily_rank', { ascending: true }).limit(limit)
      data = (res.data ?? []) as unknown[]
      error = res.error
    } else if (period === 'weekly') {
      let q = supabase
        .from('v_weekly_leaderboard' as 'scores')
        .select('user_id, username, avg_wpm, avg_accuracy, active_days, total_days, period_score, period_rank')
        .eq('script', script)
      if (category) q = q.eq('category', category) as typeof q
      const res = await q.order('period_rank', { ascending: true }).limit(limit)
      data = (res.data ?? []) as unknown[]
      error = res.error
    } else if (period === 'monthly') {
      let q = supabase
        .from('v_monthly_leaderboard' as 'scores')
        .select('user_id, username, avg_wpm, avg_accuracy, active_days, total_days, period_score, period_rank')
        .eq('script', script)
      if (category) q = q.eq('category', category) as typeof q
      const res = await q.order('period_rank', { ascending: true }).limit(limit)
      data = (res.data ?? []) as unknown[]
      error = res.error
    } else if (period === 'yearly') {
      let q = supabase
        .from('v_yearly_leaderboard' as 'scores')
        .select('user_id, username, avg_wpm, avg_accuracy, active_days, total_days, period_score, period_rank')
        .eq('script', script)
      if (category) q = q.eq('category', category) as typeof q
      const res = await q.order('period_rank', { ascending: true }).limit(limit)
      data = (res.data ?? []) as unknown[]
      error = res.error
    } else {
      return NextResponse.json({ error: 'Nepoznat period' }, { status: 400 })
    }
  } catch {
    error = { message: 'View query failed' }
  }

  if (!error && period === 'daily' && data.length > 0) {
    const ids = data.flatMap((entry) => {
      if (!entry || typeof entry !== 'object' || !(entry as { id?: unknown }).id) return []
      return [(entry as { id: string }).id]
    })
    if (ids.length > 0) {
      const { data: deviceRows } = await supabase.from('scores').select('id, device_type').in('id', ids)
      const byId = new Map((deviceRows ?? []).map((row) => [row.id, row.device_type]))
      data = data.map((entry) => ({ ...(entry as object), device_type: byId.get((entry as { id: string }).id) ?? 'unknown' }))
    }
  }
  // Ako view ne postoji ili vrati grešku — direktan fallback na 'scores' tabelu!
  if (error || !data || data.length === 0) {
    try {
      let q = supabase
        .from('scores')
        .select('user_id, wpm, raw_wpm, accuracy, score, created_at, profiles(username)')
        .eq('script', script)
        .eq('mode', 'rank')

      if (category) q = q.eq('category', category)
      const { data: scoresData } = await q.order('score', { ascending: false }).limit(limit)

      if (scoresData && scoresData.length > 0) {
        data = (scoresData as unknown as LeaderboardScoreRow[])
          .filter((score) => score.profiles?.username?.trim())
          .map((s, idx) => ({
          user_id: s.user_id,
          username: s.profiles!.username!,
          wpm: s.wpm,
          raw_wpm: s.raw_wpm,
          accuracy: s.accuracy,
          score: s.score,
          created_at: s.created_at,
          daily_rank: idx + 1,
        }))
      } else {
        data = []
      }
    } catch {
      data = []
    }
  }

  data = (data ?? []).filter((entry) => {
    if (!entry || typeof entry !== 'object') return false
    const username = (entry as { username?: unknown }).username
    return typeof username === 'string' && username.trim().length > 0
  })

  return NextResponse.json({ data, period, script })
}

