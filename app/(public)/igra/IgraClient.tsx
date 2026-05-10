'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Lock, RotateCcw, Volume2, VolumeX, Zap } from 'lucide-react'
import { buildWordTest, loadWords } from '@/lib/words/loader'
import type { TestLevel } from '@/lib/typing/engine'
import { cn } from '@/lib/utils'

type Script = 'latinica' | 'cirilica' | 'easy'
type GameStatus = 'preview' | 'ready' | 'playing' | 'gameover'

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
  life: number
}

interface Burst {
  id: number
  x: number
  y: number
  life: number
}

const SCRIPTS: { id: Script; label: string }[] = [
  { id: 'latinica', label: 'Latinica' },
  { id: 'cirilica', label: 'Ćirilica' },
  { id: 'easy', label: 'Bez kvačica' },
]

const LEVELS: { id: TestLevel; label: string }[] = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
  { id: 'expert', label: 'Expert' },
]

const PREVIEW_WORDS = ['brzina', 'fokus', 'ritam', 'tastatura']
const WIDTH = 900
const HEIGHT = 560
const SHIP_X = WIDTH / 2
const SHIP_Y = HEIGHT - 50

function pickWord(script: Script, level: TestLevel): string {
  const words = loadWords(script, level).filter((word) => /^[\p{L}]+$/u.test(word) && word.length >= 3 && word.length <= 12)
  const built = buildWordTest(words, 1)
  return built.split(' ')[0] ?? words[Math.floor(Math.random() * words.length)] ?? 'test'
}

function makeEnemy(id: number, script: Script, level: TestLevel, wave: number, existing: Enemy[]): Enemy {
  let word = pickWord(script, level)
  const usedLetters = new Set(existing.map((enemy) => enemy.word[0]?.toLocaleLowerCase('sr-RS')))

  for (let i = 0; i < 10 && usedLetters.has(word[0]?.toLocaleLowerCase('sr-RS')); i += 1) {
    word = pickWord(script, level)
  }

  const x = 80 + Math.random() * (WIDTH - 160)
  return {
    id,
    word,
    typed: 0,
    x,
    y: -30 - Math.random() * 80,
    speed: 24 + wave * 4 + Math.random() * 18,
    size: 8 + Math.min(10, word.length),
  }
}

