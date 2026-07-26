'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTypingEngine, type WpmSnapshot } from '@/lib/typing/engine'
import { TypingArea } from '@/components/typing/TypingArea'
import { ResultScreen } from '@/components/result/ResultScreen'
import { Lock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ScoringResult } from '@/lib/typing/scoring'
import type { KeystrokeEntry } from '@/lib/typing/engine'
import { useSettingsStore } from '@/lib/stores/settings-store'
import { useKeystrokeSound } from '@/lib/hooks/useKeystrokeSound'
import { LeaderboardPanel, type LeaderboardPeriod } from '@/components/rank/LeaderboardPanel'
import { NicknameModal } from '@/components/auth/NicknameModal'
import { checkHasNickname } from '@/lib/auth/anonymous'

type Script = 'latinica' | 'cirilica' | 'latinica-bez-kvacica'
type Category = 'reci' | 'recenice'

const SCRIPT_LABELS: Record<Script, string> = {
  latinica: 'Latinica',
  cirilica: 'Ćirilica',
  'latinica-bez-kvacica': 'Latinica bez kvačica',
}

const PERIOD_RANK_LABELS: Record<LeaderboardPeriod, string> = {
  daily: 'danas',
  weekly: 'nedeljno',
  monthly: 'mesečno',
  yearly: 'godišnje',
}

interface FinishedState {
  result: ScoringResult
  wpmHistory: WpmSnapshot[]
  keystrokes: KeystrokeEntry[]
  scoreId?: string
  isNewPb?: boolean
  userRank?: number
  totalPlayers?: number
  deviceType?: 'mobile' | 'tablet' | 'desktop' | 'unknown'
}

interface InitialDailyText {
  text_id: string | null
  content: string
  category: 'reci' | 'recenice'
  difficulty: import('@/lib/typing/engine').TestLevel
  duration_seconds: number
  mode: 'reci' | 'tekst'
}

interface Props {
  pismo: Script
  userId: string
  alreadyPlayed: boolean
  initialDailyText: InitialDailyText
}

