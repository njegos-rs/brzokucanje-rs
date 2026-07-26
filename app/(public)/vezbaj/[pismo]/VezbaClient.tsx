'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTypingEngine, type WpmSnapshot, type TestMode, type TestLevel, type TimerDuration, type KeystrokeEntry } from '@/lib/typing/engine'
import { TypingArea } from '@/components/typing/TypingArea'
import { LiveStats } from '@/components/typing/LiveStats'
import { WpmChart } from '@/components/result/WpmChart'
import { buildWordTest, buildPhraseTest, getRandomWordCount } from '@/lib/words/generator'
import { fetchWordPool } from '@/lib/words/client'
import { cn } from '@/lib/utils'
import { RotateCcw, ChevronRight } from 'lucide-react'
import type { ScoringResult } from '@/lib/typing/scoring'
import { useSettingsStore } from '@/lib/stores/settings-store'
import { useKeystrokeSound } from '@/lib/hooks/useKeystrokeSound'
import { NicknameModal } from '@/components/auth/NicknameModal'
import { checkHasNickname } from '@/lib/auth/anonymous'

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
  deviceType?: 'mobile' | 'tablet' | 'desktop' | 'unknown'
}

type PoolData = { words: string[]; texts: string[] }

function makeText(contentMode: 'reci' | 'tekst', level: TestLevel, pool: PoolData, timerActive = false): string {
  if (contentMode === 'tekst') {
    return buildPhraseTest(pool.texts, timerActive ? 12 : 4, level)
  }
  return buildWordTest(pool.words, timerActive ? 80 : getRandomWordCount(level), level)
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
  const [mobileTypingActive, setMobileTypingActive] = useState(false)
  const [text, setText] = useState('')
  const poolRef = useRef<PoolData | null>(null)
  const pismoRef = useRef(pismo)
  const contentModeRef = useRef<'reci' | 'tekst'>(readStorage('vezba_content_mode', 'reci'))
  const levelRef = useRef<TestLevel>(readStorage('vezba_level', 'easy'))
  const timerDurationRef = useRef<TimerDuration | null>(timerDuration)
  const strictModeRef = useRef(strictMode)

  const { soundTheme } = useSettingsStore()
  const { play: playKeystroke } = useKeystrokeSound(soundTheme)

  // Derived: engine mode
  const mode: TestMode = timerDuration !== null ? 'vreme' : contentMode

  const [showNicknameModal, setShowNicknameModal] = useState(false)

  useEffect(() => {
    checkHasNickname().then((hasNick) => {
      if (!hasNick) setShowNicknameModal(true)
    })
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('mobile-typing-active', mobileTypingActive)
    return () => document.documentElement.classList.remove('mobile-typing-active')
  }, [mobileTypingActive])

  // Wordlist se učitava samo za izabrano pismo, nivo i tip sadržaja.
  useEffect(() => {
    const controller = new AbortController()
    const kind = contentMode === 'tekst' ? 'texts' : 'words'
    pismoRef.current = pismo
    contentModeRef.current = contentMode
    levelRef.current = level
    poolRef.current = null
    setText('')
    setFinished(null)

    fetchWordPool(pismo, level, kind, controller.signal)
      .then((values) => {
        if (controller.signal.aborted) return
        const nextPool: PoolData = kind === 'texts' ? { words: [], texts: values } : { words: values, texts: [] }
        poolRef.current = nextPool
        setText(makeText(contentMode, level, nextPool, timerDurationRef.current !== null))
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setText('')
      })

    return () => controller.abort()
  }, [pismo, contentMode, level])

  const getMoreText = useCallback(() => {
    const pool = poolRef.current
    if (!pool) return null
    if (contentModeRef.current === 'tekst') {
      return buildPhraseTest(pool.texts, 4, levelRef.current)
    }
    return buildWordTest(pool.words, 40, levelRef.current)
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
      const response = await fetch('/api/score', {
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
      const saved = await response.json().catch(() => ({}))
      if (saved.device_type) {
        setFinished((current) => current ? { ...current, deviceType: saved.device_type } : current)
      }
    } catch { /* ignorisi — vežba se ne blokira ako save ne uspe */ }
  }, [])

  const { chars, cursor, status, errors, timeLeft, spaceBlocked, handleKeyDown, reset, liveStats } = useTypingEngine({
    text,
    mode,
    timerDuration: timerDuration ?? 60,
    strictMode,
    lazyMode: false,
    onFinish: handleFinish,
    onNeedMoreText: getMoreText,
  })

  useEffect(() => {
    if (status === 'finished') setMobileTypingActive(false)
  }, [status])

  const changeContentMode = useCallback((m: 'reci' | 'tekst') => {
    if (m === contentModeRef.current && timerDurationRef.current === null) return
    contentModeRef.current = m
    setContentMode(m)
    writeStorage('vezba_content_mode', m)
    reset('', timerDurationRef.current ?? 60)
    setFinished(null)
  }, [reset])

  const changeLevel = useCallback((l: TestLevel) => {
    if (l === levelRef.current) return
    levelRef.current = l
    setLevel(l)
    writeStorage('vezba_level', l)
    reset('', timerDurationRef.current ?? 60)
    setFinished(null)
  }, [reset])

  const changeTimerDuration = useCallback((t: TimerDuration | null) => {
    if (t === timerDurationRef.current) return // Ne resetuj ako je trajanje već izabrano
    const nextTimerDuration = t ?? 60
    timerDurationRef.current = t
    setTimerDuration(t)
    writeStorage('vezba_timer', t)
    reset(text, nextTimerDuration)
    setFinished(null)
  }, [reset, text])

  const changeStrictMode = useCallback((v: boolean) => {
    strictModeRef.current = v
    setStrictMode(v)
    writeStorage('vezba_strict', v)
    reset(undefined, timerDurationRef.current ?? 60, v)
    setFinished(null)
  }, [reset])

  const changePismo = useCallback((s: Script) => {
    pismoRef.current = s
    router.push(`/vezbaj/${s}`)
  }, [router])

  const handleNewTest = useCallback(() => {
    const pool = poolRef.current
    if (pool) setText(makeText(contentModeRef.current, levelRef.current, pool, timerDurationRef.current !== null))
    setFinished(null)
  }, [])

  const handleReset = useCallback(() => {
    reset()
    setFinished(null)
  }, [reset])

  const currentStats = liveStats()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') { e.preventDefault(); handleReset() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleReset])

  return (
    <div className={cn("mx-auto w-full max-w-2xl px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:px-4 sm:py-12 lg:py-12", mobileTypingActive && "fixed inset-0 z-[60] flex max-w-none items-center justify-center overflow-hidden bg-[var(--background)] px-3 py-0")}>
      {showNicknameModal && (
        <NicknameModal onNicknameSet={() => setShowNicknameModal(false)} />
      )}
      {/* Kontrolna traka */}
      <div className={cn("mb-3 flex min-h-[150px] flex-col gap-2 sm:mb-5 sm:gap-2.5", mobileTypingActive && "hidden")}>

        {/* Red 1: Pisma levo + Težina desno */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full overflow-x-auto rounded-lg border border-[var(--border)] sm:w-auto">
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
          <div className="flex w-full overflow-x-auto rounded-lg border border-[var(--border)] sm:w-auto">
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
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex w-full overflow-x-auto rounded-lg border border-[var(--border)] sm:w-auto">
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
          <div className="flex flex-col items-start gap-1.5 sm:min-w-[260px]">
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
        mobileImmersive={mobileTypingActive}
        onFocusChange={(focused) => {
          if (window.matchMedia('(max-width: 639px)').matches) setMobileTypingActive(focused)
        }}
      />

      {!mobileTypingActive && status !== 'finished' && cursor > 0 && (
        <LiveStats
          wpm={currentStats.wpm ?? 0}
          accuracy={currentStats.accuracy ?? 0}
          errors={errors}
        />
      )}

      {/* Reset dugme — samo tokom kucanja */}
      {!mobileTypingActive && status !== 'idle' && !finished && (
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
          {finished.deviceType && (
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--muted)] px-2.5 py-1 text-xs text-[var(--muted-foreground)]">
              {finished.deviceType === 'mobile' ? '📱 Mobilni uređaj' : finished.deviceType === 'tablet' ? '▣ Tablet' : finished.deviceType === 'desktop' ? '🖥 Računar' : '? Nepoznato'}
            </span>
          )}

          {/* Dugmad odmah ispod — vidljiva bez skrolanja */}
          <div className="flex flex-col gap-2 mb-8 sm:flex-row">
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
          <div className="grid grid-cols-3 items-end gap-3 mb-6 sm:flex sm:gap-6">
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




