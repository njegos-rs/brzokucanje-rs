'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTypingEngine } from '@/lib/typing/engine'
import { TypingArea } from '@/components/typing/TypingArea'
import { LiveStats } from '@/components/typing/LiveStats'
import { buildWordTest } from '@/lib/words/loader'
import { cn } from '@/lib/utils'
import { RotateCcw } from 'lucide-react'

type Script = 'latinica' | 'cirilica' | 'easy'
type Difficulty = 'lake' | 'srednje' | 'teske'
type Category = 'reci' | 'recenice'

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

export function VezbaClient({ pismo, initialWords }: Props) {
  const [difficulty, setDifficulty] = useState<Difficulty>('lake')
  const [wordCount, setWordCount] = useState(30)
  const [text, setText] = useState(() => buildWordTest(initialWords, 30))
  const [words, setWords] = useState(initialWords)
  const [lazyMode, setLazyMode] = useState(false)
  const [finished, setFinished] = useState(false)
  const [finalResult, setFinalResult] = useState<{ wpm: number; accuracy: number; errors: number } | null>(null)

  const handleFinish = useCallback((result: { wpm: number; accuracy: number; consistency: number; score: number; rawWpm: number }, _keystrokes: unknown[]) => {
    setFinalResult({ wpm: result.wpm, accuracy: result.accuracy, errors: 0 })
    setFinished(true)
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
    setFinished(false)
    setFinalResult(null)
  }, [words, wordCount])

  const handleReset = useCallback(() => {
    reset()
    setFinished(false)
    setFinalResult(null)
  }, [reset])

  // Učitaj nove reči kada se promeni težina
  useEffect(() => {
    import(`@/lib/words/${pismo}/${difficulty}.json`)
      .then((mod) => {
        const loaded = mod.default as string[]
        setWords(loaded)
        const newText = buildWordTest(loaded, wordCount)
        setText(newText)
        setFinished(false)
        setFinalResult(null)
      })
      .catch(console.error)
  }, [difficulty, pismo, wordCount])

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

      {/* Rezultat */}
      {finished && finalResult && (
        <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <h2 className="mb-4 text-lg font-medium text-[var(--foreground)]">Rezultat</h2>
          <div className="flex justify-center gap-10 font-mono">
            <div>
              <p className="text-4xl font-bold text-[var(--accent)]">{Math.round(finalResult.wpm)}</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)] uppercase tracking-wider">wpm</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-[var(--foreground)]">{Math.round(finalResult.accuracy)}%</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)] uppercase tracking-wider">tačnost</p>
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-md border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Ponovi
            </button>
            <button
              onClick={handleNewTest}
              className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90 transition-opacity"
            >
              Novi test
            </button>
          </div>
        </div>
      )}

      {/* Typing area */}
      {!finished && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <TypingArea
            chars={chars}
            cursor={cursor}
            status={status}
            onKeyDown={handleKeyDown}
          />
        </div>
      )}

      {/* Reset dugme */}
      {!finished && status !== 'idle' && (
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
