import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const script = searchParams.get('script') ?? 'latinica'
  const category = searchParams.get('category') ?? 'reci'
  const period = searchParams.get('period') ?? 'daily'
  const limitParam = parseInt(searchParams.get('limit') ?? '10', 10)
  const limit = Math.min(Math.max(limitParam, 1), 100)

  const supabase = await createClient()

  const today = new Date().toISOString().slice(0, 10)
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const monthStart = new Date()
  monthStart.setDate(1)

  let data: unknown[] = []
  let error: { message: string } | null = null

  if (period === 'daily') {
    const res = await supabase
      .from('v_daily_leaderboard' as 'scores')
      .select('user_id, username, wpm, raw_wpm, accuracy, score, created_at, daily_rank')
      .eq('script', script)
      .eq('category', category)
      .gte('created_at', `${today}T00:00:00`)
      .order('daily_rank', { ascending: true })
      .limit(limit)
    data = (res.data ?? []) as unknown[]
    error = res.error
  } else if (period === 'weekly') {
    const res = await supabase
      .from('v_weekly_leaderboard' as 'scores')
      .select('user_id, username, wpm, score, accuracy, test_count, weekly_rank')
      .eq('script', script)
      .eq('category', category)
      .gte('created_at', weekStart.toISOString())
      .order('weekly_rank', { ascending: true })
      .limit(limit)
    data = (res.data ?? []) as unknown[]
    error = res.error
  } else if (period === 'monthly') {
    const res = await supabase
      .from('v_monthly_leaderboard' as 'scores')
      .select('user_id, username, wpm, score, accuracy, test_count, monthly_rank')
      .eq('script', script)
      .eq('category', category)
      .gte('created_at', monthStart.toISOString())
      .order('monthly_rank', { ascending: true })
      .limit(limit)
    data = (res.data ?? []) as unknown[]
    error = res.error
  } else {
    return NextResponse.json({ error: 'Nepoznat period' }, { status: 400 })
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, period, script, category })
}
