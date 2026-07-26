import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { sr } from 'date-fns/locale'
import { Flame, Target, Clock, Medal, type LucideIcon } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'
import { ProfilTabs } from './ProfilTabs'
import { TrophyStatCard } from '@/components/profile/TrophyStatCard'

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

export const metadata: Metadata = { title: 'Profil' }

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Ako nema sesije uopšte (čak ni anonimne), redirect na glavnu
  if (!user) redirect('/')

  const [profileRes, pbRes, scoresRes, winsRes, statsRes, titlesRes] = await Promise.all([
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
      .gt('wpm', 0)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('wins' as 'scores')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('scores')
      .select('duration_seconds, wpm, score')
      .eq('user_id', user.id),
    supabase
      .from('period_titles')
      .select('period_type')
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
  if (!profile?.username?.trim()) redirect('/')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pbs = ((pbRes.data ?? []) as any[]) as PbRow[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentScores = (scoresRes.data ?? []) as any[]
  const dailyWins = winsRes.count ?? 0
  const allScores = (statsRes.data ?? []) as CompletedScoreRow[]
  const completedScores = allScores.filter((score) => score.wpm > 0 && score.score > 0 && (score.duration_seconds ?? 0) > 0)
  const totalTests = completedScores.length
  const totalMinutes = Math.round(
    completedScores.reduce((sum, score) => sum + (score.duration_seconds ?? 0), 0) / 60,
  )
  const titles = (titlesRes.data ?? []) as PeriodTitleRow[]
  const weeklyTitles = titles.filter((title) => title.period_type === 'weekly').length
  const monthlyTitles = titles.filter((title) => title.period_type === 'monthly').length
  const yearlyTitles = titles.filter((title) => title.period_type === 'yearly').length

  const rankPbs = pbs
    .filter((p) => (p.game_mode === 'rank' || !p.game_mode) && p.best_score > 0 && p.best_wpm > 0)
    .sort((a, b) => b.best_score - a.best_score)

  const vezbaPbs = pbs
    .filter((p) => p.game_mode === 'vezba' && p.best_score > 0 && p.best_wpm > 0)
    .sort((a, b) => b.best_score - a.best_score)

  const displayName = profile.username

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)]/15 text-2xl font-bold text-[var(--accent)]">
            {displayName[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              {displayName}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Član{' '}
              {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: sr })}
            </p>
            {!profile?.username && (
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Odigraj partiju da postaviš ime koje će se prikazivati na rang listi.
              </p>
            )}
          </div>
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
          value={profile?.current_streak ?? 0}
          label="Streak dana"
          tooltip="Koliko dana zaredom si imao makar jedan važeći rank test."
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
        <ProfilTabs
          rankPbs={rankPbs}
          vezbaPbs={vezbaPbs}
          recentScores={recentScores}
          gamePb={gamePb}
        />
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <p className="text-[var(--muted-foreground)]">Još nema testova. Počni da vežbaš!</p>
          <Link
            href="/vezbaj/latinica"
            className="mt-3 inline-block text-sm text-[var(--accent)] transition-opacity hover:opacity-80"
          >
            Vežbaj →
          </Link>
        </div>
      )}
    </div>
  )
}
