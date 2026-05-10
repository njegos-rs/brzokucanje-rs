'use client'

import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { calcAll, calcWpm, calcRawWpm, type ScoringResult } from './scoring'
import { cyrToLat } from '@/lib/transliteration'

export type CharState = 'upcoming' | 'correct' | 'incorrect' | 'extra'

export interface CharEntry {
  char: string
  state: CharState
}

export type EngineStatus = 'idle' | 'running' | 'finished'

export interface KeystrokeEntry {
  ts: number
  char: string
  action: 'correct' | 'incorrect' | 'backspace'
}

export type TestMode = 'reci' | 'vreme' | 'tekst'
export type TestLevel = 'easy' | 'medium' | 'hard' | 'expert'
export type TimerDuration = 15 | 30 | 60

interface EngineState {
  status: EngineStatus
  chars: CharEntry[]
  cursor: number
  startTime: number | null
  endTime: number | null
  intervals: number[]
  lastKeystrokeTime: number | null
  keystrokes: KeystrokeEntry[]
  errors: number
  lazyMode: boolean
  strictMode: boolean
}

type EngineAction =
  | { type: 'KEY_PRESS'; key: string; now: number }
  | { type: 'BACKSPACE'; now: number }
  | { type: 'RESET'; text: string; lazyMode: boolean; strictMode: boolean }
  | { type: 'FINISH' }
  | { type: 'APPEND_TEXT'; text: string }
  | { type: 'SET_STRICT_MODE'; strictMode: boolean }

const LAZY_MAP: Record<string, string[]> = {
  c: ['č', 'ć'],
  s: ['š'],
  z: ['ž'],
}

function isLazyMatch(typed: string, expected: string, lazy: boolean): boolean {
  if (typed === expected) return true
  if (!lazy) return false
  const accepted = LAZY_MAP[typed.toLowerCase()]
  return accepted?.includes(expected.toLowerCase()) ?? false
}

function buildChars(text: string): CharEntry[] {
  return text.split('').map((char) => ({ char, state: 'upcoming' as CharState }))
}

function engineReducer(state: EngineState, action: EngineAction): EngineState {
  switch (action.type) {
    case 'RESET': {
      return {
        status: 'idle',
        chars: buildChars(action.text),
        cursor: 0,
        startTime: null,
        endTime: null,
        intervals: [],
        lastKeystrokeTime: null,
        keystrokes: [],
        errors: 0,
        lazyMode: action.lazyMode,
        strictMode: action.strictMode,
      }
    }

    case 'APPEND_TEXT': {
      const newChars = [...state.chars, ...buildChars(action.text)]
      return { ...state, chars: newChars }
    }

    case 'KEY_PRESS': {
      if (state.status === 'finished') return state
      if (state.cursor >= state.chars.length) return state

      // U strict modu: ako ima bilo kakva greška iza kursora, blokira sve osim backspace
      if (state.strictMode) {
        const hasAnyError = state.chars.slice(0, state.cursor).some(c => c.state === 'incorrect')
        if (hasAnyError) return state
      }

      const isStart = state.status === 'idle'
      const startTime = isStart ? action.now : state.startTime!
      const interval =
        state.lastKeystrokeTime !== null ? action.now - state.lastKeystrokeTime : null

      const expected = state.chars[state.cursor].char
      const typedKey = cyrToLat(action.key)
      const correct = isLazyMatch(typedKey, expected, state.lazyMode)

      const newChars = [...state.chars]
      newChars[state.cursor] = {
        ...newChars[state.cursor],
        state: correct ? 'correct' : 'incorrect',
      }

      const newCursor = state.cursor + 1
      const finished = newCursor >= state.chars.length

      const keystroke: KeystrokeEntry = {
        ts: action.now - startTime,
        char: action.key,
        action: correct ? 'correct' : 'incorrect',
      }

      return {
        ...state,
        status: finished ? 'finished' : 'running',
        chars: newChars,
        cursor: newCursor,
        startTime,
        endTime: finished ? action.now : null,
        intervals: interval !== null ? [...state.intervals, interval] : state.intervals,
        lastKeystrokeTime: action.now,
        keystrokes: [...state.keystrokes, keystroke],
        errors: correct ? state.errors : state.errors + 1,
      }
    }

    case 'BACKSPACE': {
      if (state.status === 'finished') return state
      if (state.cursor === 0) return state

      const newCursor = state.cursor - 1
      const newChars = [...state.chars]
      newChars[newCursor] = { ...newChars[newCursor], state: 'upcoming' }

      const keystroke: KeystrokeEntry = {
        ts: state.startTime !== null ? action.now - state.startTime : 0,
        char: 'Backspace',
        action: 'backspace',
      }

      return {
        ...state,
        chars: newChars,
        cursor: newCursor,
        keystrokes: [...state.keystrokes, keystroke],
      }
    }

    case 'FINISH': {
      return { ...state, status: 'finished', endTime: Date.now() }
    }

    case 'SET_STRICT_MODE': {
      return { ...state, strictMode: action.strictMode }
    }

    default:
      return state
  }
}

export interface WpmSnapshot {
  second: number
  wpm: number
  rawWpm: number
  errors: number
}

