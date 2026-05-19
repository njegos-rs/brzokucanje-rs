import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDayRangeInAppTimeZone } from '@/lib/date'

const scripts = ['cirilica', 'latinica', 'latinica-bez-kvacica'] as const
const categories = ['reci', 'recenice'] as const

type Script = (typeof scripts)[number]
type Category = (typeof categories)[number]

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

  if (period === 'daily') {
    let q = supabase
      .from('v_daily_leaderboard' as 'scores')
      .select('user_id, username, wpm, raw_wpm, accuracy, score, created_at, daily_rank')
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, period, script })
}
