'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Lock, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { loadWords } from '@/lib/words/loader'
import { cn } from '@/lib/utils'

type GameStatus = 'preview' | 'ready' | 'playing' | 'gameover'

// Level config: thresholds in seconds of play time
const LEVEL_CONFIG: {
  minWords: number
  maxWords: number
  baseSpeed: number
  spawnInterval: number // max seconds between spawns
  minOnScreen: number   // always keep at least this many falling
  maxOnScreen: number
  label: string
  message: string
}[] = [
  // Level 1 — 0-25s: very chill
  { minWords: 3, maxWords: 5, baseSpeed: 18, spawnInterval: 2.5, minOnScreen: 2, maxOnScreen: 3, label: '1', message: 'Odličan start!' },
  // Level 2 — 25-55s
  { minWords: 3, maxWords: 6, baseSpeed: 22, spawnInterval: 2.2, minOnScreen: 2, maxOnScreen: 3, label: '2', message: 'Sve bolje i bolje!' },
  // Level 3 — 55-90s
  { minWords: 4, maxWords: 6, baseSpeed: 26, spawnInterval: 2.0, minOnScreen: 3, maxOnScreen: 4, label: '3', message: 'Odličan ritam!' },
  // Level 4 — 90-130s
  { minWords: 4, maxWords: 7, baseSpeed: 30, spawnInterval: 1.8, minOnScreen: 3, maxOnScreen: 4, label: '4', message: 'Pravi igrač!' },
  // Level 5 — 130-175s
  { minWords: 5, maxWords: 7, baseSpeed: 35, spawnInterval: 1.6, minOnScreen: 3, maxOnScreen: 4, label: '5', message: 'Fenomenalno!' },
  // Level 6 — 175-225s
  { minWords: 5, maxWords: 8, baseSpeed: 40, spawnInterval: 1.4, minOnScreen: 4, maxOnScreen: 5, label: '6', message: 'Legenda nastaje!' },
  // Level 7 — 225-280s
  { minWords: 5, maxWords: 9, baseSpeed: 46, spawnInterval: 1.2, minOnScreen: 4, maxOnScreen: 5, label: '7', message: 'Brutalan tempo!' },
  // Level 8 — 280-340s
  { minWords: 6, maxWords: 9, baseSpeed: 52, spawnInterval: 1.0, minOnScreen: 4, maxOnScreen: 5, label: '8', message: 'Nezaustavljiv si!' },
  // Level 9 — 340-400s
  { minWords: 6, maxWords: 10, baseSpeed: 59, spawnInterval: 0.9, minOnScreen: 5, maxOnScreen: 6, label: '9', message: 'Vrh!' },
  // Level 10+ — 400s+
  { minWords: 6, maxWords: 12, baseSpeed: 67, spawnInterval: 0.8, minOnScreen: 5, maxOnScreen: 6, label: '10', message: 'HAOS MOD!' },
]

const LEVEL_THRESHOLDS = [0, 25, 55, 90, 130, 175, 225, 280, 340, 400]

function getLevelIndex(elapsed: number): number {
  let idx = 0
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (elapsed >= LEVEL_THRESHOLDS[i]) idx = i
  }
  return Math.min(idx, LEVEL_CONFIG.length - 1)
}

interface Props {
  canPlay: boolean
}

interface Enemy {
  id: number
  word: string
  typed: number
  x: number
  y: number
  speed: number
  size: number
}

interface Shot {
  id: number
  fromX: number
  fromY: number
  toX: number
  toY: number
  progress: number
  life: number
}

interface Burst {
  id: number
  x: number
  y: number
  life: number
}

