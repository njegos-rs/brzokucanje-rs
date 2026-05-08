'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTypingEngine, type WpmSnapshot } from '@/lib/typing/engine'
import { TypingArea } from '@/components/typing/TypingArea'
import { LiveStats } from '@/components/typing/LiveStats'
import { ResultScreen } from '@/components/result/ResultScreen'
import { buildWordTest } from '@/lib/words/loader'
import { cn } from '@/lib/utils'
import { RotateCcw } from 'lucide-react'
import type { ScoringResult } from '@/lib/typing/scoring'

type Script = 'latinica' | 'cirilica' | 'easy'
type Difficulty = 'lake' | 'srednje' | 'teske'

interface Props {
  pismo: Script
  initialWords: string[]
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  lake: 'Lake',
  srednje: 'Srednje',
  teske: 'Teške',
}

const SCRIPT_LABELS: Record<Script, string> = {
  latinica: 'Latinica',
  cirilica: 'Ćirilica',
  easy: 'Easy',
}

interface FinishedState {
  result: ScoringResult
  wpmHistory: WpmSnapshot[]
}

export function VezbaClient({ pismo, initialWords }: Props) {
  const [difficulty, setDifficulty] = useState<Difficulty>('lake')
  const [wordCount, setWordCount] = useState(30)
  const [text, setText] = useState(() => buildWordTest(initialWords, 30))
  const [words, setWords] = useState(initialWords)
  const [lazyMode, setLazyMode] = useState(false)
  const [finished, setFinished] = useState<FinishedState | null>(null)

  const handleFinish = useCallback((result: ScoringResult, _keystrokes: unknown[], wpmHistory: WpmSnapshot[]) => {
    setFinished({ result, wpmHistory })
  }, [])

  const { chars, cursor, status, errors, handleKeyDown, reset, liveStats } = useTypingEngine({
    text,
    lazyMode,
    onFinish: handleFinish,
  })

  const live = liveStats()

  const handleNewTest = useCallback(() => {
    const newText = buildWordTest(words, wordCount)
    setText(newText)
    setFinished(null)
    // engine se resetuje automatski kad se text promeni — ne treba eksplicitni reset
  }, [words, wordCount])

  const handleReset = useCallback(() => {
    reset()
    setFinished(null)
  }, [reset])

  // Tab shortcut za reset
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        handleReset()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleReset])

  // Učitaj nove reči kada se promeni težina
  useEffect(() => {
    import(`@/lib/words/${pismo}/${difficulty}.json`)
      .then((mod) => {
        const loaded = mod.default as string[]
        setWords(loaded)
        const newText = buildWordTest(loaded, wordCount)
        setText(newText)
        setFinished(null)
      })
      .catch(console.error)
  }, [difficulty, pismo, wordCount])

  if (finished) {
    return (
      <ResultScreen
        result={finished.result}
        wpmHistory={finished.wpmHistory}
        onRetry={handleReset}
        onNext={handleNewTest}
        testMeta={{ script: SCRIPT_LABELS[pismo], difficulty: DIFFICULTY_LABELS[difficulty] }}
      />
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header sa opcijama */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--muted-foreground)]">
            {SCRIPT_LABELS[pismo]}
          </span>
          <span className="text-[var(--border)]">·</span>
          <div className="flex gap-1">
            {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                  difficulty === d
                    ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                )}
              >
                {DIFFICULTY_LABELS[d]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Word count */}
          <div className="flex gap-1">
            {[15, 30, 50, 100].map((n) => (
              <button
                key={n}
                onClick={() => setWordCount(n)}
                className={cn(
                  'rounded px-2 py-1 text-xs font-mono transition-colors',
                  wordCount === n
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                )}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Lazy mode */}
          <button
            onClick={() => setLazyMode((v) => !v)}
            className={cn(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors border',
              lazyMode
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-[var(--border)] text-[var(--muted-foreground)]',
            )}
            title="Prihvata c umesto č/ć, s umesto š, itd."
          >
            lazy
          </button>
        </div>
      </div>

      {/* Live stats */}
      {status === 'running' && (
        <div className="mb-4 flex justify-center">
          <LiveStats
            wpm={live.wpm ?? 0}
            accuracy={live.accuracy ?? 100}
            errors={errors}
          />
        </div>
      )}

      {/* Typing area */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <TypingArea
          chars={chars}
          cursor={cursor}
          status={status}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* Reset dugme */}
      {status !== 'idle' && (
        <div className="mt-3 flex justify-center">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Resetuj (Tab)
          </button>
        </div>
      )}
    </div>
  )
}
