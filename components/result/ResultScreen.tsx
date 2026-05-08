'use client'

import { useEffect } from 'react'
import { RotateCcw, ChevronRight, Crown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { WpmChart } from './WpmChart'
import type { ScoringResult } from '@/lib/typing/scoring'
import type { WpmSnapshot } from '@/lib/typing/engine'
import { cn } from '@/lib/utils'

interface Props {
  result: ScoringResult
  wpmHistory: WpmSnapshot[]
  isNewPb?: boolean
  onRetry: () => void
  onNext: () => void
  testMeta?: {
    script: string
    difficulty?: string
    wordCount?: number
  }
}

function StatCell({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <p className={cn('font-mono font-bold', accent ? 'text-[var(--accent)]' : 'text-[var(--foreground)]')}>
        {value}
      </p>
      {sub && <p className="mt-0.5 font-mono text-xs text-[var(--muted-foreground)]">{sub}</p>}
      <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">{label}</p>
    </div>
  )
}

export function ResultScreen({ result, wpmHistory, isNewPb, onRetry, onNext, testMeta }: Props) {
  useEffect(() => {
    if (isNewPb) {
      toast(`Novi lični rekord! ${Math.round(result.wpm)} WPM`, {
        icon: '👑',
        duration: 4000,
      })
    }
  }, [isNewPb, result.wpm])

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 animate-in fade-in duration-300">
      {/* Top — WPM + ACC */}
      <div className="mb-8 flex items-end gap-8">
        <div>
          <div className="flex items-center gap-3">
            <p className="font-mono text-7xl font-bold text-[var(--accent)] leading-none">
              {Math.round(result.wpm)}
            </p>
            <AnimatePresence>
              {isNewPb && (
                <motion.div
                  initial={{ scale: 0, rotate: -20, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
                >
                  <Crown className="h-8 w-8 text-[var(--accent)]" aria-label="Novi lični rekord!" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="mt-1 text-xs uppercase tracking-widest text-[var(--muted-foreground)]">wpm</p>
        </div>
        <div className="mb-1">
          <p className="font-mono text-5xl font-bold text-[var(--foreground)] leading-none">
            {Math.round(result.accuracy)}%
          </p>
          <p className="mt-1 text-xs uppercase tracking-widest text-[var(--muted-foreground)]">tačnost</p>
        </div>
        {isNewPb && (
          <motion.div
            className="mb-1 ml-auto"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <span className="rounded-full bg-[var(--accent)]/15 px-3 py-1 text-xs font-medium text-[var(--accent)]">
              Novi rekord!
            </span>
          </motion.div>
        )}
      </div>

      {/* Graf */}
      {wpmHistory.length > 1 && (
        <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <WpmChart data={wpmHistory} finalWpm={Math.round(result.wpm)} rawWpm={Math.round(result.rawWpm)} />
        </div>
      )}

      {/* Dodatne statistike */}
      <div className="mb-6 grid grid-cols-4 gap-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <StatCell label="raw" value={String(Math.round(result.rawWpm))} />
        <StatCell label="konzistentnost" value={`${Math.round(result.consistency)}%`} />
        <StatCell label="score" value={String(Math.round(result.score))} />
        {testMeta && (
          <StatCell label="test" value={testMeta.script} sub={testMeta.difficulty} />
        )}
      </div>

      {/* Action dugmad */}
      <div className="flex justify-center gap-3">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-md border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          title="Tab"
        >
          <RotateCcw className="h-4 w-4" />
          Ponovi
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90 transition-opacity"
        >
          Sledeći test
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
