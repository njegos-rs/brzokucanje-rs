import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { KorisniciTable, type AdminUserRow } from '@/components/admin/KorisniciTable'

export const metadata: Metadata = { title: 'Admin — Korisnici' }

type ProfileRow = {
  id: string
  username: string | null
  created_at: string
  updated_at: string
  last_active_date: string | null
  current_streak: number
  longest_streak: number
  is_admin: boolean
  is_banned: boolean
  ban_reason: string | null
}

type ScoreAggRow = {
  user_id: string
  wpm: number
  mode: string
  is_flagged: boolean
  created_at: string
}

type GameAggRow = {
  user_id: string
  score: number
  created_at: string
}

export default async function AdminKorisniciPage() {
  const supabase = await createServiceClient()

  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, username, created_at, updated_at, last_active_date, is_admin, is_banned, ban_reason, current_streak, longest_streak')
    .not('username', 'is', null)
    .neq('username', '')
    .order('created_at', { ascending: false })
    .limit(200)

  const profiles = (profilesData ?? []) as ProfileRow[]
  const userIds = profiles.map((profile) => profile.id)

  const [scoresRes, gamesRes] = userIds.length
    ? await Promise.all([
        supabase
          .from('scores')
          .select('user_id, wpm, mode, is_flagged, created_at')
          .in('user_id', userIds),
        supabase
          .from('game_scores')
          .select('user_id, score, created_at')
          .in('user_id', userIds),
      ])
    : [{ data: [] }, { data: [] }]

  const scoreAgg = new Map<string, {
    totalTests: number
    rankTests: number
    practiceTests: number
    bestWpm: number
    wpmSum: number
    flaggedCount: number
    lastTestAt: string | null
  }>()

  for (const score of (scoresRes.data ?? []) as ScoreAggRow[]) {
    const agg = scoreAgg.get(score.user_id) ?? {
      totalTests: 0,
      rankTests: 0,
      practiceTests: 0,
      bestWpm: 0,
      wpmSum: 0,
      flaggedCount: 0,
      lastTestAt: null,
    }
    agg.totalTests++
    if (score.mode === 'rank') agg.rankTests++
    if (score.mode === 'vezba') agg.practiceTests++
    agg.bestWpm = Math.max(agg.bestWpm, Number(score.wpm) || 0)
    agg.wpmSum += Number(score.wpm) || 0
    if (score.is_flagged) agg.flaggedCount++
    if (!agg.lastTestAt || score.created_at > agg.lastTestAt) agg.lastTestAt = score.created_at
    scoreAgg.set(score.user_id, agg)
  }

  const gameAgg = new Map<string, { gameAttempts: number; bestGameScore: number; lastGameAt: string | null }>()
  for (const game of (gamesRes.data ?? []) as GameAggRow[]) {
    const agg = gameAgg.get(game.user_id) ?? { gameAttempts: 0, bestGameScore: 0, lastGameAt: null }
    agg.gameAttempts++
    agg.bestGameScore = Math.max(agg.bestGameScore, Number(game.score) || 0)
    if (!agg.lastGameAt || game.created_at > agg.lastGameAt) agg.lastGameAt = game.created_at
    gameAgg.set(game.user_id, agg)
  }

  const rows: AdminUserRow[] = profiles.map((profile) => {
    const scores = scoreAgg.get(profile.id)
    const games = gameAgg.get(profile.id)
    const avgWpm = scores?.totalTests ? Math.round(scores.wpmSum / scores.totalTests) : 0
    const lastActivityAt = [scores?.lastTestAt, games?.lastGameAt, profile.last_active_date, profile.updated_at]
      .filter((value): value is string => !!value)
      .sort()
      .at(-1) ?? profile.created_at

    return {
      ...profile,
      totalTests: scores?.totalTests ?? 0,
      rankTests: scores?.rankTests ?? 0,
      practiceTests: scores?.practiceTests ?? 0,
      bestWpm: Math.round(scores?.bestWpm ?? 0),
      avgWpm,
      flaggedCount: scores?.flaggedCount ?? 0,
      lastTestAt: scores?.lastTestAt ?? null,
      gameAttempts: games?.gameAttempts ?? 0,
      bestGameScore: games?.bestGameScore ?? 0,
      lastGameAt: games?.lastGameAt ?? null,
      lastActivityAt,
    }
  })

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-[var(--foreground)]">Korisnici</h1>
      <p className="mb-6 text-sm text-[var(--muted-foreground)]">
        {rows.length} korisnika sa postavljenim username-om
      </p>
      <KorisniciTable profiles={rows} />
    </div>
  )
}
