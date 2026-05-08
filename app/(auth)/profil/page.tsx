import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { formatDistanceToNow } from 'date-fns'
import { sr } from 'date-fns/locale'
import { Flame, Trophy, Target, Clock } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type PersonalBest = Database['public']['Tables']['personal_bests']['Row']
type Score = Pick<Database['public']['Tables']['scores']['Row'], 'wpm' | 'accuracy' | 'created_at' | 'script' | 'category' | 'mode'>

export const metadata: Metadata = { title: 'Profil' }

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/prijava')

  const [profileRes, pbRes, scoresRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('personal_bests')
      .select('*')
      .eq('user_id', user.id)
      .order('best_wpm', { ascending: false }),
    supabase
      .from('scores')
      .select('wpm, accuracy, created_at, script, category, mode')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  type Profile = Database['public']['Tables']['profiles']['Row']
  const profile = profileRes.data as Profile | null
  const pbs = (pbRes.data ?? []) as PersonalBest[]
  const recentScores = (scoresRes.data ?? []) as Score[]

  const totalTests = recentScores.length
  const bestWpm = pbs.length > 0 ? Math.max(...pbs.map((p) => p.best_wpm)) : 0

  const SCRIPT_LABELS: Record<string, string> = { latinica: 'Latinica', cirilica: 'Ćirilica', easy: 'Easy' }
  const CATEGORY_LABELS: Record<string, string> = { reci: 'Reči', recenice: 'Rečenice', citati: 'Citati' }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)]/15 text-2xl font-bold text-[var(--accent)]">
            {(profile?.username ?? user.email ?? 'K')[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              {profile?.username ?? user.email?.split('@')[0]}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Član{' '}
              {formatDistanceToNow(new Date(user.created_at), {
                addSuffix: true,
                locale: sr,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* KPI kartice */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <Trophy className="mx-auto mb-2 h-5 w-5 text-[var(--accent)]" />
          <p className="font-mono text-2xl font-bold text-[var(--accent)]">{Math.round(bestWpm)}</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">Najbolji WPM</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <Target className="mx-auto mb-2 h-5 w-5 text-[var(--muted-foreground)]" />
          <p className="font-mono text-2xl font-bold text-[var(--foreground)]">{totalTests}</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">Testova</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <Flame className="mx-auto mb-2 h-5 w-5 text-orange-500" />
          <p className="font-mono text-2xl font-bold text-[var(--foreground)]">0</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">Streak dana</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <Clock className="mx-auto mb-2 h-5 w-5 text-[var(--muted-foreground)]" />
          <p className="font-mono text-2xl font-bold text-[var(--foreground)]">—</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">Minuta</p>
        </div>
      </div>

      {/* Lični rekordi */}
      {pbs.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Lični rekordi
          </h2>
          <div className="overflow-hidden rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <th className="px-4 py-2.5 text-left font-medium text-[var(--muted-foreground)]">Pismo</th>
                  <th className="px-4 py-2.5 text-left font-medium text-[var(--muted-foreground)]">Kategorija</th>
                  <th className="px-4 py-2.5 text-right font-mono font-medium text-[var(--muted-foreground)]">WPM</th>
                  <th className="px-4 py-2.5 text-right font-mono font-medium text-[var(--muted-foreground)]">Tačnost</th>
                </tr>
              </thead>
              <tbody className="bg-[var(--card)]">
                {pbs.map((pb) => (
                  <tr key={pb.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 text-[var(--foreground)]">
                      {SCRIPT_LABELS[pb.script] ?? pb.script}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">
                      {CATEGORY_LABELS[pb.category] ?? pb.category}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[var(--accent)]">
                      {Math.round(pb.best_wpm)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--foreground)]">
                      {Math.round(pb.best_accuracy)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Nedavni testovi */}
      {recentScores.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Nedavni testovi
          </h2>
          <div className="overflow-hidden rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <th className="px-4 py-2.5 text-left font-medium text-[var(--muted-foreground)]">Pismo</th>
                  <th className="px-4 py-2.5 text-right font-mono font-medium text-[var(--muted-foreground)]">WPM</th>
                  <th className="px-4 py-2.5 text-right font-mono font-medium text-[var(--muted-foreground)]">Tačnost</th>
                  <th className="px-4 py-2.5 text-right font-medium text-[var(--muted-foreground)]">Kad</th>
                </tr>
              </thead>
              <tbody className="bg-[var(--card)]">
                {recentScores.map((score, i) => (
                  <tr key={i} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 text-[var(--foreground)]">
                      {SCRIPT_LABELS[score.script] ?? score.script}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-[var(--foreground)]">
                      {Math.round(score.wpm)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--muted-foreground)]">
                      {Math.round(score.accuracy)}%
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--muted-foreground)]">
                      {formatDistanceToNow(new Date(score.created_at), { addSuffix: true, locale: sr })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {recentScores.length === 0 && pbs.length === 0 && (
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