export function RankClient({ pismo, userId, alreadyPlayed, initialDailyText }: Props) {
  const router = useRouter()
  const { soundTheme } = useSettingsStore()
  const { play: playKeystroke } = useKeystrokeSound(soundTheme)
  const [dailyText, setDailyText] = useState<{ text_id: string | null; content: string } | null>(
    initialDailyText.content ? { text_id: initialDailyText.text_id, content: initialDailyText.content } : null,
  )
  const [category, setCategory] = useState<Category | null>(initialDailyText.category === 'recenice' ? 'recenice' : 'reci')
  const [dailyDuration, setDailyDuration] = useState<number>(initialDailyText.duration_seconds)
  const [dailyMode, setDailyMode] = useState<'reci' | 'tekst'>(initialDailyText.mode)
  const [playedToday, setPlayedToday] = useState(alreadyPlayed)
  const [loadingText] = useState(false)
  const [textError, setTextError] = useState<string | null>(null)
  const [finished, setFinished] = useState<FinishedState | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [focusLost, setFocusLost] = useState(false)
  const [userRankAlready, setUserRankAlready] = useState<number | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>('daily')
  const [selectedPeriodRank, setSelectedPeriodRank] = useState<number | null>(null)
  const [nicknameReady, setNicknameReady] = useState(false)
  const focusLostRef = useRef(false)
  const startLoggedRef = useRef(false)
  const attemptPromiseRef = useRef<Promise<string | null> | null>(null)
  const playedTodayRef = useRef(alreadyPlayed)
  const selectedLeaderboardRank = selectedPeriod === 'daily' ? userRankAlready : selectedPeriodRank

  useEffect(() => {
    checkHasNickname().then(setNicknameReady)
  }, [])

  const fetchLeaderboard = useCallback(async (script: Script, cat: Category | null) => {
    try {
      const catParam = cat ? `&category=${cat}` : ''
      const res = await fetch(`/api/leaderboard?script=${script}&period=daily&limit=25${catParam}`)
      const json = await res.json()
      const entries: Array<{ user_id: string }> = json.data ?? []
      const pos = entries.findIndex((e) => e.user_id === userId)
      setUserRankAlready(pos !== -1 ? pos + 1 : null)
    } catch {
      // ignore
    }
  }, [userId])

  useEffect(() => {
    setDailyText(initialDailyText.content ? { text_id: initialDailyText.text_id, content: initialDailyText.content } : null)
    const cat = initialDailyText.category === 'recenice' ? 'recenice' : 'reci'
    setCategory(cat)
    setDailyDuration(initialDailyText.duration_seconds)
    setDailyMode(initialDailyText.mode)

    setPlayedToday(alreadyPlayed)
    playedTodayRef.current = alreadyPlayed
    setFinished(null)
    setFocusLost(false)
    focusLostRef.current = false
    startLoggedRef.current = false
    attemptPromiseRef.current = null
    setTextError(null)
    setSelectedPeriod('daily')
    setSelectedPeriodRank(null)

    if (alreadyPlayed) {
      fetchLeaderboard(pismo, cat)
    }
  }, [pismo, initialDailyText, alreadyPlayed, fetchLeaderboard])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleFinish = useCallback(
    async (result: ScoringResult, keystrokes: KeystrokeEntry[], wpmHistory: WpmSnapshot[]) => {
      if (focusLostRef.current) {
        setFinished({ result, wpmHistory, keystrokes })
        return
      }

      setSubmitting(true)
      setSubmitError(null)

      try {
        const durationSeconds = wpmHistory.length > 0 ? wpmHistory[wpmHistory.length - 1].second : 0
        const correctChars = keystrokes.filter((k) => k.action === 'correct').length
        const totalChars = keystrokes.filter((k) => k.action !== 'backspace').length
        const errorsCount = keystrokes.filter((k) => k.action === 'incorrect').length

        const resolvedId = attemptPromiseRef.current ? await attemptPromiseRef.current : undefined

        const res = await fetch('/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: resolvedId,
            category,
            script: pismo,
            mode: 'rank',
            wpm: result.wpm,
            raw_wpm: result.rawWpm,
            accuracy: result.accuracy,
            consistency: result.consistency,
            score: result.score,
            duration_seconds: durationSeconds,
            correct_chars: correctChars,
            total_chars: totalChars,
            errors: errorsCount,
            keystroke_log: keystrokes,
            text_id: dailyText?.text_id,
          }),
        })

        const json = await res.json()

        if (!res.ok) {
          setSubmitError(json.error ?? 'Greška pri čuvanju rezultata.')
          setFinished({ result, wpmHistory, keystrokes })
          return
        }

        let userRank: number | undefined
        let totalPlayers: number | undefined

        try {
          const catParam = category ? `&category=${category}` : ''
          const rankRes = await fetch(`/api/leaderboard?script=${pismo}&period=daily&limit=100${catParam}`)
          const rankJson = await rankRes.json()
          const entries: Array<{ user_id: string }> = rankJson.data ?? []
          const pos = entries.findIndex((e) => e.user_id === userId)
          if (pos !== -1) {
            userRank = pos + 1
            totalPlayers = entries.length
          }
        } catch {
          // ignore
        }

        playedTodayRef.current = true
        setPlayedToday(true)
        setUserRankAlready(userRank ?? null)
        setSelectedPeriod('daily')
        setSelectedPeriodRank(userRank ?? null)
        setFinished({ result, wpmHistory, keystrokes, scoreId: json.id, isNewPb: json.is_new_pb, userRank, totalPlayers, deviceType: json.device_type })
      } catch {
        setSubmitError('Mrežna greška. Rezultat nije sačuvan.')
        setFinished({ result, wpmHistory, keystrokes })
      } finally {
        setSubmitting(false)
      }
    },
    [category, pismo, dailyText, userId],
  )

  const engine = useTypingEngine({
    text: dailyText?.content ?? '',
    lazyMode: false,
    onFinish: handleFinish,
    mode: dailyMode === 'reci' ? 'vreme' : 'tekst',
    timerDuration: dailyDuration as import('@/lib/typing/engine').TimerDuration,
  })
  const { chars, cursor, status, handleKeyDown } = engine

  useEffect(() => {
    const onBlur = () => {
      if (status === 'running') {
        focusLostRef.current = true
        setFocusLost(true)
      }
    }
    window.addEventListener('blur', onBlur)
    return () => window.removeEventListener('blur', onBlur)
  }, [status])

  useEffect(() => {
    if (status === 'running' && !startLoggedRef.current) {
      startLoggedRef.current = true
      attemptPromiseRef.current = fetch('/api/rank/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, script: pismo, text_id: dailyText?.text_id }),
      })
        .then(async (r) => {
          const data = await r.json()
          if (data.error) {
            if (r.status === 409) {
              playedTodayRef.current = true
              setPlayedToday(true)
              fetchLeaderboard(pismo, category)
            }
            setTextError(data.error)
            return null
          }
          if (data.id) return data.id
          return null
        })
        .catch(() => null)
    }
  }, [status, category, pismo, dailyText, fetchLeaderboard])

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => e.preventDefault()
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [])

  const pismoTabovi: Script[] = ['latinica', 'cirilica', 'latinica-bez-kvacica']

  if (!nicknameReady) {
    return <NicknameModal onNicknameSet={() => setNicknameReady(true)} />
  }

  if (finished) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        {submitError && (
          <div className="mb-4 rounded-md border border-[var(--incorrect)]/30 bg-[var(--incorrect)]/10 px-3 py-2 text-sm text-[var(--incorrect)]">
            {submitError}
          </div>
        )}
        {focusLost && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            Test je poništen — izgubili ste fokus prozora. Rezultat nije evidentiran.
          </div>
        )}

        {finished.userRank && finished.totalPlayers && !focusLost && (
          <div className="mb-6 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-5 py-4 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">Tvoja pozicija danas</p>
            <p className="mt-1 font-mono text-3xl font-bold text-[var(--accent)]">#{finished.userRank}</p>
            <p className="text-sm text-[var(--muted-foreground)]">
              od {finished.totalPlayers} igrača
            </p>
          </div>
        )}

        <ResultScreen
          result={finished.result}
          wpmHistory={finished.wpmHistory}
          isNewPb={finished.isNewPb}
          deviceType={finished.deviceType}
          onNext={() => router.push(`/rang-lista/${pismo}`)}
          nextLabel="Otvori celu rank listu"
        />

        {!focusLost && (
          <div className="mt-8">
            <LeaderboardPanel
              script={pismo}
              currentUserId={userId}
              navigationBase="/rank"
              showScriptTabs
              titlePrefix="rank lista"
              onStateChange={({ period, currentUserRank }) => {
                setSelectedPeriod(period)
                setSelectedPeriodRank(currentUserRank)
              }}
            />
          </div>
        )}
      </div>
    )
  }

  if (playedToday && !finished) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-4 flex flex-nowrap gap-2 overflow-x-auto pb-1 sm:mb-6 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {pismoTabovi.map((p) => (
            <button
              key={p}
              onClick={() => router.push(`/rank/${p}`)}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                p === pismo
                  ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                  : 'border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]',
              )}
            >
              {SCRIPT_LABELS[p]}
            </button>
          ))}
        </div>

        <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <Lock className="mx-auto mb-3 h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="font-medium text-[var(--foreground)]">Dnevni test je završen</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Probaj sutra — svaki dan novi tekst i nova kategorija.
          </p>
          {selectedLeaderboardRank && (
            <p className="mt-3 font-mono text-2xl font-bold text-[var(--accent)]">
              #{selectedLeaderboardRank} {PERIOD_RANK_LABELS[selectedPeriod]}
            </p>
          )}
        </div>

        <LeaderboardPanel
          script={pismo}
          currentUserId={userId}
          navigationBase="/rank"
          showScriptTabs={false}
          titlePrefix="rank lista"
          onStateChange={({ period, currentUserRank }) => {
            setSelectedPeriod(period)
            setSelectedPeriodRank(currentUserRank)
          }}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-3 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:px-4 sm:py-8">
      <div className="mb-4 flex flex-nowrap gap-2 overflow-x-auto pb-1 sm:mb-6 sm:flex-wrap sm:overflow-visible sm:pb-0">
        {pismoTabovi.map((p) => (
          <button
            key={p}
            onClick={() => router.push(`/rank/${p}`)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              p === pismo
                ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                : 'border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]',
            )}
          >
            {SCRIPT_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <p className="text-sm text-[var(--muted-foreground)]">
          Jedan pokušaj dnevno. Rezultati idu na rank listu.
        </p>
      </div>

      {loadingText && (
        <div className="py-16 text-center text-sm text-[var(--muted-foreground)]">
          Učitavam dnevni tekst…
        </div>
      )}
      {textError && (
        <div className="rounded-md border border-[var(--incorrect)]/30 bg-[var(--incorrect)]/10 px-3 py-4 text-center text-sm text-[var(--incorrect)]">
          {textError}
        </div>
      )}

      {focusLost && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Izgubili ste fokus — test je poništen. Rezultat neće biti evidentiran.
        </div>
      )}

      {dailyText && !loadingText && (
        <>
          <TypingArea
            chars={chars}
            cursor={cursor}
            status={status}
            onKeyDown={(e) => {
              playKeystroke()
              handleKeyDown(e)
            }}
          />
          <div className="mt-4">
            <p className="text-xs text-[var(--muted-foreground)]">
              Paste je onemogućen · Restart nije dozvoljen u RANK modu
            </p>
          </div>
          {submitting && (
            <p className="mt-2 text-center text-sm text-[var(--muted-foreground)]">
              Čuvam rezultat…
            </p>
          )}
        </>
      )}
    </div>
  )
}





