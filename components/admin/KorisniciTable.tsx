'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Shield, Ban, CheckCircle, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Profile {
  id: string
  username: string | null
  email: string | null
  created_at: string
  is_admin: boolean
  is_banned: boolean
  ban_reason: string | null
  current_streak: number
  newsletter_subscribed: boolean
}

type SortField = 'username' | 'created_at' | 'current_streak'
type SortDir = 'asc' | 'desc'
type Filter = 'all' | 'admin' | 'banned' | 'active'

interface Props {
  profiles: Profile[]
}

export function KorisniciTable({ profiles }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'created_at', dir: 'desc' })

  const filtered = useMemo(() => {
    let rows = profiles

    if (query.trim()) {
      const q = query.toLowerCase()
      rows = rows.filter(
        (p) => (p.username ?? '').toLowerCase().includes(q) || p.email?.toLowerCase().includes(q),
      )
    }

    if (filter === 'admin') rows = rows.filter((p) => p.is_admin)
    if (filter === 'banned') rows = rows.filter((p) => p.is_banned)
    if (filter === 'active') rows = rows.filter((p) => !p.is_banned && !p.is_admin)

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
        : { field, dir: 'desc' }
    )
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sort.field !== field) return <span className="h-3 w-3" />
    return sort.dir === 'asc'
      ? <ChevronUp className="h-3 w-3" />
      : <ChevronDown className="h-3 w-3" />
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pretraži po username ili email…"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'admin', 'banned', 'active'] as Filter[]).map((f) => (
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
              {f === 'all' ? 'Svi' : f === 'admin' ? 'Admin' : f === 'banned' ? 'Banovani' : 'Aktivni'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => toggleSort('username')}
                  className="flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Korisnik <SortIcon field="username" />
                </button>
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">Email</th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => toggleSort('created_at')}
                  className="flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Registrovan <SortIcon field="created_at" />
                </button>
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-right">
                <button
                  onClick={() => toggleSort('current_streak')}
                  className="flex items-center justify-end gap-1 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] w-full"
                >
                  Streak <SortIcon field="current_streak" />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">Akcija</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-[var(--muted-foreground)]">
                  Nema rezultata
                </td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/20 transition-colors">
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                  <Link href={`/admin/korisnici/${p.id}`} className="hover:text-[var(--accent)] transition-colors">
                   {p.username ?? 'Nepoznat'}
                  </Link>
                </td>
                <td className="hidden md:table-cell px-4 py-3 text-[var(--muted-foreground)] text-xs">
                  {p.email ?? '—'}
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)] text-xs">
                  {new Date(p.created_at).toLocaleDateString('sr-RS')}
                </td>
                <td className="hidden md:table-cell px-4 py-3 text-right font-mono text-[var(--muted-foreground)]">
                  {p.current_streak}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {p.is_admin && (
                      <span className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs bg-[var(--accent)]/10 text-[var(--accent)]">
                        <Shield className="h-3 w-3" />Admin
                      </span>
                    )}
                    {p.is_banned && (
                      <span className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs bg-[var(--incorrect)]/10 text-[var(--incorrect)]">
                        <Ban className="h-3 w-3" />Ban
                      </span>
                    )}
                    {!p.is_admin && !p.is_banned && (
                      <span className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs bg-[var(--correct)]/10 text-[var(--correct)]">
                        <CheckCircle className="h-3 w-3" />Aktivan
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/korisnici/${p.id}`}
                    className="text-xs text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
                  >
                    Detalji →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-[var(--muted-foreground)] text-right">{filtered.length} prikazano</p>
    </div>
  )
}
