import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
export const metadata: Metadata = { title: 'Admin — Audit log' }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ActionRow = any

const ACTION_LABELS: Record<string, string> = {
  anticheat_approved: 'Anti-cheat: odobren',
  anticheat_rejected: 'Anti-cheat: odbijen',
  ban_user: 'Ban korisnika',
  unban_user: 'Unban korisnika',
}

export default async function AdminAuditPage() {
  const supabase = await createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('admin_actions')
    .select('id, admin_id, action, target_type, target_id, details, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  const actions = (data ?? []) as ActionRow[]

  const adminIds = Array.from(new Set(actions.map((a) => a.admin_id)))
  const { data: admins } = adminIds.length
    ? await supabase.from('profiles').select('id, username').in('id', adminIds)
    : { data: [] }
  const adminById = new Map((admins ?? []).map((a) => [a.id, a.username]))

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-[var(--foreground)]">Audit log</h1>
      <p className="mb-6 text-sm text-[var(--muted-foreground)]">
        Poslednjih {actions.length} admin akcija
      </p>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        {actions.length === 0 ? (
          <p className="py-16 text-center text-sm text-[var(--muted-foreground)]">
            Nema akcija.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">Vreme</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">Admin</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">Akcija</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">Target</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">Detalji</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((a) => (
                <tr key={a.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/20 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-[var(--muted-foreground)] whitespace-nowrap">
                    {new Date(a.created_at).toLocaleString('sr-RS')}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[var(--foreground)]">
                    {adminById.get(a.admin_id) ?? a.admin_id.slice(0, 8) + '…'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="rounded px-1.5 py-0.5 text-xs font-mono bg-[var(--muted)] text-[var(--foreground)]">
                      {ACTION_LABELS[a.action] ?? a.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[var(--muted-foreground)]">
                    {a.target_type}/{a.target_id.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[var(--muted-foreground)] max-w-xs truncate">
                    {a.details ? JSON.stringify(a.details) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
