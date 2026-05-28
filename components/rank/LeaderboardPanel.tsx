'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Crown, Medal } from 'lucide-react'
import { cn } from '@/lib/utils'

export type LeaderboardScript = 'latinica' | 'cirilica' | 'latinica-bez-kvacica'
export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

const SCRIPT_LABELS: Record<LeaderboardScript, string> = {
  latinica: 'Latinica',
  cirilica: 'Ćirilica',
  'latinica-bez-kvacica': 'Latinica bez kvačica',
}

const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  daily: 'Dnevna',
  weekly: 'Nedeljna',
  monthly: 'Mesečna',
  yearly: 'Godišnja',
}

const SR_MONTHS = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar']

interface DailyEntry {
  user_id: string
  username: string
  wpm: number
  raw_wpm?: number
  accuracy: number
  score: number
}

interface PeriodEntry {
  user_id: string
  username: string
  avg_wpm: number
  avg_accuracy: number
  active_days: number
  total_days: number
  period_score: number
  period_rank: number
}

type Entry = DailyEntry | PeriodEntry

interface Props {
  script: LeaderboardScript
  initialPeriod?: LeaderboardPeriod
  currentUserId?: string
  navigationBase?: '/rank' | '/rang-lista'
  showScriptTabs?: boolean
  titlePrefix?: string
  compact?: boolean
}

