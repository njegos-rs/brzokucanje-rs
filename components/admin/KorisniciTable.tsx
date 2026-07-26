'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Shield, Ban, CheckCircle, ChevronUp, ChevronDown, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AdminUserRow {
  id: string
  username: string | null
  created_at: string
  updated_at: string
  last_active_date: string | null
  current_streak: number
  longest_streak: number
  is_admin: boolean
  is_banned: boolean
  ban_reason: string | null
  totalTests: number
  rankTests: number
  practiceTests: number
  bestWpm: number
  avgWpm: number
  flaggedCount: number
  lastTestAt: string | null
  gameAttempts: number
  bestGameScore: number
  lastGameAt: string | null
  lastActivityAt: string
}

type SortField = 'username' | 'created_at' | 'lastActivityAt' | 'totalTests' | 'bestWpm' | 'flaggedCount' | 'current_streak' | 'bestGameScore'
type SortDir = 'asc' | 'desc'
type Filter = 'all' | 'admin' | 'banned' | 'active' | 'flagged' | 'new7d'

type SortIconProps = {
  field: SortField
  sort: { field: SortField; dir: SortDir }
}

function SortIcon({ field, sort }: SortIconProps) {
  if (sort.field !== field) return <span className="h-3 w-3" />
  return sort.dir === 'asc'
    ? <ChevronUp className="h-3 w-3" />
    : <ChevronDown className="h-3 w-3" />
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('sr-RS')
}

function isNewUser(value: string) {
  return new Date(value).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000
}

interface Props {
  profiles: AdminUserRow[]
}

const FILTER_LABELS: Record<Filter, string> = {
  all: 'Svi',
  admin: 'Admin',
  banned: 'Banovani',
  active: 'Aktivni',
  flagged: 'Flagovani',
  new7d: 'Novi 7d',
}

export function KorisniciTable({ profiles }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'lastActivityAt', dir: 'desc' })

  const filtered = useMemo(() => {
    let rows = profiles

    if (query.trim()) {
      const q = query.toLowerCase()
      rows = rows.filter((p) => (p.username ?? '').toLowerCase().includes(q))
    }

    if (filter === 'admin') rows = rows.filter((p) => p.is_admin)
    if (filter === 'banned') rows = rows.filter((p) => p.is_banned)
    if (filter === 'active') rows = rows.filter((p) => !p.is_banned && !p.is_admin)
    if (filter === 'flagged') rows = rows.filter((p) => p.flaggedCount > 0)
    if (filter === 'new7d') rows = rows.filter((p) => isNewUser(p.created_at))

    rows = [...rows].sort((a, b) => {
      let av: string | number = a[sort.field] ?? ''
      let bv: string | number = b[sort.field] ?? ''
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sort.dir === 'asc' ? -1 : 1
      if (av > bv) return sort.dir === 'asc' ? 1 : -1
      return 0
    })

    return rows
  }, [profiles, query, filter, sort])

  const toggleSort = (field: SortField) => {
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { field, dir: 'desc' },
    )
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pretraži po username-u…"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {(['all', 'admin', 'banned', 'active', 'flagged', 'new7d'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded px-3 py-1.5 text-xs font-medium transition-colors',
                f === filter
                  ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                  : 'border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-4 py-3 text-left">
                <button onClick={() => toggleSort('username')} className="flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  Korisnik <SortIcon field="username" sort={sort} />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">Status</th>
              <th className="px-4 py-3 text-left">
                <button onClick={() => toggleSort('lastActivityAt')} className="flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  Aktivnost <SortIcon field="lastActivityAt" sort={sort} />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button onClick={() => toggleSort('totalTests')} className="flex w-full items-center justify-end gap-1 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  Testovi <SortIcon field="totalTests" sort={sort} />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button onClick={() => toggleSort('bestWpm')} className="flex w-full items-center justify-end gap-1 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  Best WPM <SortIcon field="bestWpm" sort={sort} />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button onClick={() => toggleSort('bestGameScore')} className="flex w-full items-center justify-end gap-1 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  Game best <SortIcon field="bestGameScore" sort={sort} />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button onClick={() => toggleSort('flaggedCount')} className="flex w-full items-center justify-end gap-1 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  Flag <SortIcon field="flaggedCount" sort={sort} />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button onClick={() => toggleSort('current_streak')} className="flex w-full items-center justify-end gap-1 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  Streak <SortIcon field="current_streak" sort={sort} />
                </button>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">Akcija</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-sm text-[var(--muted-foreground)]">Nema rezultata</td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/20 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/admin/korisnici/${p.id}`} className="font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors">
                    {p.username}
                  </Link>
                  <div className="text-xs text-[var(--muted-foreground)]">Registrovan {formatDate(p.created_at)}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {p.is_admin && <span className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs bg-[var(--accent)]/10 text-[var(--accent)]"><Shield className="h-3 w-3" />Admin</span>}
                    {p.is_banned && <span className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs bg-[var(--incorrect)]/10 text-[var(--incorrect)]"><Ban className="h-3 w-3" />Ban</span>}
                    {p.flaggedCount > 0 && <span className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs bg-amber-500/10 text-amber-500"><Flag className="h-3 w-3" />{p.flaggedCount}</span>}
                    {!p.is_admin && !p.is_banned && p.flaggedCount === 0 && <span className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs bg-[var(--correct)]/10 text-[var(--correct)]"><CheckCircle className="h-3 w-3" />Aktivan</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{formatDate(p.lastActivityAt)}</td>
                <td className="px-4 py-3 text-right font-mono text-[var(--foreground)]">
                  {p.totalTests}
                  <div className="text-xs text-[var(--muted-foreground)]">R {p.rankTests} / V {p.practiceTests}</div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-[var(--accent)]">{p.bestWpm || '—'}</td>
                <td className="px-4 py-3 text-right font-mono text-[var(--foreground)]">{p.bestGameScore || '—'}</td>
                <td className="px-4 py-3 text-right font-mono text-[var(--incorrect)]">{p.flaggedCount || '—'}</td>
                <td className="px-4 py-3 text-right font-mono text-[var(--muted-foreground)]">{p.current_streak}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/korisnici/${p.id}`} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors">
                    Detalji →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-right text-xs text-[var(--muted-foreground)]">{filtered.length} prikazano</p>
    </div>
  )
}
