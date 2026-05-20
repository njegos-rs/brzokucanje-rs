'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTypingEngine, type WpmSnapshot, type TestMode, type TestLevel, type TimerDuration, type KeystrokeEntry } from '@/lib/typing/engine'
import { TypingArea } from '@/components/typing/TypingArea'
import { WpmChart } from '@/components/result/WpmChart'
import { loadWords, loadTexts, buildWordTest, buildPhraseTest, getRandomWordCount } from '@/lib/words/loader'
import { cn } from '@/lib/utils'
import { RotateCcw, ChevronRight } from 'lucide-react'
import type { ScoringResult } from '@/lib/typing/scoring'
import { useSettingsStore } from '@/lib/stores/settings-store'
import { useKeystrokeSound } from '@/lib/hooks/useKeystrokeSound'

type Script = 'latinica' | 'cirilica' | 'easy'

interface Props {
  pismo: Script
}

const SCRIPT_LABELS: Record<Script, string> = {
  latinica: 'Latinica',
  cirilica: 'Ћирилица',
  easy: 'Latinica bez kvačica',
}

const MODE_LABELS: Record<Exclude<TestMode, 'vreme'>, string> = {
  reci: 'Reči',
  tekst: 'Tekst',
}

const LEVEL_LABELS: Record<TestLevel, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
}


interface FinishedState {
  result: ScoringResult
  wpmHistory: WpmSnapshot[]
}

