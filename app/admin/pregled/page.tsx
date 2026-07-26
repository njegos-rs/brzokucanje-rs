import { createServiceClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { Users, Target, ShieldAlert, Database as DatabaseIcon, Activity, Wifi, Eye, Gamepad2, Ban, FileWarning } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type ProfileRow = Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'username' | 'created_at'>
type ScoreRow = Pick<Database['public']['Tables']['scores']['Row'], 'wpm' | 'accuracy' | 'script' | 'user_id' | 'mode' | 'duration_seconds' | 'created_at' | 'is_flagged' | 'flag_reason'>
type VisitRow = Pick<Database['public']['Tables']['site_visits']['Row'], 'path' | 'visitor_id' | 'created_at'>
type GameRow = Pick<Database['public']['Tables']['game_scores']['Row'], 'user_id' | 'score' | 'elapsed_seconds' | 'created_at'>
type AdminActionRow = { action: string; target_type: string; target_id: string; created_at: string }

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

function HealthBar({ value, max, label, warn = 80, critical = 95 }: { value: number; max: number; label: string; warn?: number; critical?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const color = pct >= critical ? 'bg-red-500' : pct >= warn ? 'bg-yellow-500' : 'bg-emerald-500'
  const textColor = pct >= critical ? 'text-red-400' : pct >= warn ? 'text-yellow-400' : 'text-emerald-400'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1"><span className="text-[var(--muted-foreground)]">{label}</span><span className={`font-mono font-bold ${textColor}`}>{pct}%</span></div>
      <div className="h-2 rounded-full bg-[var(--border)]"><div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

function avg(values: number[]) {
  return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0
}

export default async function AdminPregledPage() {
  const supabase = await createServiceClient()

  const today = new Date().toISOString().slice(0, 10)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    totalUsersRes, todayUsersRes, bannedRes, todayScoresRes, todayRankRes, todayPracticeRes,
    flaggedRes, recentUsersRes, topTodayRes, dbSizeRes, mauRes, textPoolCountRes, inactiveTextsRes,
    problemTextsRes, visitsTodayRes, visits7dRes, gameTodayRes, game7dRes, recentActionsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).not('username', 'is', null).neq('username', ''),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).not('username', 'is', null).neq('username', '').gte('created_at', `${today}T00:00:00`),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_banned', true),
    supabase.from('scores').select('id', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`),
    supabase.from('scores').select('id', { count: 'exact', head: true }).eq('mode', 'rank').gte('created_at', `${today}T00:00:00`),
    supabase.from('scores').select('id', { count: 'exact', head: true }).eq('mode', 'vezba').gte('created_at', `${today}T00:00:00`),
    supabase.from('scores').select('id', { count: 'exact', head: true }).eq('is_flagged', true),
    supabase.from('profiles').select('id, username, created_at').not('username', 'is', null).neq('username', '').order('created_at', { ascending: false }).limit(5),
    supabase.from('scores').select('wpm, accuracy, script, user_id, mode, duration_seconds, created_at, is_flagged, flag_reason').eq('mode', 'rank').gte('created_at', `${today}T00:00:00`).order('wpm', { ascending: false }).limit(10),
    supabase.rpc('get_db_size_mb'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).not('username', 'is', null).neq('username', '').gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('text_pool').select('id', { count: 'exact', head: true }),
    supabase.from('text_pool').select('id', { count: 'exact', head: true }).eq('is_active', false),
    supabase.from('text_pool').select('id', { count: 'exact', head: true }).or('content_lat.eq.,content_cyr.eq.,content_easy.eq.,word_count.is.null,char_count.is.null'),
    supabase.from('site_visits').select('path, visitor_id, created_at').gte('created_at', `${today}T00:00:00`),
    supabase.from('site_visits').select('path, visitor_id, created_at').gte('created_at', sevenDaysAgo),
    supabase.from('game_scores').select('user_id, score, elapsed_seconds, created_at').gte('created_at', `${today}T00:00:00`),
    supabase.from('game_scores').select('user_id, score, elapsed_seconds, created_at').gte('created_at', sevenDaysAgo),
    (supabase as unknown as { from: (table: string) => { select: (columns: string) => { order: (column: string, opts: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: AdminActionRow[] | null }> } } } }).from('admin_actions').select('action, target_type, target_id, created_at').order('created_at', { ascending: false }).limit(5),
  ])

  const visitsToday = (visitsTodayRes.data ?? []) as VisitRow[]
  const visits7d = (visits7dRes.data ?? []) as VisitRow[]
  const topPages = Object.entries(visits7d.reduce<Record<string, number>>((acc, visit) => {
    acc[visit.path] = (acc[visit.path] ?? 0) + 1
    return acc
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const topToday = (topTodayRes.data ?? []) as ScoreRow[]
  const gameToday = (gameTodayRes.data ?? []) as GameRow[]
  const game7d = (game7dRes.data ?? []) as GameRow[]
  const modeCounts = [
    ['Rank', todayRankRes.count ?? 0],
    ['Vežba', todayPracticeRes.count ?? 0],
    ['Igra', gameToday.length],
  ].sort((a, b) => Number(b[1]) - Number(a[1]))

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-[var(--foreground)]">Pregled</h1>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <KpiCard label="Posete danas" value={visitsToday.length} sub={`${new Set(visitsToday.map((v) => v.visitor_id).filter(Boolean)).size} jedinstvenih`} icon={Eye} />
        <KpiCard label="Novi korisnici danas" value={todayUsersRes.count ?? 0} sub={`${totalUsersRes.count ?? 0} ukupno`} icon={Users} />
        <KpiCard label="Typing testovi danas" value={todayScoresRes.count ?? 0} sub={`Rank ${todayRankRes.count ?? 0} / Vežba ${todayPracticeRes.count ?? 0}`} icon={Target} />
        <KpiCard label="Game pokušaji danas" value={gameToday.length} sub={`${game7d.length} za 7 dana`} icon={Gamepad2} />
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <KpiCard label="Flagovi za pregled" value={flaggedRes.count ?? 0} sub="Anti-cheat red" icon={ShieldAlert} />
        <KpiCard label="Banovani korisnici" value={bannedRes.count ?? 0} icon={Ban} />
        <KpiCard label="Neaktivni tekstovi" value={inactiveTextsRes.count ?? 0} icon={FileWarning} />
        <KpiCard label="Problematični tekstovi" value={problemTextsRes.count ?? 0} sub="Prazno ili bez broja reči" icon={FileWarning} />
      </div>

      <div className="mb-8 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex items-center gap-2 mb-4"><Activity className="h-4 w-4 text-[var(--muted-foreground)]" /><h2 className="text-sm font-semibold text-[var(--foreground)]">Supabase Health</h2><span className="ml-auto text-xs text-[var(--muted-foreground)]">Free tier limiti</span></div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><div className="mb-2 flex items-center gap-1.5"><DatabaseIcon className="h-3.5 w-3.5 text-[var(--muted-foreground)]" /><span className="text-xs font-medium text-[var(--foreground)]">Storage</span></div><HealthBar value={typeof dbSizeRes.data === 'number' ? dbSizeRes.data : 0} max={500} label={`${(typeof dbSizeRes.data === 'number' ? dbSizeRes.data : 0).toFixed(1)} MB / 500 MB`} /></div>
          <div><div className="mb-2 flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-[var(--muted-foreground)]" /><span className="text-xs font-medium text-[var(--foreground)]">MAU (30 dana)</span></div><HealthBar value={mauRes.count ?? 0} max={50000} label={`${(mauRes.count ?? 0).toLocaleString('sr-RS')} / 50.000`} /></div>
          <div><div className="mb-2 flex items-center gap-1.5"><Wifi className="h-3.5 w-3.5 text-[var(--muted-foreground)]" /><span className="text-xs font-medium text-[var(--foreground)]">Text Pool</span></div><HealthBar value={textPoolCountRes.count ?? 0} max={100000} label={`${(textPoolCountRes.count ?? 0).toLocaleString('sr-RS')} redova`} warn={70} critical={95} /></div>
        </div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"><h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Pažnja — 7 dana</h2><div className="space-y-2 text-sm"><p className="text-[var(--muted-foreground)]">Najigraniji mod: <span className="font-mono text-[var(--foreground)]">{modeCounts[0][0]}</span></p><p className="text-[var(--muted-foreground)]">Prosečan typing test: <span className="font-mono text-[var(--foreground)]">{avg(topToday.map((s) => Number(s.duration_seconds)))}s</span></p><p className="text-[var(--muted-foreground)]">Prosečan game pokušaj: <span className="font-mono text-[var(--foreground)]">{avg(game7d.map((g) => Number(g.elapsed_seconds)))}s</span></p></div></div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 lg:col-span-2"><h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Top stranice — 7 dana</h2>{topPages.length ? <div className="space-y-2">{topPages.map(([path, count]) => <div key={path} className="flex justify-between gap-4 text-sm"><span className="truncate text-[var(--muted-foreground)]">{path}</span><span className="font-mono text-[var(--foreground)]">{count}</span></div>)}</div> : <p className="text-sm text-[var(--muted-foreground)]">Još nema zabeleženih poseta.</p>}</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]"><div className="border-b border-[var(--border)] px-4 py-3"><h2 className="text-sm font-semibold text-[var(--foreground)]">Top 10 danas (RANK)</h2></div>{topToday.length > 0 ? <table className="w-full text-sm"><tbody>{topToday.map((score, i) => <tr key={i} className="border-b border-[var(--border)] last:border-0"><td className="px-4 py-2.5 text-[var(--muted-foreground)] font-mono">{i + 1}.</td><td className="px-4 py-2.5 text-right font-mono font-bold text-[var(--accent)]">{Math.round(Number(score.wpm))} wpm</td><td className="px-4 py-2.5 text-right font-mono text-[var(--muted-foreground)]">{Math.round(Number(score.accuracy))}%</td></tr>)}</tbody></table> : <p className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">Još nema RANK testova danas.</p>}</div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]"><div className="border-b border-[var(--border)] px-4 py-3"><h2 className="text-sm font-semibold text-[var(--foreground)]">Najnoviji korisnici</h2></div>{((recentUsersRes.data ?? []) as ProfileRow[]).length > 0 ? <table className="w-full text-sm"><tbody>{((recentUsersRes.data ?? []) as ProfileRow[]).map((u) => <tr key={u.id} className="border-b border-[var(--border)] last:border-0"><td className="px-4 py-2.5 text-[var(--foreground)]">{u.username}</td><td className="px-4 py-2.5 text-right text-[var(--muted-foreground)]">{new Date(u.created_at).toLocaleDateString('sr-RS')}</td></tr>)}</tbody></table> : <p className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">Nema registrovanih korisnika.</p>}</div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]"><div className="border-b border-[var(--border)] px-4 py-3"><h2 className="text-sm font-semibold text-[var(--foreground)]">Nedavna admin aktivnost</h2></div>{(recentActionsRes.data ?? []).length ? <table className="w-full text-sm"><tbody>{(recentActionsRes.data ?? []).map((a, i) => <tr key={i} className="border-b border-[var(--border)] last:border-0"><td className="px-4 py-2.5 text-xs font-mono text-[var(--foreground)]">{a.action}</td><td className="px-4 py-2.5 text-right text-xs text-[var(--muted-foreground)]">{new Date(a.created_at).toLocaleDateString('sr-RS')}</td></tr>)}</tbody></table> : <p className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">Nema admin akcija.</p>}</div>
      </div>
    </div>
  )
}
