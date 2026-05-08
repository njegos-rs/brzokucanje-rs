import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

export const metadata: Metadata = { title: 'Admin — Anti-cheat' }

type ScoreRow = Database['public']['Tables']['scores']['Row']

type FlaggedScore = Pick<ScoreRow,
  'id' | 'user_id' | 'wpm' | 'accuracy' | 'script' | 'category' | 'mode' |
  'flag_reason' | 'flag_reviewed' | 'review_decision' | 'created_at'
>

export default async function AdminAntiCheatPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('scores')
    .select('id, user_id, wpm, accuracy, script, category, mode, flag_reason, flag_reviewed, review_decision, created_at')
    .eq('is_flagged', true)
    .order('created_at', { ascending: false })
    .limit(100)

  type Row = FlaggedScore & { profiles: { username: string } | null }
  const scoreRows = data ?? []
  const userIds = Array.from(new Set(scoreRows.map((score) => score.user_id)))
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, username').in('id', userIds)
    : { data: [] }
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
  const scores: Row[] = scoreRows.map((score) => ({
    ...score,
    profiles: profileById.get(score.user_id) ?? null,
  }))

  const pending = scores.filter((s) => !s.flag_reviewed)
  const reviewed = scores.filter((s) => s.flag_reviewed)

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Anti-cheat</h1>
        <span className="rounded-full bg-[var(--incorrect)]/10 px-2.5 py-0.5 text-sm font-medium text-[var(--incorrect)]">
          {pending.length} na čekanju
        </span>
      </div>

      {/* Pending */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Na čekanju</h2>
        {pending.length === 0 ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] py-8 text-center">
            <ShieldCheck className="mx-auto mb-2 h-6 w-6 text-[var(--correct)]" />
            <p className="text-sm text-[var(--muted-foreground)]">Nema flagovanih rezultata.</p>
          </div>
        ) : (
          <FlaggedTable scores={pending} />
        )}
      </section>

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-[var(--muted-foreground)]">Pregledani ({reviewed.length})</h2>
          <FlaggedTable scores={reviewed} />
        </section>
      )}
    </div>
  )
}

function FlaggedTable({ scores }: { scores: (FlaggedScore & { profiles: { username: string } | null })[] }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="px-4 py-3 text-left text-xs text-[var(--muted-foreground)]">Korisnik</th>
            <th className="px-4 py-3 text-left text-xs text-[var(--muted-foreground)]">Razlog</th>
            <th className="px-4 py-3 text-right text-xs text-[var(--muted-foreground)]">WPM</th>
            <th className="px-4 py-3 text-left text-xs text-[var(--muted-foreground)]">Mod</th>
            <th className="px-4 py-3 text-left text-xs text-[var(--muted-foreground)]">Datum</th>
            <th className="px-4 py-3 text-center text-xs text-[var(--muted-foreground)]">Status</th>
            <th className="px-4 py-3 text-right text-xs text-[var(--muted-foreground)]">Akcija</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s) => (
            <tr key={s.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/20 transition-colors">
              <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                {s.profiles?.username ?? String(s.user_id).slice(0, 8) + '…'}
              </td>
              <td className="px-4 py-3 max-w-[200px]">
                <span className="truncate block text-xs text-[var(--incorrect)]" title={s.flag_reason ?? ''}>
                  {s.flag_reason ?? '—'}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-mono font-bold text-[var(--accent)]">
                {Math.round(s.wpm)}
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs rounded px-1.5 py-0.5 ${s.mode === 'rank' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}>
                  {s.mode.toUpperCase()}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
                {new Date(s.created_at).toLocaleDateString('sr-RS')}
              </td>
              <td className="px-4 py-3 text-center">
                {s.flag_reviewed ? (
                  s.review_decision === 'approved'
                    ? <ShieldCheck className="mx-auto h-4 w-4 text-[var(--correct)]" />
                    : <ShieldX className="mx-auto h-4 w-4 text-[var(--incorrect)]" />
                ) : (
                  <ShieldAlert className="mx-auto h-4 w-4 text-amber-500" />
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/admin/anti-cheat/${s.id}`}
                  className="text-xs text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
                >
                  Pregled →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
