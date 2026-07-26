'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RotateCcw, Volume2, VolumeX, X } from 'lucide-react'
import Link from 'next/link'
import GAME_POOL from '@/lib/words/game-pool.json'
import { cn } from '@/lib/utils'
import { NicknameModal } from '@/components/auth/NicknameModal'
import { checkHasNickname } from '@/lib/auth/anonymous'

type GameStatus = 'preview' | 'ready' | 'playing' | 'gameover'

// Score thresholds for level-up (+15% vs previous)
const LEVEL_SCORE_THRESHOLDS = [0, 35, 85, 155, 240, 355, 500, 690, 920, 1190]

// Config per level — speed in px/sec (+15%), spawnInterval unchanged.
const LEVEL_CONFIG: {
  minLen: number
  maxLen: number
  baseSpeed: number
  spawnInterval: number
  minOnScreen: number
  maxOnScreen: number
  label: string
}[] = [
  { minLen: 3, maxLen: 4, baseSpeed: 13, spawnInterval: 4.0, minOnScreen: 2, maxOnScreen: 3, label: '1'  },
  { minLen: 3, maxLen: 5, baseSpeed: 15, spawnInterval: 3.5, minOnScreen: 2, maxOnScreen: 3, label: '2'  },
  { minLen: 4, maxLen: 5, baseSpeed: 17, spawnInterval: 3.1, minOnScreen: 2, maxOnScreen: 3, label: '3'  },
  { minLen: 4, maxLen: 6, baseSpeed: 20, spawnInterval: 2.8, minOnScreen: 2, maxOnScreen: 4, label: '4'  },
  { minLen: 4, maxLen: 7, baseSpeed: 23, spawnInterval: 2.5, minOnScreen: 3, maxOnScreen: 4, label: '5'  },
  { minLen: 5, maxLen: 7, baseSpeed: 26, spawnInterval: 2.2, minOnScreen: 3, maxOnScreen: 5, label: '6'  },
  { minLen: 5, maxLen: 8, baseSpeed: 31, spawnInterval: 2.0, minOnScreen: 3, maxOnScreen: 5, label: '7'  },
  { minLen: 5, maxLen: 8, baseSpeed: 36, spawnInterval: 1.8, minOnScreen: 4, maxOnScreen: 6, label: '8'  },
  { minLen: 6, maxLen: 9, baseSpeed: 41, spawnInterval: 1.6, minOnScreen: 4, maxOnScreen: 6, label: '9'  },
  { minLen: 6, maxLen: 10, baseSpeed: 48, spawnInterval: 1.4, minOnScreen: 5, maxOnScreen: 7, label: '10' },
]