interface Fragment {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

const GAME_SCRIPT = 'easy' as const
type Script = typeof GAME_SCRIPT

const PREVIEW_WORDS = ['brzina', 'fokus', 'ritam', 'tastatura', 'level', 'talas']
const WIDTH = 900
const HEIGHT = 560
const SHIP_X = WIDTH / 2
const SHIP_Y = HEIGHT - 50


// All words pre-loaded once — filtered by length at pick time
const ALL_GAME_WORDS = loadWords(GAME_SCRIPT, 'easy').filter((w) => /^[a-z]+$/.test(w))

function pickWord(minLen: number, maxLen: number): string {
  const pool = ALL_GAME_WORDS.filter((w) => w.length >= minLen && w.length <= maxLen)
  const src = pool.length > 0 ? pool : ALL_GAME_WORDS
  return src[Math.floor(Math.random() * src.length)] ?? 'test'
}

function makeEnemy(id: number, levelIdx: number, existing: Enemy[]): Enemy {
  const cfg = LEVEL_CONFIG[levelIdx]
  let word = pickWord(cfg.minWords, cfg.maxWords)
  const usedLetters = new Set(existing.map((e) => e.word[0]))
  for (let i = 0; i < 10 && usedLetters.has(word[0]); i++) {
    word = pickWord(cfg.minWords, cfg.maxWords)
  }
  const x = 80 + Math.random() * (WIDTH - 160)
  const speed = cfg.baseSpeed * (0.85 + Math.random() * 0.30)
  return { id, word, typed: 0, x, y: -30 - Math.random() * 60, speed, size: 8 + Math.min(10, word.length) }
}

function makePreviewEnemy(id: number, existing: Enemy[] = []): Enemy {
  const word = PREVIEW_WORDS[(id + Math.floor(Math.random() * PREVIEW_WORDS.length)) % PREVIEW_WORDS.length]
  const x = 90 + Math.random() * (WIDTH - 180)
  const highest = existing.reduce((min, enemy) => Math.min(min, enemy.y), 20)
  return {
    id,
    word,
    typed: 0,
    x,
    y: highest - 90 - Math.random() * 60,
    speed: 18 + Math.random() * 12,
    size: 11,
  }
}

function makePreviewEnemies(): Enemy[] {
  return PREVIEW_WORDS.map((word, index) => ({
    id: index + 1,
    word,
    typed: index === 0 ? 3 : 0,
    x: 160 + index * 180,
    y: 35 + index * 46,
    speed: 16 + index * 3,
    size: 11,
  }))
}

function useAudio(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null)

  const tone = useCallback((frequency: number, duration: number, type: OscillatorType, gain = 0.03) => {
    if (!enabled || typeof window === 'undefined') return
    const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextCtor) return
    const ctx = ctxRef.current ?? new AudioContextCtor()
    ctxRef.current = ctx
    const oscillator = ctx.createOscillator()
    const volume = ctx.createGain()
    oscillator.frequency.value = frequency
    oscillator.type = type
    volume.gain.value = gain
    oscillator.connect(volume)
    volume.connect(ctx.destination)
    oscillator.start()
    volume.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    oscillator.stop(ctx.currentTime + duration)
  }, [enabled])

  return {
    shoot: () => {
      tone(720, 0.04, 'triangle', 0.02)
      window.setTimeout(() => tone(430, 0.05, 'sine', 0.014), 24)
    },
    hit: () => {
      tone(120, 0.12, 'sawtooth', 0.035)
      window.setTimeout(() => tone(240, 0.08, 'triangle', 0.018), 45)
    },
    miss: () => tone(90, 0.12, 'square', 0.02),
  }
}

function AuthGate() {
  return (
    <div className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--card)]/92 p-5 text-center shadow-xl backdrop-blur-sm">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-[var(--accent)]/15 text-[var(--accent)]">
        <Lock className="h-5 w-5" />
      </div>
      <h2 className="text-xl font-semibold text-[var(--foreground)]">Moraš biti prijavljen da bi igrao</h2>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        U pozadini možeš da vidiš preview igre. Prijavi se ili napravi nalog da bi igrao.
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <Link
          href="/prijava"
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-90"
        >
          Prijava
        </Link>
        <Link
          href="/registracija"
          className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
        >
          Registracija
        </Link>
      </div>
    </div>
  )
}

