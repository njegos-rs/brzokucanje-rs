'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTypingEngine, type WpmSnapshot, type TestMode, type TestLevel, type TimerDuration } from '@/lib/typing/engine'
import { TypingArea } from '@/components/typing/TypingArea'
import { WpmChart } from '@/components/result/WpmChart'
import { loadWords, loadTexts, buildWordTest, buildPhraseTest, getRandomWordCount } from '@/lib/words/loader'
import { cn } from '@/lib/utils'
import { RotateCcw, ChevronRight } from 'lucide-react'
import type { ScoringResult } from '@/lib/typing/scoring'

type Script = 'latinica' | 'cirilica' | 'easy'

interface Props {
  pismo: Script
}

const SCRIPT_LABELS: Record<Script, string> = {
  latinica: 'Latinica',
  cirilica: 'Ћирилица',
  easy: 'Latinica bez kvačica',
}

const MODE_LABELS: Record<TestMode, string> = {
  vreme: 'Vreme',
  reci: 'Reči',
  tekst: 'Tekst',
}

const LEVEL_LABELS: Record<TestLevel, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
}

const TIMER_OPTIONS: TimerDuration[] = [15, 30, 60]

interface FinishedState {
  result: ScoringResult
  wpmHistory: WpmSnapshot[]
}

function makeText(pismo: Script, mode: TestMode, level: TestLevel): string {
  if (mode === 'tekst') {
    const texts = loadTexts(pismo, level)
    return buildPhraseTest(texts, 4)
  }
  const words = loadWords(pismo, level)
  if (mode === 'vreme') return buildWordTest(words, 80)
  return buildWordTest(words, getRandomWordCount(level))
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const v = localStorage.getItem(key)
    return v !== null ? (JSON.parse(v) as T) : fallback
  } catch { return fallback }
}

function writeStorage(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
}

