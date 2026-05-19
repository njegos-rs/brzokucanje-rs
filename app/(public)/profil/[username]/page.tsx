import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Flame, Trophy, Target, Clock, Medal } from 'lucide-react'
import { PublicProfilTabs } from './PublicProfilTabs'

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  return { title: `${username} | brzokucanje.rs` }
}

export default async function PublicProfilPage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, current_streak, longest_streak, created_at, is_banned')
    .eq('username', username)
    .maybeSingle()

  if (!profile || profile.is_banned) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pbRes, statsRes, winsRes, gamePbRes, recentRes] = await Promise.all([
    supabase
      .from('personal_bests' as 'scores')
      .select('id, script, category, game_mode, timer_seconds, strict_mode, level, best_wpm, best_accuracy, best_score')
      .eq('user_id', profile.id)
      .order('best_score', { ascending: false }),
    supabase
      .from('scores')
      .select('duration_seconds, wpm, mode')
      .eq('user_id', profile.id),
    supabase
      .from('wins' as 'scores')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id),
    supabase
      .from('game_scores')
      .select('score, level, elapsed_seconds, words_destroyed')
      .eq('user_id', profile.id)
      .order('score', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('scores')
      .select('wpm, accuracy, created_at, script, category, mode, level, timer_seconds, strict_mode')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pbs = ((pbRes.data ?? []) as any[])
  const allScores = statsRes.data ?? []
  const totalTests = allScores.length
  const totalMinutes = Math.round(
    allScores.reduce((a: number, s: { duration_seconds: number | null }) => a + (s.duration_seconds ?? 0), 0) / 60
  )
  const totalWins = winsRes.count ?? 0
  const gamePb = gamePbRes.data

  const rankPbs = pbs.filter((p) => (p.game_mode === 'rank' || !p.game_mode) && p.best_wpm > 0)
  const vezbaPbs = pbs.filter((p) => p.game_mode === 'vezba' && p.best_wpm > 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentScores = (recentRes.data ?? []) as any[]

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)]/15 text-2xl font-bold text-[var(--accent)]">
          {(profile.username ?? 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{profile.username ?? 'Nepoznat'}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Član od {new Date(profile.created_at).toLocaleDateString('sr-RS', { year: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* KPI kartice */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <Trophy className="mx-auto mb-2 h-5 w-5 text-yellow-500" />
          <p className="font-mono text-2xl font-bold text-yellow-500">{totalWins}</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">Pobeda #1</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <Target className="mx-auto mb-2 h-5 w-5 text-[var(--muted-foreground)]" />
          <p className="font-mono text-2xl font-bold text-[var(--foreground)]">{totalTests}</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">Testova</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <Flame className="mx-auto mb-2 h-5 w-5 text-orange-500" />
          <p className="font-mono text-2xl font-bold text-[var(--foreground)]">{profile.current_streak ?? 0}</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">Streak dana</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <Clock className="mx-auto mb-2 h-5 w-5 text-[var(--muted-foreground)]" />
          <p className="font-mono text-2xl font-bold text-[var(--foreground)]">{totalMinutes}</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">Minuta</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <Medal className="mx-auto mb-2 h-5 w-5 text-[var(--accent)]" />
          <p className="font-mono text-2xl font-bold text-[var(--accent)]">{gamePb ? gamePb.score.toLocaleString() : '—'}</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">Igrica skor</p>
        </div>
      </div>

      {/* Tabovi */}
      {(rankPbs.length > 0 || vezbaPbs.length > 0 || recentScores.length > 0 || gamePb) ? (
        <PublicProfilTabs rankPbs={rankPbs} vezbaPbs={vezbaPbs} recentScores={recentScores} gamePb={gamePb ?? null} />
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">Još nema rezultata.</p>
        </div>
      )}
    </div>
  )
}
