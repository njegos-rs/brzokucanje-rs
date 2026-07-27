import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Flame, Target, Clock, Medal, type LucideIcon } from 'lucide-react'
import { PublicProfilTabs } from './PublicProfilTabs'
import { TrophyStatCard } from '@/components/profile/TrophyStatCard'

interface Props {
  params: Promise<{ username: string }>
}

interface CompletedScoreRow {
  duration_seconds: number | null
  wpm: number
  score: number
}

interface PeriodTitleRow {
  period_type: 'weekly' | 'monthly' | 'yearly'
}

interface StatCardProps {
  icon: LucideIcon
  iconClassName: string
  value: string | number
  label: string
  tooltip: string
}

function StatCard({ icon: Icon, iconClassName, value, label, tooltip }: StatCardProps) {
  return (
    <div
      title={tooltip}
      className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center"
    >
      <Icon className={`mx-auto mb-2 h-5 w-5 ${iconClassName}`} />
      <p className="font-mono text-2xl font-bold text-[var(--foreground)]">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">{label}</p>
    </div>
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const title = `${username} | brzokucanje.rs`
  const description = `Profil korisnika ${username} na brzokucanje.rs — lični rekord, statistike kucanja i rang pozicija.`
  return {
    title,
    description,
    alternates: {
      canonical: `https://brzokucanje.rs/profil/${username}`,
    },
    openGraph: {
      title,
      description,
      url: `https://brzokucanje.rs/profil/${username}`,
    },
  }
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

  const [pbRes, statsRes, winsRes, gamePbRes, recentRes, titlesRes] = await Promise.all([
    supabase
      .from('personal_bests' as 'scores')
      .select('id, script, category, game_mode, timer_seconds, strict_mode, level, best_wpm, best_accuracy, best_score')
      .eq('user_id', profile.id)
      .order('best_score', { ascending: false }),
    supabase
      .from('scores')
      .select('duration_seconds, wpm, score')
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
      .gt('wpm', 0)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('period_titles')
      .select('period_type')
      .eq('user_id', profile.id),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pbs = (pbRes.data ?? []) as any[]
  const allScores = (statsRes.data ?? []) as CompletedScoreRow[]
  const completedScores = allScores.filter((score) => score.wpm > 0 && score.score > 0 && (score.duration_seconds ?? 0) > 0)
  const totalTests = completedScores.length
  const totalMinutes = Math.round(
    completedScores.reduce((sum, score) => sum + (score.duration_seconds ?? 0), 0) / 60,
  )
  const dailyWins = winsRes.count ?? 0
  const titles = (titlesRes.data ?? []) as PeriodTitleRow[]
  const weeklyTitles = titles.filter((title) => title.period_type === 'weekly').length
  const monthlyTitles = titles.filter((title) => title.period_type === 'monthly').length
  const yearlyTitles = titles.filter((title) => title.period_type === 'yearly').length
  const gamePb = gamePbRes.data

  const rankPbs = pbs.filter((p) => (p.game_mode === 'rank' || !p.game_mode) && p.best_score > 0 && p.best_wpm > 0)
  const vezbaPbs = pbs.filter((p) => p.game_mode === 'vezba' && p.best_score > 0 && p.best_wpm > 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentScores = (recentRes.data ?? []) as any[]

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
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

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <TrophyStatCard
          daily={dailyWins}
          weekly={weeklyTitles}
          monthly={monthlyTitles}
          yearly={yearlyTitles}
        />
        <StatCard
          icon={Target}
          iconClassName="text-[var(--muted-foreground)]"
          value={totalTests}
          label="Testova"
          tooltip="Ukupan broj završenih i sačuvanih testova na ovom nalogu, uključujući rank i vežbu."
        />
        <StatCard
          icon={Flame}
          iconClassName="text-orange-500"
          value={profile.current_streak ?? 0}
          label="Streak dana"
          tooltip="Koliko dana zaredom je korisnik imao makar jedan važeći rank test."
        />
        <StatCard
          icon={Clock}
          iconClassName="text-[var(--muted-foreground)]"
          value={totalMinutes}
          label="Minuta"
          tooltip="Ukupno vreme provedeno u završenim testovima, sabrano iz trajanja svake partije."
        />
        <StatCard
          icon={Medal}
          iconClassName="text-[var(--accent)]"
          value={gamePb ? gamePb.score.toLocaleString() : '—'}
          label="Igrica skor"
          tooltip="Najbolji postignuti skor u igrici."
        />
      </div>

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