function formatDay(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}.`
}

function getIsoWeekInfo(now: Date) {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = date.getDay() || 7
  const monday = new Date(date)
  monday.setDate(date.getDate() - day + 1)
  const thursday = new Date(monday)
  thursday.setDate(monday.getDate() + 3)
  const firstThursday = new Date(thursday.getFullYear(), 0, 4)
  const firstThursdayDay = firstThursday.getDay() || 7
  const firstWeekMonday = new Date(firstThursday)
  firstWeekMonday.setDate(firstThursday.getDate() - firstThursdayDay + 1)
  const weekNum = Math.floor((monday.getTime() - firstWeekMonday.getTime()) / (7 * 86400000)) + 1
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return { weekNum, monday, sunday }
}

function getPeriodSub(period: LeaderboardPeriod): string {
  const now = new Date()

  if (period === 'daily') {
    return formatDay(now)
  }

  if (period === 'weekly') {
    const { weekNum, monday, sunday } = getIsoWeekInfo(now)
    return `KW${weekNum} · ${formatDay(monday)} – ${formatDay(sunday)}`
  }

  if (period === 'monthly') {
    return `${SR_MONTHS[now.getMonth()]} ${now.getFullYear()}.`
  }

  return `${now.getFullYear()}.`
}

function buildNavigationTarget(base: '/rank' | '/rang-lista', script: LeaderboardScript): string {
  if (base === '/rang-lista' && script === 'latinica-bez-kvacica') {
    return '/rang-lista/easy'
  }

  return `${base}/${script}`
}

function getPanelTitle(prefix: string, period: LeaderboardPeriod, script: LeaderboardScript): string {
  return `${PERIOD_LABELS[period]} ${prefix} — ${SCRIPT_LABELS[script]}`
}

export function LeaderboardPanel({
  script,
  initialPeriod = 'daily',
  currentUserId,
  navigationBase = '/rang-lista',
  showScriptTabs = true,
  titlePrefix = 'rank lista',
  compact = false,
}: Props) {
  const router = useRouter()
  const [period, setPeriod] = useState<LeaderboardPeriod>(initialPeriod)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dailyCategory, setDailyCategory] = useState<string | null>(null)

  useEffect(() => {
    setPeriod(initialPeriod)
  }, [initialPeriod, script])

  useEffect(() => {
    fetch(`/api/daily-text?script=${script}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setDailyCategory(j?.category ?? null))
      .catch(() => {})
  }, [script])

  useEffect(() => {
    setLoading(true)
    setError(null)
    const catParam = period === 'daily' && dailyCategory ? `&category=${dailyCategory}` : ''
    fetch(`/api/leaderboard?script=${script}&period=${period}&limit=25${catParam}`)
      .then((r) => r.json())
      .then((j) => {
        setEntries((j.data ?? []) as Entry[])
        setLoading(false)
      })
      .catch(() => {
        setError('Greška pri učitavanju rank liste.')
        setLoading(false)
      })
  }, [script, period, dailyCategory])

  const pismoTabovi: LeaderboardScript[] = ['latinica', 'cirilica', 'latinica-bez-kvacica']
  const title = getPanelTitle(titlePrefix, period, script)

  return (
    <div>
      {showScriptTabs && (
        <div className="mb-4 flex gap-2 flex-wrap">
          {pismoTabovi.map((p) => (
            <button
              key={p}
              onClick={() => router.push(buildNavigationTarget(navigationBase, p))}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                p === script
                  ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                  : 'border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]',
              )}
            >
              {SCRIPT_LABELS[p]}
            </button>
          ))}
        </div>
      )}

      <div className="mb-2 flex gap-2 flex-wrap">
        {(Object.keys(PERIOD_LABELS) as LeaderboardPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              p === period
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : 'border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]',
            )}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      <p className="mb-5 text-[11px] font-mono text-[var(--muted-foreground)]">
        {getPeriodSub(period)}
      </p>

      {loading && (
        <div className="py-12 text-center text-sm text-[var(--muted-foreground)]">Učitavam…</div>
      )}
      {error && (
        <div className="rounded-md border border-[var(--incorrect)]/30 bg-[var(--incorrect)]/10 px-3 py-4 text-center text-sm text-[var(--incorrect)]">
          {error}
        </div>
      )}
      {!loading && !error && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
          </div>
          {entries.length === 0 ? (
            <p className="py-16 text-center text-sm text-[var(--muted-foreground)]">
              Još nema rezultata za ovaj period.
            </p>
          ) : period === 'daily' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">Korisnik</th>
                  {!compact && <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">Skor</th>}
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">WPM</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">Tačnost</th>
                </tr>
              </thead>
              <tbody>
                {(entries as DailyEntry[]).map((entry, i) => {
                  const rank = i + 1
                  const isMe = entry.user_id === currentUserId
                  return (
                    <tr
                      key={entry.user_id + i}
                      className={cn(
                        'border-b border-[var(--border)] last:border-0 transition-colors',
                        isMe ? 'bg-[var(--accent)]/10' : 'hover:bg-[var(--muted)]/30',
                      )}
                    >
                      <td className="px-4 py-3 font-mono">
                        {rank === 1 ? <Crown className="h-4 w-4 text-[var(--accent)]" />
                          : rank === 2 ? <Medal className="h-4 w-4 text-zinc-400" />
                          : rank === 3 ? <Medal className="h-4 w-4 text-amber-700" />
                          : <span className="text-[var(--muted-foreground)]">{rank}.</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/profil/${entry.username}`} className="font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors">
                          {entry.username}
                        </Link>
                        {isMe && <span className="ml-2 text-xs text-[var(--accent)]">(ti)</span>}
                      </td>
                      {!compact && (
                        <td className="px-4 py-3 text-right font-mono font-bold text-[var(--accent)]">
                          {Math.round(entry.score)}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right font-mono font-bold text-[var(--accent)]">{Math.round(entry.wpm)}</td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--muted-foreground)]">{Math.round(entry.accuracy)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">Korisnik</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">Prosek WPM</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">Tačnost</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">Dani</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">Period skor</th>
                </tr>
              </thead>
              <tbody>
                {(entries as PeriodEntry[]).map((entry, i) => {
                  const rank = i + 1
                  const isMe = entry.user_id === currentUserId
                  return (
                    <tr
                      key={entry.user_id + i}
                      className={cn(
                        'border-b border-[var(--border)] last:border-0 transition-colors',
                        isMe ? 'bg-[var(--accent)]/10' : 'hover:bg-[var(--muted)]/30',
                      )}
                    >
                      <td className="px-4 py-3 font-mono">
                        {rank === 1 ? <Crown className="h-4 w-4 text-[var(--accent)]" />
                          : rank === 2 ? <Medal className="h-4 w-4 text-zinc-400" />
                          : rank === 3 ? <Medal className="h-4 w-4 text-amber-700" />
                          : <span className="text-[var(--muted-foreground)]">{rank}.</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/profil/${entry.username}`} className="font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors">
                          {entry.username}
                        </Link>
                        {isMe && <span className="ml-2 text-xs text-[var(--accent)]">(ti)</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-[var(--accent)]">{Math.round(entry.avg_wpm ?? 0)}</td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--muted-foreground)]">{Math.round(entry.avg_accuracy ?? 0)}%</td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--muted-foreground)]">
                        <span className="text-[var(--foreground)]">{entry.active_days ?? 0}</span>
                        <span className="text-[var(--muted-foreground)]">/{entry.total_days ?? 0}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-[var(--foreground)]">{Math.round(entry.period_score ?? 0)}</td>
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