export function IgraClient({ canPlay }: Props) {
  const [status, setStatus] = useState<GameStatus>(canPlay ? 'ready' : 'preview')
  const [soundOn, setSoundOn] = useState(true)
  const [enemies, setEnemies] = useState<Enemy[]>(() => makePreviewEnemies())
  const [shots, setShots] = useState<Shot[]>([])
  const [bursts, setBursts] = useState<Burst[]>([])
  const [fragments, setFragments] = useState<Fragment[]>([])
  const [targetId, setTargetId] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [elapsed, setElapsed] = useState(0)
  const [levelIdx, setLevelIdx] = useState(0)
  const [levelUpMsg, setLevelUpMsg] = useState<string | null>(null)
  const [streak, setStreak] = useState(0)
  const [mistakes, setMistakes] = useState(0)

  const ids = useRef({ enemy: 10, shot: 1, burst: 1, fragment: 1 })
  const lastFrame = useRef<number | null>(null)
  const spawnTimer = useRef(0)
  const elapsedRef = useRef(0)
  const levelIdxRef = useRef(0)
  const gameAreaRef = useRef<HTMLDivElement | null>(null)
  const audio = useAudio(soundOn && canPlay)

  const currentLevel = LEVEL_CONFIG[levelIdx]

  const activeTarget = useMemo(
    () => enemies.find((enemy) => enemy.id === targetId) ?? null,
    [enemies, targetId],
  )

  const resetGame = useCallback((nextStatus: GameStatus = 'ready') => {
    ids.current = { enemy: 10, shot: 1, burst: 1, fragment: 1 }
    lastFrame.current = null
    spawnTimer.current = 0
    elapsedRef.current = 0
    levelIdxRef.current = 0
    setEnemies([])
    setShots([])
    setBursts([])
    setFragments([])
    setTargetId(null)
    setScore(0)
    setLives(3)
    setElapsed(0)
    setLevelIdx(0)
    setLevelUpMsg(null)
    setStreak(0)
    setMistakes(0)
    setStatus(nextStatus)
  }, [])

  const startGame = useCallback(() => {
    if (!canPlay) return
    resetGame('playing')
    // Spawn minOnScreen enemies immediately at start
    const cfg = LEVEL_CONFIG[0]
    const initial: Enemy[] = []
    for (let i = 0; i < cfg.minOnScreen; i++) {
      initial.push(makeEnemy(ids.current.enemy++, 0, initial))
    }
    setEnemies(initial)
    gameAreaRef.current?.focus()
  }, [canPlay, resetGame])

  useEffect(() => {
    if (!canPlay) {
      setStatus('preview')
      setEnemies(makePreviewEnemies())
      setTargetId(1)
    }
  }, [canPlay])

  useEffect(() => {
    if (canPlay) return

    let frame = 0
    let demoShotTimer = 0
    lastFrame.current = null

    const tick = (now: number) => {
      const previous = lastFrame.current ?? now
      const delta = Math.min((now - previous) / 1000, 0.05)
      lastFrame.current = now
      demoShotTimer += delta

      setShots((current) => current
        .map((shot) => ({ ...shot, progress: shot.progress + delta * 2.8, life: shot.life - delta * 2.3 }))
        .filter((shot) => shot.progress < 1 && shot.life > 0))
      setBursts((current) => current
        .map((burst) => ({ ...burst, life: burst.life - delta * 2.1 }))
        .filter((burst) => burst.life > 0))
      setFragments((current) => current
        .map((fragment) => ({
          ...fragment,
          x: fragment.x + fragment.vx * delta,
          y: fragment.y + fragment.vy * delta,
          vy: fragment.vy + 90 * delta,
          life: fragment.life - delta * 1.7,
        }))
        .filter((fragment) => fragment.life > 0))

      setEnemies((current) => {
        let next = current
          .map((enemy) => ({ ...enemy, y: enemy.y + enemy.speed * delta }))
          .filter((enemy) => enemy.y < SHIP_Y - 32)

        while (next.length < 5) {
          next = [...next, makePreviewEnemy(ids.current.enemy++, next)]
        }

        const target = next
          .filter((enemy) => enemy.y > 20)
          .sort((a, b) => b.y - a.y)[0] ?? next[0]

        if (target && demoShotTimer > 0.34) {
          demoShotTimer = 0
          setTargetId(target.id)
          setShots((value) => [
            ...value.slice(-7),
            {
              id: ids.current.shot++,
              fromX: SHIP_X,
              fromY: SHIP_Y,
              toX: target.x,
              toY: target.y,
              progress: 0,
              life: 1,
            },
          ])

          next = next.flatMap((enemy) => {
            if (enemy.id !== target.id) return [enemy]
            const typed = enemy.typed + 1
            if (typed < enemy.word.length) return [{ ...enemy, typed }]

            setBursts((value) => [
              ...value.slice(-4),
              { id: ids.current.burst++, x: enemy.x, y: enemy.y, life: 1 },
            ])
            setFragments((value) => [
              ...value.slice(-24),
              ...Array.from({ length: 8 }, (_, index) => {
                const angle = (Math.PI * 2 * index) / 8 + Math.random() * 0.35
                const speed = 45 + Math.random() * 80
                return {
                  id: ids.current.fragment++,
                  x: enemy.x,
                  y: enemy.y,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  life: 1,
                }
              }),
            ])
            return []
          })
        }

        return next
      })

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [canPlay])

  useEffect(() => {
    if (status !== 'playing') return

    let frame = 0
    const tick = (now: number) => {
      const previous = lastFrame.current ?? now
      const delta = Math.min((now - previous) / 1000, 0.05)
      lastFrame.current = now
      spawnTimer.current += delta
      elapsedRef.current += delta

      // Level progression based on elapsed time
      const newLevelIdx = getLevelIndex(elapsedRef.current)
      if (newLevelIdx !== levelIdxRef.current) {
        levelIdxRef.current = newLevelIdx
        setLevelIdx(newLevelIdx)
        setLevelUpMsg(LEVEL_CONFIG[newLevelIdx].message)
        setTimeout(() => setLevelUpMsg(null), 2200)
      }
      setElapsed(Math.floor(elapsedRef.current))

      const cfg = LEVEL_CONFIG[levelIdxRef.current]

      setShots((current) => current
        .map((shot) => ({ ...shot, progress: shot.progress + delta * 3.4, life: shot.life - delta * 2.8 }))
        .filter((shot) => shot.progress < 1 && shot.life > 0))
      setBursts((current) => current
        .map((burst) => ({ ...burst, life: burst.life - delta * 2.4 }))
        .filter((burst) => burst.life > 0))
      setFragments((current) => current
        .map((fragment) => ({
          ...fragment,
          x: fragment.x + fragment.vx * delta,
          y: fragment.y + fragment.vy * delta,
          vy: fragment.vy + 120 * delta,
          life: fragment.life - delta * 1.8,
        }))
        .filter((fragment) => fragment.life > 0))

      setEnemies((current) => {
        let next = current.map((enemy) => ({ ...enemy, y: enemy.y + enemy.speed * delta }))
        const escaped = next.filter((enemy) => enemy.y > SHIP_Y - 20)
        if (escaped.length > 0) {
          audio.miss()
          setStreak(0)
          setLives((value) => {
            const remaining = value - escaped.length
            if (remaining <= 0) setStatus('gameover')
            return Math.max(0, remaining)
          })
          setTargetId((id) => escaped.some((enemy) => enemy.id === id) ? null : id)
          next = next.filter((enemy) => enemy.y <= SHIP_Y - 20)
        }

        // Always refill to minOnScreen immediately; respect maxOnScreen via interval
        while (next.length < cfg.minOnScreen) {
          next = [...next, makeEnemy(ids.current.enemy++, levelIdxRef.current, next)]
        }
        if (spawnTimer.current > cfg.spawnInterval && next.length < cfg.maxOnScreen) {
          spawnTimer.current = 0
          next = [...next, makeEnemy(ids.current.enemy++, levelIdxRef.current, next)]
        }

        return next
      })

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [audio, status])

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!canPlay) return
    if (event.key === 'Enter' && status !== 'playing') {
      startGame()
      return
    }
    if (event.key === 'Tab') {
      event.preventDefault()
      startGame()
      return
    }
    if (status !== 'playing' || event.key.length !== 1) return

    const key = event.key.toLocaleLowerCase('sr-RS')

    setEnemies((current) => {
      const currentTarget = current.find((enemy) => enemy.id === targetId)

      if (currentTarget) {
        const expected = currentTarget.word[currentTarget.typed]?.toLocaleLowerCase('sr-RS')
        if (expected !== key) {
          setMistakes((value) => value + 1)
          setStreak(0)
          audio.miss()
          return current
        }
      }

      const nextTarget = currentTarget
        ?? current
          .filter((enemy) => enemy.typed === 0 && enemy.word[0]?.toLocaleLowerCase('sr-RS') === key)
          .sort((a, b) => b.y - a.y)[0]

      if (!nextTarget) {
        setMistakes((value) => value + 1)
        setStreak(0)
        audio.miss()
        return current
      }

      audio.shoot()
      setTargetId(nextTarget.id)
      setShots((value) => [
        ...value,
        {
          id: ids.current.shot++,
          fromX: SHIP_X,
          fromY: SHIP_Y,
          toX: nextTarget.x,
          toY: nextTarget.y,
          progress: 0,
          life: 1,
        },
      ])

      let destroyedEnemy: Enemy | null = null
      const next: Enemy[] = []
      for (const enemy of current) {
        if (enemy.id !== nextTarget.id) {
          next.push(enemy)
          continue
        }
        const typedNext = enemy.typed + 1
        if (typedNext >= enemy.word.length) {
          destroyedEnemy = enemy
          continue
        }
        next.push({ ...enemy, typed: typedNext })
      }

      if (destroyedEnemy) {
        audio.hit()
        setTargetId(null)
        setStreak((s) => s + 1)
        // Score: base * level multiplier * streak bonus (capped at 5x)
        setScore((value) => {
          const base = destroyedEnemy.word.length * 25
          const lvlBonus = (levelIdxRef.current + 1) * 15
          return value + base + lvlBonus
        })
        setBursts((value) => [
          ...value,
          { id: ids.current.burst++, x: destroyedEnemy.x, y: destroyedEnemy.y, life: 1 },
        ])
        setFragments((value) => [
          ...value,
          ...Array.from({ length: 10 }, (_, index) => {
            const angle = (Math.PI * 2 * index) / 10 + Math.random() * 0.4
            const speed = 50 + Math.random() * 95
            return {
              id: ids.current.fragment++,
              x: destroyedEnemy.x,
              y: destroyedEnemy.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1,
            }
          }),
        ])
      }

      return next
    })
  }, [audio, canPlay, startGame, status, targetId])

  const previewOverlay = !canPlay

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[var(--background)] px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Svemirsko kucanje</h1>
            <p className="mt-1 max-w-xl text-sm text-[var(--muted-foreground)]">
              Kucaj reči koje padaju odozgo i brod će ih obarati slovo po slovo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundOn((value) => !value)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              aria-label={soundOn ? 'Isključi zvuk' : 'Uključi zvuk'}
            >
              {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => canPlay && startGame()}
              disabled={!canPlay}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              {status === 'gameover' ? 'Ponovo' : 'Start'}
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <div
            ref={gameAreaRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className="relative aspect-[900/560] min-h-[360px] overflow-hidden rounded-lg border border-[var(--border)] bg-[radial-gradient(circle_at_50%_18%,rgba(204,139,37,0.16),transparent_28%),linear-gradient(180deg,var(--card),var(--background))] outline-none"
          >
            <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle,rgba(128,128,128,0.35)_1px,transparent_1px)] [background-size:42px_42px]" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--background)] to-transparent" />

            {enemies.map((enemy) => {
              const left = `${(enemy.x / WIDTH) * 100}%`
              const top = `${(enemy.y / HEIGHT) * 100}%`
              const locked = enemy.id === targetId
              return (
                <div
                  key={enemy.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
                  style={{ left, top }}
                >
                  <div
                    className={cn(
                      'mx-auto mb-1 h-3 w-3 rotate-45 rounded-[2px] border',
                      locked
                        ? 'border-[var(--accent)] bg-[var(--accent)] shadow-[0_0_18px_rgba(204,139,37,0.75)]'
                        : 'border-[var(--muted-foreground)]/40 bg-[var(--muted)]',
                    )}
                  />
                  <div className="rounded-md border border-[var(--border)] bg-[var(--background)]/80 px-2 py-1 font-mono text-sm shadow-sm backdrop-blur">
                    <span className="text-[var(--accent)]">{enemy.word.slice(0, enemy.typed)}</span>
                    <span className="text-[var(--foreground)]">{enemy.word.slice(enemy.typed)}</span>
                  </div>
                </div>
              )
            })}

            {shots.map((shot) => {
              const x = shot.fromX + (shot.toX - shot.fromX) * shot.progress
              const y = shot.fromY + (shot.toY - shot.fromY) * shot.progress
              const angle = Math.atan2(shot.toY - shot.fromY, shot.toX - shot.fromX) * 180 / Math.PI
              return (
                <div
                  key={shot.id}
                  className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${(x / WIDTH) * 100}%`,
                    top: `${(y / HEIGHT) * 100}%`,
                    opacity: shot.life,
                    transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                  }}
                >
                  <span className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_14px_rgba(204,139,37,0.95)]" />
                  <span className="absolute left-0 top-[9px] h-1.5 w-1.5 rounded-full bg-[var(--accent)]/70" />
                  <span className="absolute -left-2 top-[10px] h-1 w-1 rounded-full bg-[var(--accent)]/40" />
                </div>
              )
            })}

            {bursts.map((burst) => (
              <div
                key={burst.id}
                className="absolute h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--accent)] bg-[var(--accent)]/10 shadow-[0_0_22px_rgba(204,139,37,0.65)]"
                style={{
                  left: `${(burst.x / WIDTH) * 100}%`,
                  top: `${(burst.y / HEIGHT) * 100}%`,
                  transform: `translate(-50%, -50%) scale(${1.4 - burst.life})`,
                  opacity: burst.life,
                }}
              />
            ))}

            {fragments.map((fragment) => (
              <div
                key={fragment.id}
                className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-[2px] bg-[var(--accent)]"
                style={{
                  left: `${(fragment.x / WIDTH) * 100}%`,
                  top: `${(fragment.y / HEIGHT) * 100}%`,
                  opacity: fragment.life,
                }}
              />
            ))}

            <div className="absolute left-1/2 bottom-8 -translate-x-1/2">
              <div className="relative h-12 w-14">
                <div className="absolute left-1/2 top-0 h-10 w-5 -translate-x-1/2 rounded-t-full border border-[var(--accent)] bg-[var(--background)] shadow-[0_0_18px_rgba(204,139,37,0.35)]" />
                <div className="absolute bottom-1 left-0 h-3 w-14 rounded-full bg-[var(--muted)]" />
                <div className="absolute bottom-0 left-1/2 h-3 w-2 -translate-x-1/2 rounded-b-full bg-[var(--accent)]" />
              </div>
            </div>

            {/* Level-up notification */}
            {levelUpMsg && (
              <div className="pointer-events-none absolute inset-x-0 top-8 flex justify-center">
                <div className="animate-bounce rounded-full border border-[var(--accent)] bg-[var(--accent)]/20 px-5 py-2 text-sm font-semibold text-[var(--accent)] shadow-lg backdrop-blur-sm">
                  Level {currentLevel.label} — {levelUpMsg}
                </div>
              </div>
            )}

            {status !== 'playing' && (
              <div className={cn(
                'absolute inset-0 flex items-center justify-center',
                previewOverlay ? 'bg-[var(--background)]/18' : 'bg-[var(--background)]/45 backdrop-blur-[1px]',
              )}>
                {previewOverlay ? (
                  <AuthGate />
                ) : (
                  <div className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 text-center shadow-lg">
                    {status === 'gameover' ? (
                    <>
                      <h2 className="text-lg font-semibold text-[var(--foreground)]">Kraj igre</h2>
                      <p className="mt-1 text-2xl font-bold text-[var(--accent)]">{score.toLocaleString()}</p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        Level {currentLevel.label} · {elapsed}s · {streak} streak
                      </p>
                      <button
                        type="button"
                        onClick={startGame}
                        className="mt-4 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90"
                      >
                        Igraj ponovo
                      </button>
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg font-semibold text-[var(--foreground)]">Spremno</h2>
                      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                        Klikni Start ili pritisni Enter. Prvo slovo bira metu, svako sledeće puca u nju.
                      </p>
                      <button
                        type="button"
                        onClick={startGame}
                        className="mt-4 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90"
                      >
                        Start
                      </button>
                    </>
                  )}
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2">
                <p className="font-mono text-3xl font-bold text-[var(--accent)]">{score.toLocaleString()}</p>
                <p className="text-xs text-[var(--muted-foreground)]">score</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-[var(--foreground)]">{lives}</p>
                <p className="text-xs text-[var(--muted-foreground)]">životi</p>
              </div>
              <div>
                <p className={cn('font-mono text-2xl font-bold', streak >= 5 ? 'text-[var(--accent)]' : 'text-[var(--foreground)]')}>
                  {streak >= 5 ? `${streak}🔥` : streak}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">streak</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-[var(--foreground)]">{currentLevel.label}</p>
                <p className="text-xs text-[var(--muted-foreground)]">level</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-[var(--foreground)]">{elapsed}s</p>
                <p className="text-xs text-[var(--muted-foreground)]">vreme</p>
              </div>
            </div>

            {/* Level progress bar */}
            <div className="border-t border-[var(--border)] pt-3">
              <div className="mb-1 flex justify-between text-xs text-[var(--muted-foreground)]">
                <span>Level {currentLevel.label}</span>
                {levelIdx < LEVEL_CONFIG.length - 1 && (
                  <span>{Math.max(0, LEVEL_THRESHOLDS[levelIdx + 1] - elapsed)}s do sl.</span>
                )}
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all duration-1000"
                  style={{
                    width: levelIdx < LEVEL_CONFIG.length - 1
                      ? `${Math.min(100, ((elapsed - LEVEL_THRESHOLDS[levelIdx]) / (LEVEL_THRESHOLDS[levelIdx + 1] - LEVEL_THRESHOLDS[levelIdx])) * 100)}%`
                      : '100%'
                  }}
                />
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
              <p>Meta: <span className="text-[var(--foreground)]">{activeTarget?.word ?? '-'}</span></p>
              <p>Greške: <span className="text-[var(--foreground)]">{mistakes}</span></p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
