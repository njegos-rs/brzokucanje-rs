'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, CheckCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  username: string
  isBanned: boolean
  banReason: string | null
}

export function BanActions({ userId, username, isBanned, banReason }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [showForm, setShowForm] = useState(false)

  const handleBan = async () => {
    if (!reason.trim()) return
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Niste prijavljeni')

      const { error: fnErr } = await supabase.rpc('ban_user', {
        p_admin_id: user.id,
        p_user_id: userId,
        p_reason: reason.trim(),
      })

      if (fnErr) throw fnErr
      setShowForm(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška')
    } finally {
      setLoading(false)
    }
  }

  const handleUnban = async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Niste prijavljeni')

      const { error: fnErr } = await supabase.rpc('unban_user', {
        p_admin_id: user.id,
        p_user_id: userId,
      })

      if (fnErr) throw fnErr
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Upravljanje nalogom</h2>

      {isBanned ? (
        <div className="space-y-3">
          <div className="rounded-md bg-[var(--incorrect)]/10 px-3 py-2 text-sm text-[var(--incorrect)]">
            <strong>Banovan.</strong> Razlog: {banReason ?? '—'}
          </div>
          <button
            onClick={handleUnban}
            disabled={loading}
            className="flex items-center gap-2 rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 text-[var(--correct)]" />}
            Unbanuj {username}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-md border border-[var(--incorrect)]/40 px-4 py-2 text-sm text-[var(--incorrect)] hover:bg-[var(--incorrect)]/10 transition-colors"
            >
              <Ban className="h-3.5 w-3.5" />
              Banuj {username}
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Razlog bana…"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--incorrect)]"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleBan}
                  disabled={loading || !reason.trim()}
                  className="flex items-center gap-2 rounded-md bg-[var(--incorrect)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Potvrdi ban
                </button>
                <button
                  onClick={() => { setShowForm(false); setReason('') }}
                  className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  Otkaži
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-[var(--incorrect)]">{error}</p>
      )}
    </div>
  )
}
