'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { sr } from 'date-fns/locale'

interface PbRow {
  id: string
  script: string
  category: string
  game_mode: 'rank' | 'vezba'
  timer_seconds: number | null
  strict_mode: boolean
  level: string | null
  best_wpm: number
  best_score: number
  best_accuracy: number
}

interface ScoreRow {
  wpm: number
  accuracy: number
  created_at: string
  script: string
  category: string
  mode: string
  level: string | null
  timer_seconds: number | null
  strict_mode: boolean
}

interface GamePb {
  score: number
  level: number
  elapsed_seconds: number
  words_destroyed: number
}

interface Props {
  rankPbs: PbRow[]
  vezbaPbs: PbRow[]
  recentScores: ScoreRow[]
  gamePb: GamePb | null
}

const SCRIPT_LABELS: Record<string, string> = {
  latinica: 'Latinica',
  cirilica: 'Ćirilica',
  easy: 'Bez kvačica',
  'latinica-bez-kvacica': 'Bez kvačica',
}

const CATEGORY_LABELS: Record<string, string> = {
  reci: 'Reči',
  recenice: 'Tekst',
}

const LEVEL_LABELS: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
}

function vezbaLabel(pb: PbRow): string {
  const script = SCRIPT_LABELS[pb.script] ?? pb.script
  const cat = CATEGORY_LABELS[pb.category] ?? pb.category
  const parts = [script, cat]
  if (pb.level) parts.push(LEVEL_LABELS[pb.level] ?? pb.level)
  if (pb.timer_seconds) parts.push(`${pb.timer_seconds}s`)
  if (pb.strict_mode) parts.push('100% tačnost')
  return parts.join(' · ')
}

type Tab = 'rank' | 'vezba' | 'nedavni' | 'igra'

const TABS: { id: Tab; label: string }[] = [
  { id: 'rank', label: 'Rank rekordi' },
  { id: 'vezba', label: 'Vežba rekordi' },
  { id: 'nedavni', label: 'Nedavni testovi' },
  { id: 'igra', label: 'Igrica' },
]

export function ProfilTabs({ rankPbs, vezbaPbs, recentScores, gamePb }: Props) {
  const [active, setActive] = useState<Tab>('rank')

  return (
    <div>
      {/* Tab header */}
      <div className="flex border-b border-[var(--border)] mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              active === tab.id
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Rank rekordi */}
      {active === 'rank' && (
        rankPbs.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">Još nema rank rekorda.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <th className="px-4 py-2.5 text-left font-medium text-[var(--muted-foreground)]">Pismo</th>
                  <th className="px-4 py-2.5 text-left font-medium text-[var(--muted-foreground)]">Kategorija</th>
                  <th className="px-4 py-2.5 text-right font-mono font-medium text-[var(--muted-foreground)]">Skor</th>
                  <th className="px-4 py-2.5 text-right font-mono font-medium text-[var(--muted-foreground)]">WPM</th>
                  <th className="px-4 py-2.5 text-right font-mono font-medium text-[var(--muted-foreground)]">Tačnost</th>
                </tr>
              </thead>
              <tbody className="bg-[var(--card)]">
                {rankPbs.map((pb) => (
                  <tr key={pb.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 text-[var(--foreground)]">
                      {SCRIPT_LABELS[pb.script] ?? pb.script}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">
                      {CATEGORY_LABELS[pb.category] ?? pb.category}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[var(--accent)]">
                      {Math.round(pb.best_score)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--foreground)]">
                      {Math.round(pb.best_wpm)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--foreground)]">
                      {Math.round(pb.best_accuracy)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Vežba rekordi */}
      {active === 'vezba' && (
        vezbaPbs.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">Još nema vežba rekorda.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <th className="px-4 py-2.5 text-left font-medium text-[var(--muted-foreground)]">Kombinacija</th>
                  <th className="px-4 py-2.5 text-right font-mono font-medium text-[var(--muted-foreground)]">WPM</th>
                  <th className="px-4 py-2.5 text-right font-mono font-medium text-[var(--muted-foreground)]">Tačnost</th>
                </tr>
              </thead>
              <tbody className="bg-[var(--card)]">
                {vezbaPbs.map((pb) => (
                  <tr key={pb.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 text-[var(--foreground)]">{vezbaLabel(pb)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[var(--accent)]">
                      {Math.round(pb.best_wpm)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--foreground)]">
                      {Math.round(pb.best_accuracy)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Igrica best score */}
      {active === 'igra' && (
        !gamePb ? (
          <p className="text-sm text-[var(--muted-foreground)]">Još nema odigranih partija.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <th className="px-4 py-2.5 text-right font-mono font-medium text-[var(--muted-foreground)]">Score</th>
                  <th className="px-4 py-2.5 text-right font-mono font-medium text-[var(--muted-foreground)]">Level</th>
                  <th className="px-4 py-2.5 text-right font-mono font-medium text-[var(--muted-foreground)]">Vreme</th>
                  <th className="px-4 py-2.5 text-right font-mono font-medium text-[var(--muted-foreground)]">Reči</th>
                </tr>
              </thead>
              <tbody className="bg-[var(--card)]">
                <tr>
                  <td className="px-4 py-3 text-right font-mono font-bold text-[var(--accent)]">
                    {gamePb.score.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[var(--foreground)]">
                    {gamePb.level}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[var(--foreground)]">
                    {Math.floor(gamePb.elapsed_seconds / 60)}:{(gamePb.elapsed_seconds % 60).toString().padStart(2, '0')}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[var(--foreground)]">
                    {gamePb.words_destroyed}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Nedavni testovi */}
      {active === 'nedavni' && (
        recentScores.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">Još nema testova.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <th className="px-4 py-2.5 text-left font-medium text-[var(--muted-foreground)]">Kombinacija</th>
                  <th className="px-4 py-2.5 text-right font-mono font-medium text-[var(--muted-foreground)]">WPM</th>
                  <th className="px-4 py-2.5 text-right font-mono font-medium text-[var(--muted-foreground)]">Tačnost</th>
                  <th className="px-4 py-2.5 text-right font-medium text-[var(--muted-foreground)]">Kad</th>
                </tr>
              </thead>
              <tbody className="bg-[var(--card)]">
                {recentScores.map((score, i) => {
                  const parts = [SCRIPT_LABELS[score.script] ?? score.script]
                  if (score.mode === 'rank') {
                    parts.push('Rank')
                  } else {
                    parts.push(CATEGORY_LABELS[score.category] ?? score.category)
                    if (score.level) parts.push(LEVEL_LABELS[score.level] ?? score.level)
                    if (score.timer_seconds) parts.push(`${score.timer_seconds}s`)
                    if (score.strict_mode) parts.push('100% tačnost')
                  }
                  return (
                    <tr key={i} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-4 py-3 text-[var(--foreground)]">{parts.join(' · ')}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-[var(--foreground)]">
                        {Math.round(score.wpm)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--muted-foreground)]">
                        {Math.round(score.accuracy)}%
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--muted-foreground)]">
                        {formatDistanceToNow(new Date(score.created_at), { addSuffix: true, locale: sr })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