function makePreviewEnemies(): Enemy[] {
  return PREVIEW_WORDS.map((word, index) => ({
    id: index + 1,
    word,
    typed: index === 0 ? 3 : 0,
    x: 160 + index * 180,
    y: 70 + index * 42,
    speed: 0,
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
    shoot: () => tone(560, 0.07, 'triangle', 0.025),
    hit: () => tone(130, 0.16, 'sawtooth', 0.035),
    miss: () => tone(90, 0.12, 'square', 0.02),
  }
}

export function IgraClient({ canPlay }: Props) {
  const [script, setScript] = useState<Script>('latinica')
  const [level, setLevel] = useState<TestLevel>('easy')
  const [status, setStatus] = useState<GameStatus>(canPlay ? 'ready' : 'preview')
  const [soundOn, setSoundOn] = useState(true)
  const [enemies, setEnemies] = useState<Enemy[]>(() => makePreviewEnemies())
  const [shots, setShots] = useState<Shot[]>([])
  const [bursts, setBursts] = useState<Burst[]>([])
  const [targetId, setTargetId] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [wave, setWave] = useState(1)
  const [typed, setTyped] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [startedAt, setStartedAt] = useState<number | null>(null)

  const ids = useRef({ enemy: 10, shot: 1, burst: 1 })
  const lastFrame = useRef<number | null>(null)
  const spawnTimer = useRef(0)
  const gameAreaRef = useRef<HTMLDivElement | null>(null)
  const audio = useAudio(soundOn && canPlay)

  const accuracy = typed === 0 ? 100 : Math.max(0, Math.round(((typed - mistakes) / typed) * 100))
  const elapsedMinutes = startedAt ? Math.max((Date.now() - startedAt) / 60000, 0.01) : 0
  const wpm = startedAt ? Math.round((typed / 5) / elapsedMinutes) : 0

  const activeTarget = useMemo(
    () => enemies.find((enemy) => enemy.id === targetId) ?? null,
    [enemies, targetId],
  )

  const resetGame = useCallback((nextStatus: GameStatus = 'ready') => {
    ids.current = { enemy: 10, shot: 1, burst: 1 }
    lastFrame.current = null
    spawnTimer.current = 0
    setEnemies([])
    setShots([])
    setBursts([])
    setTargetId(null)
    setScore(0)
    setLives(3)
    setWave(1)
    setTyped(0)
    setMistakes(0)
    setStartedAt(null)
    setStatus(nextStatus)
  }, [])

  const startGame = useCallback(() => {
    if (!canPlay) return
    resetGame('playing')
    setStartedAt(Date.now())
    const firstEnemy = makeEnemy(ids.current.enemy++, script, level, 1, [])
    const secondEnemy = makeEnemy(ids.current.enemy++, script, level, 1, [firstEnemy])
    setEnemies([firstEnemy, secondEnemy])
    gameAreaRef.current?.focus()
  }, [canPlay, level, resetGame, script])

  useEffect(() => {
    if (!canPlay) {
      setStatus('preview')
      setEnemies(makePreviewEnemies())
    }
  }, [canPlay])

  useEffect(() => {
    if (status !== 'playing') return

    let frame = 0
    const tick = (now: number) => {
      const previous = lastFrame.current ?? now
      const delta = Math.min((now - previous) / 1000, 0.05)
      lastFrame.current = now
      spawnTimer.current += delta

      setShots((current) => current
        .map((shot) => ({ ...shot, life: shot.life - delta * 4 }))
        .filter((shot) => shot.life > 0))
      setBursts((current) => current
        .map((burst) => ({ ...burst, life: burst.life - delta * 2.4 }))
        .filter((burst) => burst.life > 0))

      setEnemies((current) => {
        let next = current.map((enemy) => ({ ...enemy, y: enemy.y + enemy.speed * delta }))
        const escaped = next.filter((enemy) => enemy.y > SHIP_Y - 20)
        if (escaped.length > 0) {
          audio.miss()
          setLives((value) => {
            const remaining = value - escaped.length
            if (remaining <= 0) setStatus('gameover')
            return Math.max(0, remaining)
          })
          setTargetId((id) => escaped.some((enemy) => enemy.id === id) ? null : id)
          next = next.filter((enemy) => enemy.y <= SHIP_Y - 20)
        }

        if (spawnTimer.current > Math.max(0.8, 2.2 - wave * 0.08)) {
          spawnTimer.current = 0
          next = [...next, makeEnemy(ids.current.enemy++, script, level, wave, next)]
        }

        return next
      })

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [audio, level, script, status, wave])

  useEffect(() => {
    setWave((current) => Math.max(current, Math.min(12, Math.floor(score / 350) + 1)))
  }, [score])

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
    setTyped((value) => value + 1)

    setEnemies((current) => {
      const currentTarget = current.find((enemy) => enemy.id === targetId)
      const nextTarget = currentTarget && currentTarget.word[currentTarget.typed]?.toLocaleLowerCase('sr-RS') === key
        ? currentTarget
        : current.find((enemy) => enemy.typed === 0 && enemy.word[0]?.toLocaleLowerCase('sr-RS') === key)

      if (!nextTarget) {
        setMistakes((value) => value + 1)
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
        setScore((value) => value + destroyedEnemy.word.length * 20 + wave * 10)
        setBursts((value) => [
          ...value,
          { id: ids.current.burst++, x: destroyedEnemy.x, y: destroyedEnemy.y, life: 1 },
        ])
      }

      return next
    })
  }, [audio, canPlay, startGame, status, targetId, wave])

  const previewOverlay = !canPlay

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[var(--background)] px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-1 text-xs text-[var(--muted-foreground)]">
              <Zap className="h-3.5 w-3.5 text-[var(--accent)]" />
              Igra za vežbanje brzog kucanja
            </div>
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
              const dx = shot.toX - shot.fromX
              const dy = shot.toY - shot.fromY
              const length = Math.sqrt(dx * dx + dy * dy)
              const angle = Math.atan2(dy, dx) * 180 / Math.PI
              return (
                <div
                  key={shot.id}
                  className="absolute h-px origin-left bg-[var(--accent)] shadow-[0_0_10px_rgba(204,139,37,0.9)]"
                  style={{
                    left: `${(shot.fromX / WIDTH) * 100}%`,
                    top: `${(shot.fromY / HEIGHT) * 100}%`,
                    width: `${(length / WIDTH) * 100}%`,
                    transform: `rotate(${angle}deg)`,
                    opacity: shot.life,
                  }}
                />
              )
            })}

            {bursts.map((burst) => (
              <div
                key={burst.id}
                className="absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--accent)]"
                style={{
                  left: `${(burst.x / WIDTH) * 100}%`,
                  top: `${(burst.y / HEIGHT) * 100}%`,
                  transform: `translate(-50%, -50%) scale(${1.4 - burst.life})`,
                  opacity: burst.life,
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

            {status !== 'playing' && (
              <div className="absolute inset-0 flex items-center justify-center bg-[var(--background)]/45 backdrop-blur-[1px]">
                <div className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 text-center shadow-lg">
                  {previewOverlay ? (
                    <>
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-[var(--accent)]/15 text-[var(--accent)]">
                        <Lock className="h-5 w-5" />
                      </div>
                      <h2 className="text-lg font-semibold text-[var(--foreground)]">Preview igre</h2>
                      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                        Igru mogu da igraju registrovani korisnici. Preview ostaje vidljiv da vidiš kako izgleda.
                      </p>
                      <div className="mt-4 flex justify-center gap-2">
                        <Link href="/registracija" className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90">
                          Registruj se
                        </Link>
                        <Link href="/prijava" className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)]">
                          Prijava
                        </Link>
                      </div>
                    </>
                  ) : status === 'gameover' ? (
                    <>
                      <h2 className="text-lg font-semibold text-[var(--foreground)]">Kraj igre</h2>
                      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                        Score {score} · {wpm} WPM · tačnost {accuracy}%
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
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-mono text-2xl font-bold text-[var(--accent)]">{score}</p>
                <p className="text-xs text-[var(--muted-foreground)]">score</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-[var(--foreground)]">{lives}</p>
                <p className="text-xs text-[var(--muted-foreground)]">životi</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-[var(--foreground)]">{wave}</p>
                <p className="text-xs text-[var(--muted-foreground)]">talas</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-[var(--foreground)]">{wpm}</p>
                <p className="text-xs text-[var(--muted-foreground)]">wpm</p>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-3">
              <p className="mb-2 text-xs uppercase tracking-widest text-[var(--muted-foreground)]">Pismo</p>
              <div className="grid gap-1">
                {SCRIPTS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={status === 'playing'}
                    onClick={() => setScript(item.id)}
                    className={cn(
                      'rounded-md px-2.5 py-1.5 text-left text-sm transition-colors disabled:opacity-50',
                      script === item.id ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-3">
              <p className="mb-2 text-xs uppercase tracking-widest text-[var(--muted-foreground)]">Težina</p>
              <div className="grid grid-cols-2 gap-1">
                {LEVELS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={status === 'playing'}
                    onClick={() => setLevel(item.id)}
                    className={cn(
                      'rounded-md px-2 py-1.5 text-sm transition-colors disabled:opacity-50',
                      level === item.id ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
              <p>Aktivna meta: <span className="text-[var(--foreground)]">{activeTarget?.word ?? '-'}</span></p>
              <p>Tačnost: <span className="text-[var(--foreground)]">{accuracy}%</span></p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
