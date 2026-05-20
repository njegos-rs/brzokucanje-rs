'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Crown, Medal } from 'lucide-react'

type Script = 'latinica' | 'cirilica' | 'latinica-bez-kvacica'
type Period = 'daily' | 'weekly' | 'monthly' | 'yearly'

const SCRIPT_LABELS: Record<Script, string> = {
  latinica: 'Latinica',
  cirilica: 'Ćirilica',
  'latinica-bez-kvacica': 'Latinica bez kvačica',
}

function scriptToSlug(script: Script): string {
  return script === 'latinica-bez-kvacica' ? 'easy' : script
}

const PERIOD_LABELS: Record<Period, string> = {
  daily: 'Dnevna',
  weekly: 'Nedeljna',
  monthly: 'Mesečna',
  yearly: 'Godišnja',
}

const SR_MONTHS = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar']

function getPeriodSub(period: Period): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')

  if (period === 'daily') {
    return `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}.`
  }

  if (period === 'weekly') {
    const day = now.getDay() === 0 ? 7 : now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - day + 1)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    const jan4 = new Date(now.getFullYear(), 0, 4)
    const startOfW1 = new Date(jan4)
    startOfW1.setDate(jan4.getDate() - (jan4.getDay() === 0 ? 6 : jan4.getDay() - 1))
    const weekNum = Math.floor((monday.getTime() - startOfW1.getTime()) / (7 * 86400000)) + 1

    const fmtDay = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}.`
    return `KW${weekNum} · ${fmtDay(monday)} – ${fmtDay(sunday)}`
  }

  if (period === 'monthly') {
    return `${SR_MONTHS[now.getMonth()]} ${now.getFullYear()}.`
  }

  // yearly
  return `${now.getFullYear()}.`
}

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
  script: Script
}

export function LeaderboardContent({ script }: Props) {
  const router = useRouter()
  const [period, setPeriod] = useState<Period>('daily')
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dailyCategory, setDailyCategory] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/daily-text?script=${script}`)
      .then((r) => r.ok ? r.json() : null)
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

  const pismoTabovi: Script[] = ['latinica', 'cirilica', 'latinica-bez-kvacica']

  return (
    <div>
      {/* Pismo tabovi */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {pismoTabovi.map((p) => (
          <button
            key={p}
            onClick={() => router.push(`/rang-lista/${scriptToSlug(p)}`)}
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

      {/* Period tabs */}
      <div className="mb-2 flex gap-2 flex-wrap">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
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
          ) : period === 'daily' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">Korisnik</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">Skor</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">WPM</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">Tačnost</th>
                </tr>
              </thead>
              <tbody>
                {(entries as DailyEntry[]).map((entry, i) => {
                  const rank = i + 1
                  return (
                    <tr key={entry.user_id + i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/30 transition-colors">
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
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-[var(--accent)]">{Math.round(entry.score)}</td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--muted-foreground)]">{Math.round(entry.wpm)}</td>
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
                  return (
                    <tr key={entry.user_id + i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/30 transition-colors">
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