function makeText(pismo: Script, contentMode: 'reci' | 'tekst', level: TestLevel, timerActive = false): string {
  if (contentMode === 'tekst') {
    const texts = loadTexts(pismo, level)
    return buildPhraseTest(texts, timerActive ? 12 : 4, level)
  }

  if (timerActive) {
    return buildWordTest(loadWords(pismo, level), 80, level)
  }
  return buildWordTest(loadWords(pismo, level), getRandomWordCount(level), level)
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
  const [contentMode, setContentMode] = useState<'reci' | 'tekst'>(() => readStorage('vezba_content_mode', 'reci'))
  const [level, setLevel] = useState<TestLevel>(() => readStorage('vezba_level', 'easy'))
  const [timerDuration, setTimerDuration] = useState<TimerDuration | null>(() => readStorage('vezba_timer', null))
  const [strictMode, setStrictMode] = useState<boolean>(() => readStorage('vezba_strict', false))
  const [finished, setFinished] = useState<FinishedState | null>(null)
  const [text, setText] = useState('')
  const pismoRef = useRef(pismo)
  const contentModeRef = useRef<'reci' | 'tekst'>(readStorage('vezba_content_mode', 'reci'))
  const levelRef = useRef<TestLevel>(readStorage('vezba_level', 'easy'))
  const timerDurationRef = useRef<TimerDuration | null>(timerDuration)
  const strictModeRef = useRef(strictMode)

  const { soundTheme } = useSettingsStore()
  const { play: playKeystroke } = useKeystrokeSound(soundTheme)

  // Derived: engine mode
  const mode: TestMode = timerDuration !== null ? 'vreme' : contentMode

  // Generišemo tekst tek na klijentu
  useEffect(() => {
    setText(makeText(pismoRef.current, contentModeRef.current, levelRef.current))
  }, [])

  // Kad se promeni pismo (navigacija), regeneriši — ali sačuvaj mode/level
  useEffect(() => {
    if (pismo !== pismoRef.current) {
      pismoRef.current = pismo
      const newText = makeText(pismo, contentModeRef.current, levelRef.current)
      setText(newText)
      setFinished(null)
    }
  }, [pismo])

  const getMoreText = useCallback(() => {
    return buildWordTest(loadWords(pismoRef.current, levelRef.current), 40, levelRef.current)
  }, [])

  const handleFinish = useCallback(async (result: ScoringResult, keystrokes: KeystrokeEntry[], wpmHistory: WpmSnapshot[]) => {
    setFinished({ result, wpmHistory })

    const durationSeconds = wpmHistory.length > 0 ? wpmHistory[wpmHistory.length - 1].second : 0
    if (durationSeconds < 2) return

    const correctChars = keystrokes.filter((k) => k.action === 'correct').length
    const totalChars = keystrokes.filter((k) => k.action !== 'backspace').length
    const errorsCount = keystrokes.filter((k) => k.action === 'incorrect').length

    const scriptMap: Record<Script, string> = { latinica: 'latinica', cirilica: 'cirilica', easy: 'latinica-bez-kvacica' }

    try {
      await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: contentModeRef.current === 'tekst' ? 'recenice' : 'reci',
          script: scriptMap[pismoRef.current],
          mode: 'vezba',
          duration_seconds: durationSeconds,
          correct_chars: correctChars,
          total_chars: totalChars,
          errors: errorsCount,
          keystroke_log: keystrokes,
          timer_seconds: timerDurationRef.current,
          strict_mode: strictModeRef.current,
          level: levelRef.current,
        }),
      })
    } catch { /* ignorisi — vežba se ne blokira ako save ne uspe */ }
  }, [])

  const { chars, cursor, status, timeLeft, spaceBlocked, handleKeyDown, reset } = useTypingEngine({
    text,
    mode,
    timerDuration: timerDuration ?? 60,
    strictMode,
    lazyMode: false,
    onFinish: handleFinish,
    onNeedMoreText: getMoreText,
  })

  const changeContentMode = useCallback((m: 'reci' | 'tekst') => {
    const nextText = makeText(pismoRef.current, m, levelRef.current)
    contentModeRef.current = m
    setContentMode(m)
    writeStorage('vezba_content_mode', m)
    setText(nextText)
    reset(nextText, timerDurationRef.current ?? 60)
    setFinished(null)
  }, [reset])

  const changeLevel = useCallback((l: TestLevel) => {
    const nextText = makeText(pismoRef.current, contentModeRef.current, l)
    levelRef.current = l
    setLevel(l)
    writeStorage('vezba_level', l)
    setText(nextText)
    reset(nextText, timerDurationRef.current ?? 60)
    setFinished(null)
  }, [reset])

  const changeTimerDuration = useCallback((t: TimerDuration | null) => {
    const nextTimerDuration = t ?? 60
    timerDurationRef.current = t
    setTimerDuration(t)
    writeStorage('vezba_timer', t)
    reset(undefined, nextTimerDuration)
    setFinished(null)
  }, [reset])

  const changeStrictMode = useCallback((v: boolean) => {
    strictModeRef.current = v
    setStrictMode(v)
    writeStorage('vezba_strict', v)
  }, [])

  const changePismo = useCallback((s: Script) => {
    const nextText = makeText(s, contentModeRef.current, levelRef.current)
    pismoRef.current = s
    setText(nextText)
    reset(nextText, timerDurationRef.current ?? 60)
    router.push(`/vezbaj/${s}`)
  }, [reset, router])

  const handleNewTest = useCallback(() => {
    setText(makeText(pismoRef.current, contentModeRef.current, levelRef.current))
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

        {/* Red 2: Reči/Tekst levo + opcije desno poravnate sa Easy */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
            {(Object.keys(MODE_LABELS) as Array<'reci' | 'tekst'>).map((m) => (
              <button
                key={m}
                onClick={() => changeContentMode(m)}
                className={cn(
                  'px-3.5 py-1.5 text-sm font-medium transition-colors',
                  contentMode === m
                    ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]',
                )}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
          <div className="flex flex-col items-start gap-1.5 min-w-[260px]">
            {/* 100% tačnost */}
            <div className="flex items-center gap-2">
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
              <span className="text-sm text-[var(--muted-foreground)]">100% tačnost</span>
            </div>
            {/* Vreme toggle + sekunde */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeTimerDuration(timerDuration !== null ? null : 60)}
                className={cn(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none',
                  timerDuration !== null ? 'bg-[var(--accent)]' : 'bg-[var(--border)]',
                )}
                role="switch"
                aria-checked={timerDuration !== null}
              >
                <span
                  className={cn(
                    'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
                    timerDuration !== null ? 'translate-x-4' : 'translate-x-0.5',
                  )}
                />
              </button>
              <span className="text-sm text-[var(--muted-foreground)]">Vreme</span>
              <div className={cn('flex items-center gap-0.5', timerDuration === null && 'invisible')}>
                {([15, 30, 60, 120] as TimerDuration[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => changeTimerDuration(t)}
                    className={cn(
                      'rounded-md px-2 py-0.5 text-xs font-mono font-medium transition-colors',
                      timerDuration === t
                        ? 'text-[var(--accent)] font-bold'
                        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                    )}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Typing area */}
      <TypingArea
        chars={chars}
        cursor={cursor}
        status={status}
        onKeyDown={(e) => { playKeystroke(); handleKeyDown(e) }}
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
                {Math.round(finished.result.score)}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">skor</p>
              <p className="mt-1 max-w-xs text-xs text-[var(--muted-foreground)]">WPM sa kaznom za greske.</p>
            </div>
            <div className="mb-0.5">
              <p className="font-mono text-3xl font-bold text-[var(--foreground)] leading-none">
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
          </div>

          {/* Chart */}
          {finished.wpmHistory.length > 1 && (
            <div className="mb-6">
              <WpmChart data={finished.wpmHistory} finalWpm={Math.round(finished.result.wpm)} rawWpm={Math.round(finished.result.rawWpm)} />
            </div>
          )}

          {/* Legenda metrika */}
          <div className="text-xs text-[var(--muted-foreground)] space-y-1.5 border-t border-[var(--border)] pt-4">
            <p><span className="text-[var(--foreground)]">wpm</span> — reci u minuti (5 tacnih znakova = 1 rec)</p>
            <p><span className="text-[var(--foreground)]">raw</span> — brzina svih pritisaka, ukljucujuci greske</p>
            <p><span className="text-[var(--foreground)]">tacnost</span> — procenat tacno ukucanih znakova</p>
            <p><span className="text-[var(--foreground)]">konzistentnost</span> — ravnomernost ritma; ne odlucuje rang</p>
            <p><span className="text-[var(--foreground)]">skor</span> — glavni rezultat: WPM sa kaznom za greske</p>
          </div>
        </div>
      )}
    </div>
  )
}
