'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ShieldX, Ban, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  scoreId: string
  userId: string
  username: string
  isReviewed: boolean
  decision: string | null
}

export function ReviewActions({ scoreId, userId, username, isReviewed, decision }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const doReview = async (reviewDecision: 'approved' | 'rejected') => {
    setLoading(reviewDecision)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Niste prijavljeni')

      const { error: err } = await supabase
        .from('scores')
        .update({ flag_reviewed: true, review_decision: reviewDecision, reviewed_by: user.id })
        .eq('id', scoreId)

      if (err) throw err

      await supabase.from('admin_actions').insert({
        admin_id: user.id,
        action: `anticheat_${reviewDecision}`,
        target_type: 'score',
        target_id: scoreId,
        details: { note: note.trim() || null, user_id: userId },
      })

      router.push('/admin/anti-cheat')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška')
    } finally {
      setLoading(null)
    }
  }

  const doBan = async () => {
    if (!note.trim()) {
      setError('Unesite razlog bana.')
      return
    }
    setLoading('ban')
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Niste prijavljeni')

      const { error: err } = await supabase.rpc('ban_user', {
        p_admin_id: user.id,
        p_user_id: userId,
        p_reason: note.trim(),
      })
      if (err) throw err

      // Automatski reject score
      await supabase.from('scores').update({ flag_reviewed: true, review_decision: 'rejected', reviewed_by: user.id }).eq('id', scoreId)

      router.push('/admin/anti-cheat')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška')
    } finally {
      setLoading(null)
    }
  }

  if (isReviewed) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <p className="text-sm text-[var(--muted-foreground)]">
          Pregledano. Odluka:{' '}
          <strong className={decision === 'approved' ? 'text-[var(--correct)]' : 'text-[var(--incorrect)]'}>
            {decision === 'approved' ? 'Odobreno' : 'Odbijeno'}
          </strong>
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
      <h2 className="text-sm font-semibold text-[var(--foreground)]">Akcija</h2>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Napomena (opciono za approve/reject, obavezno za ban)…"
        rows={2}
        className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] resize-none"
      />
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => doReview('approved')}
          disabled={!!loading}
          className="flex items-center gap-2 rounded-md bg-[var(--correct)]/10 border border-[var(--correct)]/30 px-4 py-2 text-sm font-medium text-[var(--correct)] hover:bg-[var(--correct)]/20 disabled:opacity-50 transition-colors"
        >
          {loading === 'approved' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          Odobri
        </button>
        <button
          onClick={() => doReview('rejected')}
          disabled={!!loading}
          className="flex items-center gap-2 rounded-md bg-[var(--incorrect)]/10 border border-[var(--incorrect)]/30 px-4 py-2 text-sm font-medium text-[var(--incorrect)] hover:bg-[var(--incorrect)]/20 disabled:opacity-50 transition-colors"
        >
          {loading === 'rejected' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldX className="h-3.5 w-3.5" />}
          Odbij rezultat
        </button>
        <button
          onClick={doBan}
          disabled={!!loading}
          className="flex items-center gap-2 rounded-md bg-[var(--incorrect)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading === 'ban' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
          Odbij + Banuj {username}
        </button>
      </div>
      {error && <p className="text-xs text-[var(--incorrect)]">{error}</p>}
    </div>
  )
}