export interface UseTypingEngineOptions {
  text: string
  lazyMode?: boolean
  strictMode?: boolean
  mode?: TestMode
  timerDuration?: TimerDuration
  onFinish?: (result: ScoringResult, keystrokes: KeystrokeEntry[], wpmHistory: WpmSnapshot[]) => void
  onNeedMoreText?: () => string | null
}

export function useTypingEngine({
  text,
  lazyMode = false,
  strictMode = false,
  mode = 'reci',
  timerDuration = 30,
  onFinish,
  onNeedMoreText,
}: UseTypingEngineOptions) {
  const [state, dispatch] = useReducer(engineReducer, {
    status: 'idle',
    chars: buildChars(text),
    cursor: 0,
    startTime: null,
    endTime: null,
    intervals: [],
    lastKeystrokeTime: null,
    keystrokes: [],
    errors: 0,
    lazyMode,
    strictMode,
  })

  const [timeLeft, setTimeLeft] = useState<number>(timerDuration)

  // Kad se promeni text (novi test), resetuj engine
  useEffect(() => {
    if (!text) return
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setTimeLeft(timerDuration)
    dispatch({ type: 'RESET', text, lazyMode: false, strictMode })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  // Kad se promeni strictMode prop (toggle 100% tačnost), ažuriraj engine state
  useEffect(() => {
    dispatch({ type: 'SET_STRICT_MODE', strictMode })
  }, [strictMode])

  // Kad se promeni timerDuration (korisnik klikne 15s/30s/60s), resetuj brojač
  useEffect(() => {
    setTimeLeft(timerDuration)
  }, [timerDuration])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish
  const onNeedMoreTextRef = useRef(onNeedMoreText)
  onNeedMoreTextRef.current = onNeedMoreText

  // Timer za vreme mod
  useEffect(() => {
    if (mode !== 'vreme') return
    if (state.status === 'running' && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!)
            timerRef.current = null
            dispatch({ type: 'FINISH' })
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [state.status, mode])

  // Dopuni tekst kada se kursor približi kraju (za vreme mod)
  useEffect(() => {
    if (mode !== 'vreme') return
    if (state.status !== 'running') return
    const remaining = state.chars.length - state.cursor
    if (remaining < 50) {
      const more = onNeedMoreTextRef.current?.()
      if (more) dispatch({ type: 'APPEND_TEXT', text: ' ' + more })
    }
  }, [state.cursor, mode, state.status, state.chars.length])

  // Pokretanje onFinish
  useEffect(() => {
    if (state.status !== 'finished') return

    const duration = (state.endTime ?? Date.now()) - (state.startTime ?? Date.now())
    const correctChars = state.chars.filter((c) => c.state === 'correct').length
    const allChars = state.chars.filter((c) => c.state !== 'upcoming').length

    const result = calcAll({
      correctChars,
      allChars,
      errors: state.errors,
      durationMs: duration,
      intervals: state.intervals,
    })

    const wpmHistory: WpmSnapshot[] = []
    const durationSec = Math.ceil(duration / 1000)
    for (let sec = 1; sec <= durationSec; sec++) {
      const windowMs = sec * 1000
      const ks = state.keystrokes.filter((k) => k.ts <= windowMs && k.action !== 'backspace')
      const correctInWindow = ks.filter((k) => k.action === 'correct').length
      const errorsInWindow = ks.filter((k) => k.action === 'incorrect').length
      const wpmAtSec = calcWpm(correctInWindow, windowMs)
      const rawAtSec = calcRawWpm(ks.length, windowMs)
      wpmHistory.push({ second: sec, wpm: Math.round(wpmAtSec), rawWpm: Math.round(rawAtSec), errors: errorsInWindow })
    }

    onFinishRef.current?.(result, state.keystrokes, wpmHistory)
  }, [state.status])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Paste' || (e.ctrlKey && e.key === 'v')) {
        e.preventDefault()
        return
      }

      if (e.key === 'Backspace') {
        e.preventDefault()
        dispatch({ type: 'BACKSPACE', now: Date.now() })
        return
      }

      if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey) return

      dispatch({ type: 'KEY_PRESS', key: e.key, now: Date.now() })
    },
    [],
  )

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setTimeLeft(timerDuration)
    dispatch({ type: 'RESET', text, lazyMode, strictMode })
  }, [text, lazyMode, strictMode, timerDuration])

  const liveStats = useCallback((): Partial<ScoringResult> => {
    if (!state.startTime || state.cursor === 0) return {}
    const now = state.endTime ?? Date.now()
    const duration = now - state.startTime
    const correctChars = state.chars.filter((c) => c.state === 'correct').length
    const allChars = state.chars.filter((c) => c.state !== 'upcoming').length
    return calcAll({
      correctChars,
      allChars,
      errors: state.errors,
      durationMs: duration,
      intervals: state.intervals,
    })
  }, [state])

  // Blokiran unos u strict modu — ima greška bilo gdje iza kursora
  const spaceBlocked = state.strictMode && state.chars.slice(0, state.cursor).some(c => c.state === 'incorrect')

  return {
    chars: state.chars,
    cursor: state.cursor,
    status: state.status,
    errors: state.errors,
    timeLeft,
    spaceBlocked,
    handleKeyDown,
    reset,
    liveStats,
    keystrokes: state.keystrokes,
  }
}
