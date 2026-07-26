import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { StatsCharts } from './StatsCharts'

export const metadata: Metadata = { title: 'Admin — Statistike' }

export default async function AdminStatistikePage() {
  const supabase = await createServiceClient()

  const now = new Date()
  const days30ago = new Date(now)
  days30ago.setDate(days30ago.getDate() - 29)
  const from = days30ago.toISOString().slice(0, 10)

  const [scoresRes, usersRes, scriptRes, categoryRes] = await Promise.all([
    supabase
      .from('scores')
      .select('created_at, wpm, mode, script')
      .gte('created_at', `${from}T00:00:00`)
      .order('created_at', { ascending: true }),
    supabase
      .from('profiles')
      .select('created_at')
      .not('username', 'is', null)
      .neq('username', '')
      .gte('created_at', `${from}T00:00:00`)
      .order('created_at', { ascending: true }),
    supabase
      .from('scores')
      .select('script')
      .gte('created_at', `${from}T00:00:00`),
    supabase
      .from('scores')
      .select('category')
      .gte('created_at', `${from}T00:00:00`),
  ])

  const scores = scoresRes.data ?? []
  const users = usersRes.data ?? []

  // Grupiši testove po danu
  const testsByDay: Record<string, { vezba: number; rank: number }> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(days30ago)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    testsByDay[key] = { vezba: 0, rank: 0 }
  }
  for (const s of scores) {
    const day = s.created_at.slice(0, 10)
    if (testsByDay[day]) {
      if (s.mode === 'rank') testsByDay[day].rank++
      else testsByDay[day].vezba++
    }
  }

  // Grupiši registracije po danu
  const regsByDay: Record<string, number> = {}
  for (const key of Object.keys(testsByDay)) regsByDay[key] = 0
  for (const u of users) {
    const day = u.created_at.slice(0, 10)
    if (regsByDay[day] !== undefined) regsByDay[day]++
  }

  // Prosečni WPM po danu (samo rank)
  const wpmByDay: Record<string, number[]> = {}
  for (const s of scores) {
    if (s.mode !== 'rank') continue
    const day = s.created_at.slice(0, 10)
    if (!wpmByDay[day]) wpmByDay[day] = []
    wpmByDay[day].push(s.wpm)
  }

  // Script distribucija
  const scriptCount: Record<string, number> = {}
  for (const s of scriptRes.data ?? []) {
    scriptCount[s.script] = (scriptCount[s.script] ?? 0) + 1
  }

  // Category distribucija
  const categoryCount: Record<string, number> = {}
  for (const s of categoryRes.data ?? []) {
    categoryCount[s.category] = (categoryCount[s.category] ?? 0) + 1
  }

  const dailyData = Object.entries(testsByDay).map(([date, counts]) => ({
    date: date.slice(5), // MM-DD
    vezba: counts.vezba,
    rank: counts.rank,
    registracije: regsByDay[date] ?? 0,
    avgWpm: wpmByDay[date]
      ? Math.round(wpmByDay[date].reduce((a, b) => a + b, 0) / wpmByDay[date].length)
      : null,
  }))

  const scriptData = Object.entries(scriptCount).map(([name, value]) => ({ name, value }))
  const categoryData = Object.entries(categoryCount).map(([name, value]) => ({ name, value }))

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-[var(--foreground)]">Statistike</h1>
      <p className="mb-8 text-sm text-[var(--muted-foreground)]">Poslednjih 30 dana</p>
      <StatsCharts
        dailyData={dailyData}
        scriptData={scriptData}
        categoryData={categoryData}
      />
    </div>
  )
}