export function VezbaClient({ pismo }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<TestMode>(() => readStorage('vezba_mode', 'reci'))
  const [level, setLevel] = useState<TestLevel>(() => readStorage('vezba_level', 'easy'))
  const [timerDuration, setTimerDuration] = useState<TimerDuration>(() => readStorage('vezba_timer', 30))
  const [strictMode, setStrictMode] = useState<boolean>(() => readStorage('vezba_strict', false))
  const [finished, setFinished] = useState<FinishedState | null>(null)
  const [text, setText] = useState('')
  const pismoRef = useRef(pismo)
  const modeRef = useRef<TestMode>(readStorage('vezba_mode', 'reci'))
  const levelRef = useRef<TestLevel>(readStorage('vezba_level', 'easy'))

  // Generišemo tekst tek na klijentu
  useEffect(() => {
    setText(makeText(pismoRef.current, modeRef.current, levelRef.current))
  }, [])

  // Kad se promeni pismo (navigacija), regeneriši — ali sačuvaj mode/level
  useEffect(() => {
    if (pismo !== pismoRef.current) {
      pismoRef.current = pismo
      const newText = makeText(pismo, modeRef.current, levelRef.current)
      setText(newText)
      setFinished(null)
    }
  }, [pismo])

  const changeMode = useCallback((m: TestMode) => {
    modeRef.current = m
    setMode(m)
    writeStorage('vezba_mode', m)
    setText(makeText(pismoRef.current, m, levelRef.current))
    setFinished(null)
  }, [])

  const changeLevel = useCallback((l: TestLevel) => {
    levelRef.current = l
    setLevel(l)
    writeStorage('vezba_level', l)
    setText(makeText(pismoRef.current, modeRef.current, l))
    setFinished(null)
  }, [])

  const changeTimerDuration = useCallback((t: TimerDuration) => {
    setTimerDuration(t)
    writeStorage('vezba_timer', t)
  }, [])

  const changeStrictMode = useCallback((v: boolean) => {
    setStrictMode(v)
    writeStorage('vezba_strict', v)
  }, [])

  const changePismo = useCallback((s: Script) => {
    pismoRef.current = s
    router.push(`/vezbaj/${s}`)
  }, [router])

  const getMoreText = useCallback(() => {
    return buildWordTest(loadWords(pismoRef.current, levelRef.current), 40)
  }, [])

  const handleFinish = useCallback((result: ScoringResult, _ks: unknown[], wpmHistory: WpmSnapshot[]) => {
    setFinished({ result, wpmHistory })
  }, [])

  const { chars, cursor, status, timeLeft, spaceBlocked, handleKeyDown, reset } = useTypingEngine({
    text,
    mode,
    timerDuration,
    strictMode,
    onFinish: handleFinish,
    onNeedMoreText: getMoreText,
  })

  const handleNewTest = useCallback(() => {
    setText(makeText(pismoRef.current, modeRef.current, levelRef.current))
    setFinished(null)
  }, [])

  const handleReset = useCallback(() => {
    reset()
    setFinished(null)
  }, [reset])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') { e.preventDefault(); handleReset() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleReset])

  return (
    <div className="mx-auto max-w-2xl px-4 py-24">
      {/* Kontrolna traka */}
      <div className="mb-5 flex flex-col gap-2.5">

        {/* Red 1: Pisma levo + Težina desno */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
            {(Object.keys(SCRIPT_LABELS) as Script[]).map((s) => (
              <button
                key={s}
                onClick={() => changePismo(s)}
                className={cn(
                  'px-3.5 py-1.5 text-sm font-medium transition-colors',
                  pismo === s
                    ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]',
                )}
              >
                {SCRIPT_LABELS[s]}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
            {(Object.keys(LEVEL_LABELS) as TestLevel[]).map((l) => (
              <button
                key={l}
                onClick={() => changeLevel(l)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium transition-colors',
                  level === l
                    ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]',
                )}
              >
                {LEVEL_LABELS[l]}
              </button>
            ))}
          </div>
        </div>

        {/* Red 2: Modovi levo + 100% tačnost toggle desno */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
            {(Object.keys(MODE_LABELS) as TestMode[]).map((m) => (
              <button
                key={m}
                onClick={() => changeMode(m)}
                className={cn(
                  'px-3.5 py-1.5 text-sm font-medium transition-colors',
                  mode === m
                    ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]',
                )}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--muted-foreground)]">100% tačnost</span>
              <button
                onClick={() => changeStrictMode(!strictMode)}
                className={cn(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none',
                  strictMode ? 'bg-[var(--accent)]' : 'bg-[var(--border)]',
                )}
                role="switch"
                aria-checked={strictMode}
              >
                <span
                  className={cn(
                    'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
                    strictMode ? 'translate-x-4' : 'translate-x-0.5',
                  )}
                />
              </button>
            </div>
            <span className="text-[11px] text-[var(--muted-foreground)]/40">
              svako slovo mora biti na svom mestu
            </span>
          </div>
        </div>

        {/* Red 3: Timer — fiksirana visina, pojavljuje se samo kad je Vreme */}
        <div className="h-8 flex items-center">
          {mode === 'vreme' && (
            <div className="flex items-center gap-0.5">
              {TIMER_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => changeTimerDuration(t)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-sm font-mono font-medium transition-colors',
                    timerDuration === t
                      ? 'text-[var(--accent)] font-bold'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                  )}
                >
                  {t}s
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Typing area */}
      <TypingArea
        chars={chars}
        cursor={cursor}
        status={status}
        onKeyDown={handleKeyDown}
        timeLeft={timeLeft}
        mode={mode}
        spaceBlocked={spaceBlocked}
      />

      {/* Reset dugme — samo tokom kucanja */}
      {status !== 'idle' && !finished && (
        <div className="mt-5 flex justify-center">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]/50 hover:text-[var(--muted-foreground)] transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            restart (tab)
          </button>
        </div>
      )}

      {/* Rezultati — pojavljuju se odmah ispod typing areae */}
      {finished && (
        <div className="mt-6 animate-in fade-in duration-300">

          {/* Dugmad odmah ispod — vidljiva bez skrolanja */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Ponovi (Tab)
            </button>
            <button
              onClick={handleNewTest}
              className="flex items-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90 transition-opacity"
            >
              Sledeći test
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Glavni brojevi */}
          <div className="flex items-end gap-6 mb-6">
            <div>
              <p className="font-mono text-5xl font-bold text-[var(--accent)] leading-none">
                {Math.round(finished.result.wpm)}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">wpm</p>
            </div>
            <div className="mb-0.5">
              <p className="font-mono text-3xl font-bold text-[var(--foreground)] leading-none">
                {Math.round(finished.result.accuracy)}%
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">tačnost</p>
            </div>
          </div>

          {/* Sekundarne metrike */}
          <div className="flex gap-6 mb-6 text-sm font-mono">
            <div>
              <p className="text-[var(--foreground)]">{Math.round(finished.result.rawWpm)}</p>
              <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] mt-0.5">raw</p>
            </div>
            <div>
              <p className="text-[var(--foreground)]">{Math.round(finished.result.consistency)}%</p>
              <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] mt-0.5">konzistentnost</p>
            </div>
            <div>
              <p className="text-[var(--foreground)]">{Math.round(finished.result.score)}</p>
              <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] mt-0.5">score</p>
            </div>
          </div>

          {/* Chart */}
          {finished.wpmHistory.length > 1 && (
            <div className="mb-6">
              <WpmChart data={finished.wpmHistory} finalWpm={Math.round(finished.result.wpm)} rawWpm={Math.round(finished.result.rawWpm)} />
            </div>
          )}

          {/* Legenda metrika */}
          <div className="text-xs text-[var(--muted-foreground)] space-y-1.5 border-t border-[var(--border)] pt-4">
            <p><span className="text-[var(--foreground)]">wpm</span> — reči u minuti (5 tačnih znakova = 1 reč)</p>
            <p><span className="text-[var(--foreground)]">raw</span> — sve ukucane znakove, uključujući greške</p>
            <p><span className="text-[var(--foreground)]">tačnost</span> — procenat tačno ukucanih znakova</p>
            <p><span className="text-[var(--foreground)]">konzistentnost</span> — ravnomernost ritma kucanja; 100% = jednak razmak između svakog udara, niže = oscilacije u brzini</p>
            <p><span className="text-[var(--foreground)]">score</span> — rezultat svih parametara</p>
          </div>
        </div>
      )}
    </div>
  )
}
