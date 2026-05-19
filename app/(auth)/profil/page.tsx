import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { formatDistanceToNow } from 'date-fns'
import { sr } from 'date-fns/locale'
import { Flame, Trophy, Target, Clock, Medal } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'
import { LogoutButton } from './LogoutButton'
import { ProfilTabs } from './ProfilTabs'

interface PbRow {
  id: string
  script: string
  category: string
  game_mode: 'rank' | 'vezba'
  timer_seconds: number | null
  strict_mode: boolean
  level: string | null
  best_wpm: number
  best_accuracy: number
  best_score: number
}

export const metadata: Metadata = { title: 'Profil' }

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/prijava')

  const [profileRes, pbRes, scoresRes, winsRes, statsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('personal_bests' as 'scores')
      .select('id, script, category, game_mode, timer_seconds, strict_mode, level, best_wpm, best_accuracy, best_score')
      .eq('user_id', user.id)
      .order('best_score', { ascending: false }),
    supabase
      .from('scores')
      .select('wpm, accuracy, created_at, script, category, mode, level, timer_seconds, strict_mode')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('wins' as 'scores')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('scores')
      .select('duration_seconds')
      .eq('user_id', user.id),
  ])

  const { data: gamePb } = await supabase
    .from('game_scores')
    .select('score, level, elapsed_seconds, words_destroyed')
    .eq('user_id', user.id)
    .order('score', { ascending: false })
    .limit(1)
    .maybeSingle()

  type Profile = Database['public']['Tables']['profiles']['Row']
  const profile = profileRes.data as Profile | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pbs = ((pbRes.data ?? []) as any[]) as PbRow[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentScores = (scoresRes.data ?? []) as any[]
  const totalWins = winsRes.count ?? 0
  const allScores = statsRes.data ?? []
  const totalTests = allScores.length
  const totalMinutes = Math.round(allScores.reduce((a: number, s: { duration_seconds: number | null }) => a + (s.duration_seconds ?? 0), 0) / 60)

  // Rank PB-ovi — samo pismo, bez kategorije (ne otkrivamo šta je bio test)
  const rankPbs = pbs
    .filter((p) => p.game_mode === 'rank' || !p.game_mode)
    .sort((a, b) => b.best_score - a.best_score)

  // Vežba PB-ovi — sve kombinacije koje je korisnik odigrao
  const vezbaPbs = pbs
    .filter((p) => p.game_mode === 'vezba')
    .sort((a, b) => b.best_score - a.best_score)


  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)]/15 text-2xl font-bold text-[var(--accent)]">
            {(profile?.username ?? user.email ?? 'K')[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              {profile?.username ?? user.email?.split('@')[0]}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Član{' '}
              {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: sr })}
            </p>
          </div>
          <LogoutButton />
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
          <p className="font-mono text-2xl font-bold text-[var(--foreground)]">{profile?.current_streak ?? 0}</p>
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
        <ProfilTabs
          rankPbs={rankPbs}
          vezbaPbs={vezbaPbs}
          recentScores={recentScores}
          gamePb={gamePb}
        />
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <p className="text-[var(--muted-foreground)]">Još nema testova. Počni da vežbaš!</p>
          <a
            href="/vezbaj/latinica"
            className="mt-3 inline-block text-sm text-[var(--accent)] hover:opacity-80 transition-opacity"
          >
            Vežbaj →
          </a>
        </div>
      )}
    </div>
  )
}
