'use client'

import { useEffect, useState } from 'react'
import { ChevronRight, Crown, RotateCcw } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { WpmChart } from './WpmChart'
import { NicknameModal } from '@/components/auth/NicknameModal'
import { checkHasNickname } from '@/lib/auth/anonymous'
import type { ScoringResult } from '@/lib/typing/scoring'
import type { WpmSnapshot } from '@/lib/typing/engine'
import { cn } from '@/lib/utils'

type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'unknown'

interface Props {
  result: ScoringResult
  wpmHistory: WpmSnapshot[]
  isNewPb?: boolean
  pbWpm?: number
  onRetry?: () => void
  onNext: () => void
  nextLabel?: string
  deviceType?: DeviceType
  testMeta?: {
    script: string
    difficulty?: string
    wordCount?: number
  }
}

function StatCell({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string
  hint: string
  accent?: boolean
}) {
  return (
    <div>
      <p className={cn('font-mono text-xl font-bold', accent ? 'text-[var(--accent)]' : 'text-[var(--foreground)]')}>
        {value}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-xs leading-snug text-[var(--muted-foreground)]">{hint}</p>
    </div>
  )
}

export function ResultScreen({ result, wpmHistory, isNewPb, pbWpm, onRetry, onNext, nextLabel = 'Sledeći test', deviceType, testMeta }: Props) {
  const [showNicknameModal, setShowNicknameModal] = useState(false)
  const [nicknameChecked, setNicknameChecked] = useState(false)

  useEffect(() => {
    if (isNewPb) {
      toast(`Novi lični rekord! Skor ${Math.round(result.score)}`, {
        duration: 4000,
      })
    }
  }, [isNewPb, result.score])

  // Proveri da li korisnik ima nickname — ako ne, prikaži modal
  useEffect(() => {
    checkHasNickname().then((hasNickname) => {
      if (!hasNickname) {
        setShowNicknameModal(true)
      }
      setNicknameChecked(true)
    })
  }, [])

  const handleNicknameSet = () => {
    setShowNicknameModal(false)
    // Osveži stranicu da header prikaže novo ime
    window.location.reload()
  }

  const roundedScore = Math.round(result.score)
  const roundedWpm = Math.round(result.wpm)
  const roundedAccuracy = Math.round(result.accuracy)
  const roundedRaw = Math.round(result.rawWpm)
  const roundedConsistency = Math.round(result.consistency)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 animate-in fade-in duration-300">
      {/* Nickname Modal — prikazuje se posle prve partije ako korisnik nema ime */}
      {showNicknameModal && nicknameChecked && (
        <NicknameModal onNicknameSet={handleNicknameSet} />
      )}

      <div className="mb-8">
        {deviceType && (
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--muted)] px-2.5 py-1 text-xs text-[var(--muted-foreground)]">
            {deviceType === 'mobile' ? '📱 Mobilni uređaj' : deviceType === 'tablet' ? '▣ Tablet' : deviceType === 'desktop' ? '🖥 Računar' : '? Nepoznato'}
          </span>
        )}
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]">Rezultat za rang</p>
        <div className="flex flex-wrap items-end gap-5 md:gap-8">
          <div>
            <div className="flex items-center gap-3">
              <p className="font-mono text-6xl font-bold leading-none text-[var(--accent)] md:text-7xl">
                {roundedScore}
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
            <p className="mt-2 max-w-md text-sm text-[var(--muted-foreground)]">
              Skor je WPM sa kaznom za greške. To je broj koji odlučuje rang.
            </p>
          </div>

          <div className="mb-2">
            <p className="font-mono text-3xl font-bold leading-none text-[var(--foreground)] md:text-5xl">{roundedWpm}</p>
            <p className="mt-1 text-xs uppercase tracking-widest text-[var(--muted-foreground)]">wpm</p>
          </div>

          <div className="mb-2">
            <p className="font-mono text-3xl font-bold leading-none text-[var(--foreground)] md:text-5xl">{roundedAccuracy}%</p>
            <p className="mt-1 text-xs uppercase tracking-widest text-[var(--muted-foreground)]">tačnost</p>
          </div>

          {isNewPb && (
            <motion.div
              className="mb-3 md:ml-auto"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <span className="rounded-full bg-[var(--accent)]/15 px-3 py-1 text-xs font-medium text-[var(--accent)]">
                Novi rekord
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {wpmHistory.length > 1 && (
        <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <WpmChart data={wpmHistory} finalWpm={roundedWpm} rawWpm={roundedRaw} pbWpm={pbWpm} />
        </div>
      )}

      <div className="mb-6 grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCell label="skor" value={String(roundedScore)} hint="Glavni rezultat za rang listu." accent />
        <StatCell label="raw" value={String(roundedRaw)} hint="Brzina svih pritisaka, i tačnih i pogrešnih." />
        <StatCell label="ritam" value={`${roundedConsistency}%`} hint="Koliko je tempo bio ravnomeran." />
        {testMeta ? (
          <StatCell label="test" value={testMeta.script} hint={testMeta.difficulty ?? 'Izabrani režim testa.'} />
        ) : (
          <StatCell label="formula" value="WPM x tačnost" hint="Greške spuštaju skor jače nego WPM." />
        )}
      </div>

      <div className="mb-8 rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-4 text-sm text-[var(--muted-foreground)]">
        <p className="text-[var(--foreground)]">Kako da čitaš rezultat:</p>
        <p className="mt-2">Skor pokazuje gde si na rangu. WPM pokazuje brzinu. Tačnost pokazuje koliko si čist. Raw pokazuje tempo pre kazne za greške. Ritam je samo osećaj stabilnosti kucanja.</p>
      </div>

      <div className="flex justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 rounded-md border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            title="Tab"
          >
            <RotateCcw className="h-4 w-4" />
            Ponovi
          </button>
        )}
        <button
          onClick={onNext}
          className="flex items-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-90"
        >
          {nextLabel}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