function getLevelIndex(score: number): number {
  let idx = 0
  for (let i = 0; i < LEVEL_SCORE_THRESHOLDS.length; i++) {
    if (score >= LEVEL_SCORE_THRESHOLDS[i]) idx = i
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

interface FloatingText {
  id: number
  x: number
  y: number
  text: string
  life: number
}

const PREVIEW_WORDS = ['brzina', 'fokus', 'ritam', 'tastatura', 'level', 'talas']
const WIDTH = 900
const HEIGHT = 560
const SHIP_X = WIDTH / 2
const SHIP_Y = HEIGHT - 50

function isAsciiGameWord(word: string): boolean {
  return /^[a-z]+$/i.test(word)
}

const ALL_GAME_WORDS = (GAME_POOL as string[]).filter(isAsciiGameWord)

function pickWord(minLen: number, maxLen: number): string {
  const pool = ALL_GAME_WORDS.filter((w) => w.length >= minLen && w.length <= maxLen)
  const src = pool.length > 0 ? pool : ALL_GAME_WORDS
  return src[Math.floor(Math.random() * src.length)] ?? 'test'
}

function makeEnemy(id: number, levelIdx: number, existing: Enemy[]): Enemy {
  const cfg = LEVEL_CONFIG[levelIdx]
  let word = pickWord(cfg.minLen, cfg.maxLen)
  const usedLetters = new Set(existing.map((e) => e.word[e.typed]))
  for (let i = 0; i < 12 && usedLetters.has(word[0]); i++) {
    word = pickWord(cfg.minLen, cfg.maxLen)
  }
  const x = 90 + Math.random() * (WIDTH - 180)
  const y = existing.length === 0 ? 30 : -20 - Math.random() * 40
  const speed = cfg.baseSpeed * (0.85 + Math.random() * 0.30)
  return { id, word, typed: 0, x, y, speed }
}

function makePreviewEnemy(id: number, existing: Enemy[] = []): Enemy {
  const word = PREVIEW_WORDS[(id + Math.floor(Math.random() * PREVIEW_WORDS.length)) % PREVIEW_WORDS.length]
  const x = 90 + Math.random() * (WIDTH - 180)
  const highest = existing.reduce((min, enemy) => Math.min(min, enemy.y), 20)
  return { id, word, typed: 0, x, y: highest - 90 - Math.random() * 60, speed: 16 + Math.random() * 10 }
}

function makePreviewEnemies(): Enemy[] {
  return PREVIEW_WORDS.map((word, index) => ({
    id: index + 1,
    word,
    typed: index === 0 ? 3 : 0,
    x: 160 + index * 180,
    y: 35 + index * 46,
    speed: 16 + index * 3,
  }))
}

function useAudio(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null)

  const getCtx = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return null
    const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextCtor) return null
    if (!ctxRef.current) ctxRef.current = new AudioContextCtor()
    const ctx = ctxRef.current
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }, [enabled])

  const tone = useCallback((frequency: number, duration: number, type: OscillatorType, gain = 0.03, freqEnd?: number) => {
    const ctx = getCtx()
    if (!ctx) return
    const oscillator = ctx.createOscillator()
    const volume = ctx.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
    if (freqEnd !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), ctx.currentTime + duration)
    }
    volume.gain.setValueAtTime(gain, ctx.currentTime)
    oscillator.connect(volume)
    volume.connect(ctx.destination)
    oscillator.start()
    volume.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + duration)
    oscillator.stop(ctx.currentTime + duration + 0.02)
  }, [getCtx])

  const noise = useCallback((duration: number, gain = 0.03, filterFreq = 1200) => {
    const ctx = getCtx()
    if (!ctx) return
    const bufferSize = Math.floor(ctx.sampleRate * duration)
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = filterFreq
    const volume = ctx.createGain()
    volume.gain.setValueAtTime(gain, ctx.currentTime)
    volume.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + duration)
    src.connect(filter)
    filter.connect(volume)
    volume.connect(ctx.destination)
    src.start()
    src.stop(ctx.currentTime + duration + 0.02)
  }, [getCtx])

  return {
    type: () => tone(880, 0.025, 'square', 0.012),
    shoot: () => {
      tone(900, 0.06, 'triangle', 0.022, 380)
    },
    hit: () => {
      tone(520, 0.08, 'triangle', 0.025, 220)
      noise(0.08, 0.02, 1800)
    },
    miss: () => tone(140, 0.10, 'square', 0.022, 80),
    levelUp: () => {
      tone(523, 0.10, 'sine', 0.035)
      window.setTimeout(() => tone(659, 0.10, 'sine', 0.035), 90)
      window.setTimeout(() => tone(784, 0.16, 'sine', 0.04), 180)
    },
    gameOver: () => {
      tone(440, 0.20, 'sawtooth', 0.04, 110)
      noise(0.4, 0.025, 600)
    },
  }
}

interface LeaderRow { username: string | null; user_id: string; max_score: number }
interface CurrentUser { rank: number | null; score: number | null; userId: string }

