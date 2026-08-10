'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, CheckCircle, Loader2, Pencil, Trash2 } from 'lucide-react'
import { createAdminBrowserClient } from '@/lib/supabase/admin-client'
import { NICKNAME_MAX_LENGTH, normalizeNickname } from '@/lib/validators/nickname'

interface Props {
  userId: string
  username: string
  isAdmin: boolean
  isBanned: boolean
  banReason: string | null
}

export function UserAdminActions({ userId, username, isAdmin, isBanned, banReason }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [renameMessage, setRenameMessage] = useState<string | null>(null)
  const [renameSuccess, setRenameSuccess] = useState(false)
  const [reason, setReason] = useState('')
  const [showBanForm, setShowBanForm] = useState(false)
  const [newUsername, setNewUsername] = useState(username)
  const [confirmUsername, setConfirmUsername] = useState('')

  const handleBan = async () => {
    if (!reason.trim()) return
    setLoading('ban')
    setError(null)
    try {
      const supabase = createAdminBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Niste prijavljeni')

      const { error: fnErr } = await supabase.rpc('ban_user', {
        p_admin_id: user.id,
        p_user_id: userId,
        p_reason: reason.trim(),
      })

      if (fnErr) throw fnErr
      setShowBanForm(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška')
    } finally {
      setLoading(null)
    }
  }

  const handleUnban = async () => {
    setLoading('unban')
    setError(null)
    try {
      const supabase = createAdminBrowserClient()
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
      setLoading(null)
    }
  }

  const handleRename = async () => {
    const normalizedUsername = normalizeNickname(newUsername)
    if (normalizedUsername.length < 3) {
      setRenameSuccess(false)
      setRenameMessage('Username mora imati najmanje 3 karaktera.')
      return
    }
    setLoading('rename')
    setError(null)
    setRenameMessage(null)
    setRenameSuccess(false)
    try {
      const res = await fetch(`/api/admin/users/${userId}/nickname`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalizedUsername }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Greška pri promeni username-a')
      setNewUsername(json.username ?? normalizedUsername)
      setRenameSuccess(true)
      setRenameMessage('Username je uspešno sačuvan.')
      router.refresh()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Greška'
      setRenameSuccess(false)
      setRenameMessage(message)
      setError(message)
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async () => {
    setLoading('delete')
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmUsername }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Greška pri brisanju korisnika')
      router.push('/admin/korisnici')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <h2 className="text-sm font-semibold text-[var(--foreground)]">Upravljanje nalogom</h2>

      {isBanned ? (
        <div className="space-y-3">
          <div className="rounded-md bg-[var(--incorrect)]/10 px-3 py-2 text-sm text-[var(--incorrect)]">
            <strong>Banovan.</strong> Razlog: {banReason ?? '—'}
          </div>
          <button
            onClick={handleUnban}
            disabled={!!loading}
            className="flex items-center gap-2 rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
          >
            {loading === 'unban' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 text-[var(--correct)]" />}
            Unbanuj korisnika
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {!showBanForm ? (
            <button onClick={() => setShowBanForm(true)} className="flex items-center gap-2 rounded-md border border-[var(--incorrect)]/40 px-4 py-2 text-sm text-[var(--incorrect)] hover:bg-[var(--incorrect)]/10 transition-colors">
              <Ban className="h-3.5 w-3.5" />
              Banuj korisnika
            </button>
          ) : (
            <div className="space-y-2">
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Razlog bana…" className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--incorrect)]" />
              <div className="flex gap-2">
                <button onClick={handleBan} disabled={!!loading || !reason.trim()} className="flex items-center gap-2 rounded-md bg-[var(--incorrect)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {loading === 'ban' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Potvrdi ban
                </button>
                <button onClick={() => { setShowBanForm(false); setReason('') }} className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">Otkaži</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-[var(--border)] pt-4">
        <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">Promeni username</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} maxLength={NICKNAME_MAX_LENGTH} className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]" />
          <button onClick={handleRename} disabled={!!loading || normalizeNickname(newUsername) === username} className="flex items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity">
            {loading === 'rename' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
            Sačuvaj
          </button>
        </div>
        {renameMessage && (
          <p className={renameSuccess ? 'text-xs text-[var(--correct)]' : 'text-xs text-[var(--incorrect)]'} role="status">
            {renameMessage}
          </p>
        )}
      </div>

      <div className="border-t border-[var(--border)] pt-4">
        <label className="mb-1.5 block text-xs font-medium text-[var(--incorrect)]">Obriši korisnika</label>
        <p className="mb-2 text-xs text-[var(--muted-foreground)]">Za potvrdu unesi tačan username: <span className="font-mono text-[var(--foreground)]">{username}</span></p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input value={confirmUsername} onChange={(e) => setConfirmUsername(e.target.value)} disabled={isAdmin} placeholder={isAdmin ? 'Admin nalog se ne može obrisati' : username} className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--incorrect)] disabled:opacity-50" />
          <button onClick={handleDelete} disabled={!!loading || isAdmin || confirmUsername !== username} className="flex items-center justify-center gap-2 rounded-md bg-[var(--incorrect)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
            {loading === 'delete' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Obriši
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-[var(--incorrect)]">{error}</p>}
    </div>
  )
}
