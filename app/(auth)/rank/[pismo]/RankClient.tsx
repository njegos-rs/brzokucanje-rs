'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTypingEngine, type WpmSnapshot } from '@/lib/typing/engine'
import { TypingArea } from '@/components/typing/TypingArea'
import { ResultScreen } from '@/components/result/ResultScreen'
import { RankingWidget } from '@/components/rank/RankingWidget'
import { Lock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ScoringResult } from '@/lib/typing/scoring'
import type { KeystrokeEntry } from '@/lib/typing/engine'

type Script = 'latinica' | 'cirilica' | 'latinica-bez-kvacica'
type Category = 'reci' | 'recenice' | 'price'

const SCRIPT_LABELS: Record<Script, string> = {
  latinica: 'Latinica',
  cirilica: 'Ćirilica',
  'latinica-bez-kvacica': 'Latinica bez kvačica',
}

interface FinishedState {
  result: ScoringResult
  wpmHistory: WpmSnapshot[]
  keystrokes: KeystrokeEntry[]
  scoreId?: string
  isNewPb?: boolean
  userRank?: number
  totalPlayers?: number
}

interface Props {
  pismo: Script
  userId: string
  alreadyPlayed: boolean
}

export function RankClient({ pismo, userId, alreadyPlayed }: Props) {
  const router = useRouter()
  const [dailyText, setDailyText] = useState<{ text_id: string; content: string } | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [loadingText, setLoadingText] = useState(false)
  const [textError, setTextError] = useState<string | null>(null)
  const [finished, setFinished] = useState<FinishedState | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [focusLost, setFocusLost] = useState(false)
  const focusLostRef = useRef(false)

  const fetchDailyText = useCallback(async () => {
    setLoadingText(true)
    setTextError(null)
    setDailyText(null)
    try {
      const res = await fetch(`/api/daily-text?script=${pismo}`)
      if (!res.ok) {
        const j = await res.json()
        setTextError(j.error ?? 'Greška pri učitavanju dnevnog teksta.')
        return
      }
      const j = await res.json()
      setDailyText({ text_id: j.text_id, content: j.content })
      setCategory(j.category ?? null)
    } catch {
      setTextError('Mrežna greška. Pokušaj ponovo.')
    } finally {
      setLoadingText(false)
    }
  }, [pismo])

  useEffect(() => {
    if (!alreadyPlayed) fetchDailyText()
  }, [alreadyPlayed, fetchDailyText])

  // Tab focus tracking — invalidira test
  useEffect(() => {
    const onBlur = () => {
      if (engineRef.current?.status === 'running') {
        focusLostRef.current = true
        setFocusLost(true)
      }
    }
    window.addEventListener('blur', onBlur)
    return () => window.removeEventListener('blur', onBlur)
  }, [])

  // Blokira Tab restart u RANK modu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Tab') e.preventDefault() }
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

        const res = await fetch('/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
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

        // Učitaj poziciju na rang listi
        let userRank: number | undefined
        let totalPlayers: number | undefined
        try {
          const today = new Date().toISOString().slice(0, 10)
          const rankRes = await fetch(`/api/leaderboard?script=${pismo}&period=daily&limit=1000`)
          const rankJson = await rankRes.json()
          const entries: { user_id: string }[] = rankJson.data ?? []
          const pos = entries.findIndex((e) => e.user_id === userId)
          if (pos !== -1) {
            userRank = pos + 1
            totalPlayers = entries.length
          }
        } catch { /* ignorisi */ }

        setFinished({ result, wpmHistory, keystrokes, scoreId: json.id, isNewPb: json.is_new_pb, userRank, totalPlayers })
      } catch {
        setSubmitError('Mrežna greška. Rezultat nije sačuvan.')
        setFinished({ result, wpmHistory, keystrokes })
      } finally {
        setSubmitting(false)
      }
    },
    [category, pismo, dailyText, userId]
  )

  const engineRef = useRef<ReturnType<typeof useTypingEngine> | null>(null)
  const engine = useTypingEngine({
    text: dailyText?.content ?? '',
    lazyMode: false,
    onFinish: handleFinish,
  })
  engineRef.current = engine

  const { chars, cursor, status, errors, handleKeyDown } = engine

  // Anti-cheat: blokira paste
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => e.preventDefault()
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [])

  // Pismo tabovi — navigacija
  const pismoTabovi: Script[] = ['latinica', 'cirilica', 'latinica-bez-kvacica']

  if (finished) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        {submitError && (
          <div className="mb-4 rounded-md border border-[var(--incorrect)]/30 bg-[var(--incorrect)]/10 px-3 py-2 text-sm text-[var(--incorrect)]">
            {submitError}
          </div>
        )}
        {focusLost && (
          <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            Test je poništen — izgubili ste fokus prozora. Rezultat nije evidentiran.
          </div>
        )}

        {/* Pozicija na rang listi */}
        {finished.userRank && finished.totalPlayers && !focusLost && (
          <div className="mb-6 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-5 py-4 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">Tvoja pozicija danas</p>
            <p className="mt-1 font-mono text-3xl font-bold text-[var(--accent)]">
              #{finished.userRank}
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">
              od {finished.totalPlayers} {finished.totalPlayers === 1 ? 'igrača' : 'igrača'}
            </p>
          </div>
        )}

        <ResultScreen
          result={finished.result}
          wpmHistory={finished.wpmHistory}
          isNewPb={finished.isNewPb}
          onNext={() => router.push(`/rang-lista/${pismo}`)}
        />
      </div>
    )
  }

  // Već odigrano danas
  if (alreadyPlayed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Pismo tabovi */}
        <div className="mb-6 flex gap-2 flex-wrap">
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
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <Lock className="mx-auto mb-3 h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="font-medium text-[var(--foreground)]">Dnevni pokušaj iskorišćen</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Možeš ponovo sutra u ponoć. Pogledaj rang listu da vidiš svoju poziciju.
          </p>
          <button
            onClick={() => router.push(`/rang-lista/${pismo}`)}
            className="mt-4 text-sm text-[var(--accent)] hover:opacity-80 transition-opacity"
          >
            Rang lista →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Pismo tabovi */}
      <div className="mb-6 flex gap-2 flex-wrap">
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

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">
          Jedan pokušaj dnevno. Rezultati idu na rang listu.
        </p>
        {category && <RankingWidget script={pismo} category={category} />}
      </div>

      {loadingText && (
        <div className="py-16 text-center text-sm text-[var(--muted-foreground)]">
          Učitavam dnevni tekst…
        </div>
      )}
      {textError && (
        <div className="rounded-md border border-[var(--incorrect)]/30 bg-[var(--incorrect)]/10 px-3 py-4 text-center text-sm text-[var(--incorrect)]">
          {textError}
          <button onClick={fetchDailyText} className="ml-2 underline hover:opacity-80">
            Pokušaj ponovo
          </button>
        </div>
      )}

      {focusLost && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Izgubili ste fokus — test je poništen. Rezultat neće biti evidentiran.
        </div>
      )}

      {/* Kucanje — bez live stats */}
      {dailyText && !loadingText && (
        <>
          <TypingArea
            chars={chars}
            cursor={cursor}
            status={status}
            onKeyDown={handleKeyDown}
          />
          <div className="mt-4">
            <p className="text-xs text-[var(--muted-foreground)]">
              Paste je onemogućen &nbsp;·&nbsp; Restart nije dozvoljen u RANK modu
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
