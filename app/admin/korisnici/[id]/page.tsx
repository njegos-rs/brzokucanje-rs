import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { UserAdminActions } from './UserAdminActions'
import { Shield, Ban, Flame, Target, Gamepad2, Activity } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type ScoreRow = Pick<Database['public']['Tables']['scores']['Row'], 'id' | 'wpm' | 'accuracy' | 'script' | 'category' | 'mode' | 'is_flagged' | 'created_at' | 'duration_seconds'>
type GameRow = Pick<Database['public']['Tables']['game_scores']['Row'], 'id' | 'score' | 'level' | 'words_destroyed' | 'elapsed_seconds' | 'created_at'>
type AuditEntry = {
  action: string
  details: unknown
  created_at: string
  admin_id: string
}

type AdminActionsClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (column: string, options: { ascending: boolean }) => {
          limit: (count: number) => Promise<{ data: AuditEntry[] | null }>
        }
      }
    }
  }
}
interface Props {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = { title: 'Admin — Korisnik detalji' }

function Kpi({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
        <Icon className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
      </div>
      <p className="font-mono text-2xl font-bold text-[var(--foreground)]">{value}</p>
    </div>
  )
}

export default async function KorisnikDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServiceClient()

  const [profileRes, scoresRes, gamesRes, adminActionsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase
      .from('scores')
      .select('id, wpm, accuracy, script, category, mode, is_flagged, created_at, duration_seconds')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('game_scores')
      .select('id, score, level, words_destroyed, elapsed_seconds, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    (supabase as unknown as AdminActionsClient).from('admin_actions')
      .select('action, details, created_at, admin_id')
      .eq('target_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!profileRes.data?.username?.trim()) notFound()

  const profile = profileRes.data as ProfileRow
  const scores = (scoresRes.data ?? []) as ScoreRow[]
  const games = (gamesRes.data ?? []) as GameRow[]
  const auditLog = adminActionsRes.data ?? []

  const totalTests = scores.length
  const rankTests = scores.filter((s) => s.mode === 'rank').length
  const practiceTests = scores.filter((s) => s.mode === 'vezba').length
  const avgWpm = totalTests > 0 ? Math.round(scores.reduce((a, s) => a + Number(s.wpm), 0) / totalTests) : 0
  const bestWpm = scores.length > 0 ? Math.round(Math.max(...scores.map((s) => Number(s.wpm) || 0))) : 0
  const flaggedCount = scores.filter((s) => s.is_flagged).length
  const bestGameScore = games.length > 0 ? Math.max(...games.map((g) => Number(g.score) || 0)) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{profile.username}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Registrovan {new Date(profile.created_at).toLocaleDateString('sr-RS')} · Poslednja aktivnost {profile.last_active_date ?? '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {profile.is_admin && <span className="flex items-center gap-1 rounded px-2 py-1 text-xs bg-[var(--accent)]/10 text-[var(--accent)]"><Shield className="h-3 w-3" />Admin</span>}
          {profile.is_banned && <span className="flex items-center gap-1 rounded px-2 py-1 text-xs bg-[var(--incorrect)]/10 text-[var(--incorrect)]"><Ban className="h-3 w-3" />Banovan</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label="Ukupno testova" value={totalTests} icon={Target} />
        <Kpi label="Rank / vežba" value={`${rankTests}/${practiceTests}`} icon={Activity} />
        <Kpi label="Najbolji WPM" value={bestWpm || '—'} icon={Target} />
        <Kpi label="Prosečni WPM" value={avgWpm || '—'} icon={Target} />
        <Kpi label="Streak" value={`${profile.current_streak}/${profile.longest_streak}`} icon={Flame} />
        <Kpi label="Flagovani" value={flaggedCount} icon={Shield} />
        <Kpi label="Game pokušaji" value={games.length} icon={Gamepad2} />
        <Kpi label="Game best" value={bestGameScore || '—'} icon={Gamepad2} />
      </div>

      <UserAdminActions
        userId={id}
        username={profile.username ?? ''}
        isAdmin={profile.is_admin}
        isBanned={profile.is_banned}
        banReason={profile.ban_reason}
      />

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div className="border-b border-[var(--border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Poslednjih 50 testova</h2>
        </div>
        {scores.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--muted-foreground)]">Nema testova.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead><tr className="border-b border-[var(--border)]"><th className="px-4 py-2.5 text-left text-xs text-[var(--muted-foreground)]">Datum</th><th className="px-4 py-2.5 text-left text-xs text-[var(--muted-foreground)]">Pismo</th><th className="px-4 py-2.5 text-left text-xs text-[var(--muted-foreground)]">Kategorija</th><th className="px-4 py-2.5 text-left text-xs text-[var(--muted-foreground)]">Mod</th><th className="px-4 py-2.5 text-right text-xs text-[var(--muted-foreground)]">WPM</th><th className="px-4 py-2.5 text-right text-xs text-[var(--muted-foreground)]">Tačnost</th><th className="px-4 py-2.5 text-center text-xs text-[var(--muted-foreground)]">Flag</th></tr></thead>
              <tbody>{scores.map((s) => <tr key={s.id} className="border-b border-[var(--border)] last:border-0"><td className="px-4 py-2.5 text-xs text-[var(--muted-foreground)]">{new Date(s.created_at).toLocaleDateString('sr-RS')}</td><td className="px-4 py-2.5 text-xs text-[var(--foreground)]">{s.script}</td><td className="px-4 py-2.5 text-xs text-[var(--foreground)]">{s.category}</td><td className="px-4 py-2.5"><span className={`text-xs rounded px-1.5 py-0.5 ${s.mode === 'rank' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}>{s.mode.toUpperCase()}</span></td><td className="px-4 py-2.5 text-right font-mono font-bold text-[var(--accent)]">{Math.round(Number(s.wpm))}</td><td className="px-4 py-2.5 text-right font-mono text-[var(--muted-foreground)]">{Math.round(Number(s.accuracy))}%</td><td className="px-4 py-2.5 text-center">{s.is_flagged && <span className="text-xs text-[var(--incorrect)]">⚑</span>}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div className="border-b border-[var(--border)] px-4 py-3"><h2 className="text-sm font-semibold text-[var(--foreground)]">Poslednjih 20 game pokušaja</h2></div>
        {games.length === 0 ? <p className="py-6 text-center text-sm text-[var(--muted-foreground)]">Nema game pokušaja.</p> : (
          <table className="w-full text-sm"><tbody>{games.map((g) => <tr key={g.id} className="border-b border-[var(--border)] last:border-0"><td className="px-4 py-2.5 text-xs text-[var(--muted-foreground)]">{new Date(g.created_at).toLocaleDateString('sr-RS')}</td><td className="px-4 py-2.5 text-right font-mono text-[var(--foreground)]">{g.score} poena</td><td className="px-4 py-2.5 text-right text-xs text-[var(--muted-foreground)]">Level {g.level}</td><td className="px-4 py-2.5 text-right text-xs text-[var(--muted-foreground)]">{g.words_destroyed} reči</td></tr>)}</tbody></table>
        )}
      </div>

      {auditLog.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <div className="border-b border-[var(--border)] px-4 py-3"><h2 className="text-sm font-semibold text-[var(--foreground)]">Audit log</h2></div>
          <table className="w-full text-sm"><tbody>{auditLog.map((a, i) => <tr key={i} className="border-b border-[var(--border)] last:border-0"><td className="px-4 py-2.5 text-xs text-[var(--muted-foreground)]">{new Date(a.created_at).toLocaleString('sr-RS')}</td><td className="px-4 py-2.5 text-xs font-mono text-[var(--foreground)]">{a.action}</td><td className="px-4 py-2.5 text-xs text-[var(--muted-foreground)]">{a.details ? JSON.stringify(a.details) : '—'}</td></tr>)}</tbody></table>
        </div>
      )}
    </div>
  )
}
