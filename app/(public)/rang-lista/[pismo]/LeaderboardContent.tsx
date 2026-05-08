'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Crown, Medal } from 'lucide-react'

type Script = 'latinica' | 'cirilica' | 'easy'
type Category = 'reci' | 'recenice' | 'tekst'
type Period = 'daily' | 'weekly' | 'monthly'

const CATEGORY_LABELS: Record<Category, string> = {
  reci: 'Reči',
  recenice: 'Rečenice',
  tekst: 'Tekst',
}

const PERIOD_LABELS: Record<Period, string> = {
  daily: 'Dnevna',
  weekly: 'Nedeljna',
  monthly: 'Mesečna',
}

interface LeaderboardEntry {
  user_id: string
  username: string
  wpm: number
  raw_wpm?: number
  accuracy: number
  score: number
  daily_rank?: number
  weekly_rank?: number
  monthly_rank?: number
  test_count?: number
}

interface Props {
  script: Script
}

export function LeaderboardContent({ script }: Props) {
  const searchParams = useSearchParams()
  const [period, setPeriod] = useState<Period>('daily')
  const [category, setCategory] = useState<Category>('reci')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const p = searchParams.get('period') as Period | null
    const c = searchParams.get('category') as Category | null
    if (p && ['daily', 'weekly', 'monthly'].includes(p)) setPeriod(p)
    if (c && ['reci', 'recenice', 'tekst'].includes(c)) setCategory(c)
  }, [searchParams])

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/leaderboard?script=${script}&category=${category}&period=${period}&limit=25`)
      .then((r) => r.json())
      .then((j) => {
        setEntries((j.data ?? []) as LeaderboardEntry[])
        setLoading(false)
      })
      .catch(() => {
        setError('Greška pri učitavanju rang liste.')
        setLoading(false)
      })
  }, [script, category, period])

  return (
    <div>
      {/* Period tabs */}
      <div className="mb-4 flex gap-2">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              p === period
                ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                : 'border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]',
            )}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="mb-6 flex gap-2">
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              c === category
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : 'border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
            )}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading && (
        <div className="py-16 text-center text-sm text-[var(--muted-foreground)]">Učitavam…</div>
      )}
      {error && (
        <div className="rounded-md border border-[var(--incorrect)]/30 bg-[var(--incorrect)]/10 px-3 py-4 text-center text-sm text-[var(--incorrect)]">
          {error}
        </div>
      )}
      {!loading && !error && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
          {entries.length === 0 ? (
            <p className="py-16 text-center text-sm text-[var(--muted-foreground)]">
              Još nema rezultata za ovaj period.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">Korisnik</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">WPM</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">Tačnost</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">Skor</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const rank = i + 1
                  return (
                    <tr
                      key={entry.user_id + i}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono">
                        {rank === 1 ? (
                          <Crown className="h-4 w-4 text-[var(--accent)]" />
                        ) : rank === 2 ? (
                          <Medal className="h-4 w-4 text-zinc-400" />
                        ) : rank === 3 ? (
                          <Medal className="h-4 w-4 text-amber-700" />
                        ) : (
                          <span className="text-[var(--muted-foreground)]">{rank}.</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/profil/${entry.username}`}
                          className="font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
                        >
                          {entry.username}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-[var(--accent)]">
                        {Math.round(entry.wpm)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--muted-foreground)]">
                        {Math.round(entry.accuracy)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--muted-foreground)]">
                        {Math.round(entry.score)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
