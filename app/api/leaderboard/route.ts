import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const scripts = ['cirilica', 'latinica', 'latinica-bez-kvacica'] as const
const categories = ['reci', 'recenice', 'citati', 'price', 'vesti'] as const

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
  const categoryParam = searchParams.get('category') ?? 'reci'
  const period = searchParams.get('period') ?? 'daily'
  const limitParam = parseInt(searchParams.get('limit') ?? '10', 10)
  const limit = Math.min(Math.max(limitParam, 1), 100)

  if (!isScript(scriptParam) || !isCategory(categoryParam)) {
    return NextResponse.json({ error: 'Neispravni parametri' }, { status: 400 })
  }

  const script = scriptParam
  const category = categoryParam

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
