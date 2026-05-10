import { createServiceClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { Users, Target, TrendingUp, ShieldAlert, Database as DatabaseIcon, Activity, Wifi } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type ScoreRow = Pick<Database['public']['Tables']['scores']['Row'], 'wpm' | 'accuracy' | 'script' | 'user_id'>
type ProfileRow = Pick<Database['public']['Tables']['profiles']['Row'], 'username' | 'created_at'>

export const metadata: Metadata = { title: 'Admin — Pregled' }

function KpiCard({ label, value, sub, icon: Icon }: { label: string; value: string | number; sub?: string; icon: React.ElementType }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
        <Icon className="h-4 w-4 text-[var(--muted-foreground)]" />
      </div>
      <p className="mt-2 font-mono text-3xl font-bold text-[var(--foreground)]">{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--muted-foreground)]">{sub}</p>}
    </div>
  )
}

function HealthBar({ value, max, label, warn = 80, critical = 95 }: {
  value: number; max: number; label: string; warn?: number; critical?: number
}) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const color = pct >= critical ? 'bg-red-500' : pct >= warn ? 'bg-yellow-500' : 'bg-emerald-500'
  const textColor = pct >= critical ? 'text-red-400' : pct >= warn ? 'text-yellow-400' : 'text-emerald-400'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[var(--muted-foreground)]">{label}</span>
        <span className={`font-mono font-bold ${textColor}`}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--border)]">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default async function AdminPregledPage() {
  const supabase = await createServiceClient()

  const today = new Date().toISOString().slice(0, 10)

  const [
    totalUsersRes,
    todayScoresRes,
    totalScoresRes,
    flaggedRes,
    recentUsersRes,
    topTodayRes,
    dbSizeRes,
    mauRes,
    textPoolCountRes,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('scores')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`),
    supabase.from('scores').select('id', { count: 'exact', head: true }),
    supabase
      .from('scores')
      .select('id', { count: 'exact', head: true })
      .eq('is_flagged', true),
    supabase
      .from('profiles')
      .select('username, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('scores')
      .select('wpm, accuracy, script, user_id')
      .eq('mode', 'rank')
      .gte('created_at', `${today}T00:00:00`)
      .order('wpm', { ascending: false })
      .limit(10),
    supabase.rpc('get_db_size_mb'),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('text_pool').select('id', { count: 'exact', head: true }),
  ])

  const totalUsers = totalUsersRes.count ?? 0
  const todayScores = todayScoresRes.count ?? 0
  const totalScores = totalScoresRes.count ?? 0
  const flaggedCount = flaggedRes.count ?? 0
  const recentUsers = (recentUsersRes.data ?? []) as ProfileRow[]
  const topToday = (topTodayRes.data ?? []) as ScoreRow[]
  const dbSizeMb = typeof dbSizeRes.data === 'number' ? dbSizeRes.data : 0
  const mauCount = mauRes.count ?? 0
  const textPoolCount = textPoolCountRes.count ?? 0

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-[var(--foreground)]">Pregled</h1>

      {/* KPI kartice */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Ukupno korisnika"
          value={totalUsers}
          icon={Users}
        />
        <KpiCard
          label="Testova danas"
          value={todayScores}
          sub={`${totalScores} ukupno`}
          icon={Target}
        />
        <KpiCard
          label="Ukupno testova"
          value={totalScores}
          icon={TrendingUp}
        />
        <KpiCard
          label="Flagovani rezultati"
          value={flaggedCount}
          sub="Čekaju pregled"
          icon={ShieldAlert}
        />
      </div>

      {/* Supabase Health */}
      <div className="mb-8 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-[var(--muted-foreground)]" />
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Supabase Health</h2>
          <span className="ml-auto text-xs text-[var(--muted-foreground)]">Free tier limiti</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 mb-2">
              <DatabaseIcon className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
              <span className="text-xs font-medium text-[var(--foreground)]">Storage</span>
            </div>
            <HealthBar value={dbSizeMb} max={500} label={`${dbSizeMb.toFixed(1)} MB / 500 MB`} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 mb-2">
              <Users className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
              <span className="text-xs font-medium text-[var(--foreground)]">MAU (30 dana)</span>
            </div>
            <HealthBar value={mauCount} max={50000} label={`${mauCount.toLocaleString('sr-RS')} / 50.000`} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 mb-2">
              <Wifi className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
              <span className="text-xs font-medium text-[var(--foreground)]">Text Pool</span>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--muted-foreground)]">Redova u bazi</span>
                <span className="font-mono font-bold text-[var(--foreground)]">{textPoolCount.toLocaleString('sr-RS')}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--border)]">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(100, (textPoolCount / 100000) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
        {(dbSizeMb / 500 * 100 >= 80 || mauCount / 50000 * 100 >= 80) && (
          <div className="mt-4 rounded-md bg-yellow-500/10 border border-yellow-500/30 px-3 py-2 text-xs text-yellow-400">
            ⚠ Bliži se limitu — razmotri nadogradnju na Supabase Pro plan
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top 10 danas */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Top 10 danas (RANK)</h2>
          </div>
          {topToday.length > 0 ? (
            <table className="w-full text-sm">
              <tbody>
                {topToday.map((score, i) => (
                    <tr key={i} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-4 py-2.5 text-[var(--muted-foreground)] font-mono">{i + 1}.</td>
                      <td className="px-4 py-2.5 text-[var(--muted-foreground)] font-mono text-xs">
                        {String(score.user_id).slice(0, 8)}…
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-[var(--accent)]">
                        {Math.round(score.wpm)} wpm
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[var(--muted-foreground)]">
                        {Math.round(score.accuracy)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
              Još nema RANK testova danas.
            </p>
          )}
        </div>

        {/* Najnoviji korisnici */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Najnoviji korisnici</h2>
          </div>
          {recentUsers.length > 0 ? (
            <table className="w-full text-sm">
              <tbody>
                {recentUsers.map((u, i) => (
                  <tr key={i} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-2.5 text-[var(--foreground)]">{u.username}</td>
                    <td className="px-4 py-2.5 text-right text-[var(--muted-foreground)]">
                      {new Date(u.created_at).toLocaleDateString('sr-RS')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
              Nema registrovanih korisnika.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