export function IgraClient({ canPlay = true }: Props) {
  const [status, setStatus] = useState<GameStatus>(canPlay ? 'ready' : 'preview')
  const [soundOn, setSoundOn] = useState(true)
  const [enemies, setEnemies] = useState<Enemy[]>(() => canPlay ? [] : makePreviewEnemies())
  const [shots, setShots] = useState<Shot[]>([])
  const [bursts, setBursts] = useState<Burst[]>([])
  const [fragments, setFragments] = useState<Fragment[]>([])
  const [floats, setFloats] = useState<FloatingText[]>([])
  const [targetId, setTargetId] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [elapsed, setElapsed] = useState(0)
  const [levelIdx, setLevelIdx] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [wordsDestroyed, setWordsDestroyed] = useState(0)
  const [shake, setShake] = useState(0)
  const [mobileGameHeight, setMobileGameHeight] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<CurrentUser | null>(null)
  const [showNicknameModal, setShowNicknameModal] = useState(false)
  const [nicknameReady, setNicknameReady] = useState(false)

  useEffect(() => {
    checkHasNickname().then(setNicknameReady)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)')
    const update = () => setIsMobile(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    fetch('/api/game-score')
      .then(res => res.json())
      .then(data => {
        if (data.leaderboard) setLeaderboard(data.leaderboard)
        if (data.currentUser) setCurrentUserRank(data.currentUser)
      })
      .catch(console.error)
  }, [])

  const submitScore = async (finalScore: number, finalLevel: number, destroyed: number, elapsedSec: number) => {
    try {
      await fetch('/api/game-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: finalScore, level: finalLevel, words_destroyed: destroyed, elapsed_seconds: elapsedSec }),
      })
      const res = await fetch('/api/game-score')
      const data = await res.json()
      if (data.leaderboard) setLeaderboard(data.leaderboard)
      if (data.currentUser) setCurrentUserRank(data.currentUser)

      const hasNick = await checkHasNickname()
      if (!hasNick) {
        setShowNicknameModal(true)
      }
    } catch (e) {
      console.error('Failed to submit score', e)
    }
  }

  const ids = useRef({ enemy: 10, shot: 1, burst: 1, fragment: 1, float: 1 })
  const frameRef = useRef(0)
  const lastFrame = useRef<number | null>(null)
  const spawnTimer = useRef(0)
  const elapsedRef = useRef(0)
  const lastElapsedRef = useRef(0)
  const levelIdxRef = useRef(0)
  const scoreRef = useRef(0)
  const gameAreaRef = useRef<HTMLDivElement | null>(null)
  const mobileInputRef = useRef<HTMLInputElement | null>(null)
  const lastMobileKeyRef = useRef({ key: '', at: 0 })
  const fullViewportHeightRef = useRef(0)
  const audio = useAudio(soundOn && canPlay)

  const currentLevel = LEVEL_CONFIG[levelIdx]
  const isMobilePlaying = isMobile && status === 'playing'

  const resetGame = useCallback((nextStatus: GameStatus = 'ready') => {
    ids.current = { enemy: 10, shot: 1, burst: 1, fragment: 1, float: 1 }
    lastFrame.current = null
    spawnTimer.current = 0
    elapsedRef.current = 0
    lastElapsedRef.current = 0
    levelIdxRef.current = 0
    scoreRef.current = 0
    setEnemies([])
    setShots([])
    setBursts([])
    setFragments([])
    setFloats([])
    setTargetId(null)
    setScore(0)
    setLives(3)
    setElapsed(0)
    setLevelIdx(0)
    setStreak(0)
    setBestStreak(0)
    setWordsDestroyed(0)
    setShake(0)
    setStatus(nextStatus)
  }, [])

  const exitMobileGame = useCallback(() => {
    mobileInputRef.current?.blur()
    resetGame('ready')
  }, [resetGame])

  const startGame = useCallback(() => {
    if (!canPlay) return
    if (!nicknameReady) {
      setShowNicknameModal(true)
      return
    }
    resetGame('playing')
    const cfg = LEVEL_CONFIG[0]
    const initial: Enemy[] = []
    for (let i = 0; i < cfg.minOnScreen; i++) {
      initial.push(makeEnemy(ids.current.enemy++, 0, initial))
    }
    setEnemies(initial)
    if (window.matchMedia('(max-width: 639px)').matches) {
      mobileInputRef.current?.focus()
    } else {
      gameAreaRef.current?.focus()
    }
  }, [canPlay, nicknameReady, resetGame])



  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const updateMobileViewport = () => {
      fullViewportHeightRef.current = Math.max(fullViewportHeightRef.current, window.innerHeight, viewport.height)
      const keyboardOpen = fullViewportHeightRef.current - viewport.height > 120
      setMobileGameHeight(keyboardOpen ? Math.max(240, Math.floor(viewport.height)) : null)
    }

    updateMobileViewport()
    viewport.addEventListener('resize', updateMobileViewport)
    viewport.addEventListener('scroll', updateMobileViewport)
    return () => {
      viewport.removeEventListener('resize', updateMobileViewport)
      viewport.removeEventListener('scroll', updateMobileViewport)
    }
  }, [])
  useEffect(() => {
    document.documentElement.classList.toggle('mobile-game-active', isMobilePlaying)
    if (!isMobilePlaying) mobileInputRef.current?.blur()
    return () => document.documentElement.classList.remove('mobile-game-active')
  }, [isMobilePlaying])

  useEffect(() => {
    if (!isMobile || !nicknameReady || status !== 'ready') return
    mobileInputRef.current?.focus()
  }, [isMobile, nicknameReady, status])

  // Preview animation
  useEffect(() => {
    if (canPlay) return

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
            { id: ids.current.shot++, fromX: SHIP_X, fromY: SHIP_Y, toX: target.x, toY: target.y, progress: 0, life: 1 },
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
              ...Array.from({ length: 8 }, (_, i) => {
                const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.35
                const speed = 45 + Math.random() * 80
                return { id: ids.current.fragment++, x: enemy.x, y: enemy.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1 }
              }),
            ])
            return []
          })
        }

        return next
      })

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [canPlay])

  // Submit score when game over
  useEffect(() => {
    if (status === 'gameover' && score > 0) {
      submitScore(score, levelIdx, wordsDestroyed, elapsed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // Main game loop
  useEffect(() => {
    if (status !== 'playing') return

    const tick = (now: number) => {
      const previous = lastFrame.current ?? now
      const delta = Math.min((now - previous) / 1000, 0.05)
      lastFrame.current = now
      spawnTimer.current += delta
      elapsedRef.current += delta

      // Level progression (no boss interruption)
      const newLevelIdx = getLevelIndex(scoreRef.current)
      if (newLevelIdx > levelIdxRef.current) {
        levelIdxRef.current = newLevelIdx
        setLevelIdx(newLevelIdx)
        audio.levelUp()
      }

      const newElapsed = Math.floor(elapsedRef.current)
      if (newElapsed !== lastElapsedRef.current) {
        lastElapsedRef.current = newElapsed
        setElapsed(newElapsed)
      }

      const cfg = LEVEL_CONFIG[levelIdxRef.current]

      setShake((s) => Math.max(0, s - delta * 4))

      setShots((current) => current
        .map((shot) => ({ ...shot, progress: shot.progress + delta * 3.6, life: shot.life - delta * 2.8 }))
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
      setFloats((current) => current
        .map((f) => ({ ...f, y: f.y - delta * 36, life: f.life - delta * 0.9 }))
        .filter((f) => f.life > 0))

      setEnemies((current) => {
        let next = current.map((enemy) => ({ ...enemy, y: enemy.y + enemy.speed * delta }))
        const escaped = next.filter((enemy) => enemy.y > SHIP_Y - 20)
        if (escaped.length > 0) {
          audio.miss()
          setStreak(0)
          setShake((s) => Math.max(s, 1))
          setLives((value) => {
            const remaining = value - escaped.length
            if (remaining <= 0) {
              audio.gameOver()
              setStatus('gameover')
            }
            return Math.max(0, remaining)
          })
          setTargetId((id) => escaped.some((enemy) => enemy.id === id) ? null : id)
          next = next.filter((enemy) => enemy.y <= SHIP_Y - 20)
        }

        // Spawn
        while (next.length < cfg.minOnScreen) {
          next = [...next, makeEnemy(ids.current.enemy++, levelIdxRef.current, next)]
        }
        if (spawnTimer.current > cfg.spawnInterval && next.length < cfg.maxOnScreen) {
          spawnTimer.current = 0
          next = [...next, makeEnemy(ids.current.enemy++, levelIdxRef.current, next)]
        }

        return next
      })

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frameRef.current)
    }
  }, [audio, status])

  const handleGameKey = useCallback((rawKey: string) => {
    if (!canPlay) return
    if (rawKey === 'Enter' && status !== 'playing') {
      startGame()
      return
    }
    if (rawKey === 'Tab') {
      startGame()
      return
    }
    if (status !== 'playing' || rawKey.length !== 1) return

    const key = rawKey.toLocaleLowerCase('sr-RS')

    setEnemies((current) => {
      const currentTarget = current.find((enemy) => enemy.id === targetId)

      if (currentTarget) {
        const expected = currentTarget.word[currentTarget.typed]?.toLocaleLowerCase('sr-RS')
        if (expected !== key) {
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
        setStreak(0)
        audio.miss()
        return current
      }

      audio.shoot()
      setTargetId(nextTarget.id)
      setShots((value) => [
        ...value,
        { id: ids.current.shot++, fromX: SHIP_X, fromY: SHIP_Y, toX: nextTarget.x, toY: nextTarget.y, progress: 0, life: 1 },
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
        const destroyed = destroyedEnemy
        audio.hit()
        setTargetId(null)
        setStreak((s) => {
          const ns = s + 1
          setBestStreak((b) => Math.max(b, ns))
          return ns
        })
        setWordsDestroyed((wd) => wd + 1)

        const baseScore = destroyed.word.length + levelIdxRef.current * 2
        const streakBonus = streak >= 5 ? Math.floor(baseScore * 0.5) : 0
        const wordScore = baseScore + streakBonus
        const newScore = scoreRef.current + wordScore
        scoreRef.current = newScore
        setScore(newScore)

        setBursts((value) => [
          ...value,
          { id: ids.current.burst++, x: destroyed.x, y: destroyed.y, life: 1 },
        ])
        setFragments((value) => [
          ...value,
          ...Array.from({ length: 12 }, (_, i) => {
            const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.4
            const speed = 60 + Math.random() * 110
            return {
              id: ids.current.fragment++,
              x: destroyed.x,
              y: destroyed.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1,
            }
          }),
        ])
        setFloats((value) => [
          ...value,
          { id: ids.current.float++, x: destroyed.x, y: destroyed.y - 12, text: `+${wordScore}`, life: 1 },
        ])
      } else {
        audio.type()
      }

      return next
    })
  }, [audio, canPlay, startGame, status, targetId, streak])

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Tab') event.preventDefault()
    lastMobileKeyRef.current = { key: event.key, at: performance.now() }
    handleGameKey(event.key)
  }, [handleGameKey])

  const handleMobileInput = useCallback((value: string) => {
    const key = Array.from(value).at(-1)
    if (!key) return
    const lastNative = lastMobileKeyRef.current
    if (lastNative.key === key && performance.now() - lastNative.at < 100) return
    handleGameKey(key)
  }, [handleGameKey])

  // Level-based background accent glow (subtly shifts with level)
  const bgIntensity = Math.min(levelIdx / 9, 1)
  const bgR = 204
  const bgG = Math.round(139 - 139 * bgIntensity * 0.5)
  const bgB = Math.round(37 - 37 * bgIntensity)
  const bgA = (0.12 + bgIntensity * 0.08).toFixed(2)
  const bgGlowColor = `rgba(${bgR}, ${bgG}, ${bgB}, ${bgA})`

  // Screen shake offset
  const shakeX = shake > 0 ? shake * 2 : 0
  const shakeY = shake > 0 ? shake : 0

  return (
    <div className={cn("bg-[var(--background)] px-4 pb-4 pt-3", isMobilePlaying && "fixed inset-0 z-[60] overflow-hidden p-0")}>
      <div className={cn("mx-auto flex max-w-7xl flex-col gap-3", isMobilePlaying && "h-full max-w-none gap-0")}>

        {/* Header */}
        <div className={cn("flex items-center justify-between", isMobilePlaying && "hidden sm:flex")}>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Svemirsko kucanje</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundOn((value) => !value)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
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

        {showNicknameModal && (
          <NicknameModal onNicknameSet={() => { setNicknameReady(true); setShowNicknameModal(false) }} />
        )}

        {/* Main layout */}
        <div className={cn("flex flex-col items-stretch gap-4 lg:flex-row lg:items-start", isMobilePlaying && "h-full gap-0")}>

          {/* Game area */}
          <div className={cn("min-w-0 flex-1", isMobilePlaying && "h-full")}>
          <div
            ref={gameAreaRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onClick={() => window.matchMedia('(max-width: 639px)').matches && mobileInputRef.current?.focus()}
            className={cn("relative w-full overflow-hidden rounded-lg border border-[var(--border)] outline-none", isMobilePlaying && "rounded-none border-0")}
            style={{
              height: isMobilePlaying ? (mobileGameHeight ? `${mobileGameHeight}px` : '100dvh') : 'min(560px, calc(100svh - 10rem))',
              background: `radial-gradient(circle at 50% 18%, ${bgGlowColor}, transparent 28%), linear-gradient(180deg, var(--card), var(--background))`,
              transition: 'background 1.5s ease',
              transform: `translate(${shakeX}px, ${shakeY}px)`,
            }}
          >
            {isMobilePlaying && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  exitMobileGame()
                }}
                className="absolute right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-lg backdrop-blur"
                aria-label="Izađi iz igre"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            {/* Dot grid */}
            <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(circle,rgba(128,128,128,0.35)_1px,transparent_1px)] [background-size:42px_42px]" />
            {/* Bottom fade */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--background)] to-transparent" />

            {/* Level Background Watermark */}
            {status === 'playing' && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]">
                <span className="text-9xl font-black text-[var(--foreground)] uppercase tracking-widest">
                  LVL {levelIdx + 1}
                </span>
              </div>
            )}


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
                      'mx-auto mb-1 rotate-45 rounded-[2px] border h-2.5 w-2.5',
                      locked
                        ? 'border-[var(--accent)] bg-[var(--accent)]'
                        : 'border-[var(--muted-foreground)]/40 bg-[var(--muted)]',
                    )}
                  />
                  <div
                    className={cn(
                      'rounded-md border px-2 py-1 font-mono text-sm bg-[var(--card)]',
                      locked
                        ? 'border-[var(--accent)]'
                        : 'border-[var(--border)]',
                    )}
                  >
                    <span className="text-[var(--accent)]">
                      {enemy.word.slice(0, enemy.typed)}
                    </span>
                    <span className="text-[var(--foreground)]">
                      {enemy.word.slice(enemy.typed)}
                    </span>
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
                  <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-[var(--accent)]" />
                  <span className="absolute left-0 top-[9px] h-1.5 w-1.5 rounded-full bg-[var(--accent)]/60" />
                </div>
              )
            })}

            {bursts.map((burst) => (
              <div
                key={burst.id}
                className="absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--accent)]/60"
                style={{
                  left: `${(burst.x / WIDTH) * 100}%`,
                  top: `${(burst.y / HEIGHT) * 100}%`,
                  transform: `translate(-50%, -50%) scale(${1.4 - burst.life})`,
                  opacity: burst.life * 0.8,
                }}
              />
            ))}

            {fragments.map((fragment) => (
              <div
                key={fragment.id}
                className="absolute h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-[1px] bg-[var(--accent)]"
                style={{
                  left: `${(fragment.x / WIDTH) * 100}%`,
                  top: `${(fragment.y / HEIGHT) * 100}%`,
                  opacity: fragment.life * 0.7,
                }}
              />
            ))}

            {floats.map((f) => (
              <div
                key={f.id}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 font-mono text-sm font-bold text-[var(--accent)]"
                style={{
                  left: `${(f.x / WIDTH) * 100}%`,
                  top: `${(f.y / HEIGHT) * 100}%`,
                  opacity: f.life,
                }}
              >
                {f.text}
              </div>
            ))}

            {/* Ship */}
            <div className="absolute left-1/2 bottom-8 -translate-x-1/2">
              <div className="relative h-12 w-14">
                <div className="absolute left-1/2 top-0 h-10 w-5 -translate-x-1/2 rounded-t-full border border-[var(--accent)] bg-[var(--background)]" />
                <div className="absolute bottom-1 left-0 h-3 w-14 rounded-full bg-[var(--muted)]" />
                <div className="absolute bottom-0 left-1/2 h-3 w-2 -translate-x-1/2 rounded-b-full bg-[var(--accent)]" />
              </div>
            </div>

            {/* Lives bar */}
            {status === 'playing' && (
              <div className="absolute left-3 top-3 flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-2 w-5 rounded-sm border',
                      i < lives
                        ? 'border-[var(--accent)] bg-[var(--accent)]'
                        : 'border-[var(--border)] bg-transparent',
                    )}
                  />
                ))}
              </div>
            )}

            {status !== 'playing' && (
              <div className="absolute inset-0 flex items-center justify-center bg-[var(--background)]/70">
                <div className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 text-center shadow-lg">
                    {status === 'gameover' ? (
                      <>
                        <h2 className="text-lg font-semibold text-[var(--foreground)]">Kraj igre</h2>
                        <p className="mt-1 text-2xl font-bold text-[var(--accent)]">{score.toLocaleString()}</p>
                        <div className="mt-2 flex justify-center gap-4 text-sm text-[var(--muted-foreground)]">
                          <span>Level {currentLevel.label}</span>
                          <span>{elapsed}s</span>
                          <span>{wordsDestroyed} reči</span>
                        </div>
                        {bestStreak >= 3 && (
                          <p className="mt-1 text-sm text-[var(--accent)]">Streak rekord: {bestStreak}</p>
                        )}
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
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          10 nivoa — tempo raste sa skorom.
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
            <div className="pointer-events-none fixed bottom-0 right-0 h-8 w-8 overflow-hidden opacity-0 sm:hidden">
              <input
                ref={mobileInputRef}
                type="text"
                inputMode="text"
                enterKeyHint="done"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder={status === 'playing' ? 'Kucaj slova ovde…' : 'Dodirni ovde, pa pokreni igru'}
                onKeyDown={handleKeyDown}
                onChange={(event) => {
                  handleMobileInput(event.target.value)
                  event.target.value = ''
                }}
                className="h-8 w-8 border-0 bg-transparent p-0 text-base outline-none"
                aria-label="Unos slova za igru"
              />
            </div>
          </div>{/* end game wrapper */}

          {/* Right column: stats + leaderboard */}
          <div className={cn("w-full shrink-0 flex-col gap-3 lg:flex lg:w-56", isMobilePlaying ? "hidden" : "flex")}>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
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
                    {streak >= 5 ? `${streak}×` : streak}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">streak</p>
                </div>
                <div>
                  <p className="font-mono text-2xl font-bold text-[var(--foreground)]">{currentLevel.label}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">level</p>
                </div>
                <div>
                  <p className="font-mono text-2xl font-bold text-[var(--foreground)]">{Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">vreme</p>
                </div>
              </div>

              <div className="mt-3 border-t border-[var(--border)] pt-3">
                <div className="mb-1 flex justify-between text-xs text-[var(--muted-foreground)]">
                  <span>Level {currentLevel.label}</span>
                  {levelIdx < LEVEL_CONFIG.length - 1 && (
                    <span>{(LEVEL_SCORE_THRESHOLDS[levelIdx + 1] - score).toLocaleString()} pts</span>
                  )}
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                    style={{
                      width: levelIdx < LEVEL_CONFIG.length - 1
                        ? `${Math.min(100, ((score - LEVEL_SCORE_THRESHOLDS[levelIdx]) / (LEVEL_SCORE_THRESHOLDS[levelIdx + 1] - LEVEL_SCORE_THRESHOLDS[levelIdx])) * 100)}%`
                        : '100%'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <h3 className="mb-3 flex items-center justify-between text-sm font-semibold text-[var(--foreground)]">
                Top 10 Igrača
                <span className="rounded bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] uppercase text-[var(--accent)]">Global</span>
              </h3>
              <div className="flex flex-col gap-1 text-xs">
                {leaderboard.length === 0 ? (
                  <div className="py-4 text-center text-[var(--muted-foreground)] opacity-70">
                    Trenutno nema rezultata
                  </div>
                ) : (
                  leaderboard.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-[var(--border)] py-1.5 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-5 text-center font-bold', idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-[var(--muted-foreground)]')}>
                          {idx === 0 ? '🏆' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                        </span>
                        {entry.username ? (
                          <Link
                            href={`/profil/${entry.username}`}
                            className="max-w-[72px] truncate font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
                          >
                            {entry.username}
                          </Link>
                        ) : (
                          <span className="max-w-[72px] truncate font-medium text-[var(--muted-foreground)]">Nepoznat</span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-[var(--accent)]">{entry.max_score?.toLocaleString() ?? 0}</span>
                    </div>
                  ))
                )}
                {leaderboard.length > 0 && (!currentUserRank?.rank || currentUserRank.rank > 10) && (
                  <>
                    <div className="my-1 text-center tracking-[0.2em] text-[var(--muted-foreground)] opacity-60">•••</div>
                    <div className="flex items-center justify-between border-t border-[var(--border)] pt-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-center font-bold text-[var(--accent)]">{currentUserRank?.rank ?? '-'}</span>
                        <span className="font-medium text-[var(--accent)]">Ti</span>
                      </div>
                      <span className="font-mono font-bold text-[var(--accent)]">{Math.max(score, currentUserRank?.score ?? 0).toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}














