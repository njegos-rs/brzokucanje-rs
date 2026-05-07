import { useCallback, useEffect, useReducer, useRef } from 'react'
import { calcAll, type ScoringResult } from './scoring'
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
}

type EngineAction =
  | { type: 'KEY_PRESS'; key: string; now: number }
  | { type: 'BACKSPACE'; now: number }
  | { type: 'RESET'; text: string; lazyMode: boolean }
  | { type: 'FINISH' }

const LAZY_MAP: Record<string, string[]> = {
  c: ['č', 'ć'],
  s: ['š'],
  z: ['ž'],
}

function isLazyMatch(typed: string, expected: string, lazy: boolean): boolean {
  if (typed === expected) return true
  if (!lazy) return false
  // đ → dj je poseban slučaj (dva karaktera)
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
      }
    }

    case 'KEY_PRESS': {
      if (state.status === 'finished') return state
      if (state.cursor >= state.chars.length) return state

      const isStart = state.status === 'idle'
      const startTime = isStart ? action.now : state.startTime!
      const interval =
        state.lastKeystrokeTime !== null ? action.now - state.lastKeystrokeTime : null

      const expected = state.chars[state.cursor].char
      // Korisnici koji kucaju ćirilicu na latiničnom testu
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

    default:
      return state
  }
}

export interface UseTypingEngineOptions {
  text: string
  lazyMode?: boolean
  onFinish?: (result: ScoringResult, keystrokes: KeystrokeEntry[]) => void
}

export function useTypingEngine({ text, lazyMode = false, onFinish }: UseTypingEngineOptions) {
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
  })

  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish

  // Pokretanje onFinish kada test završi
  useEffect(() => {
    if (state.status !== 'finished') return

    const duration = state.endTime! - state.startTime!
    const correctChars = state.chars.filter((c) => c.state === 'correct').length
    const allChars = state.chars.filter((c) => c.state !== 'upcoming').length

    const result = calcAll({
      correctChars,
      allChars,
      errors: state.errors,
      durationMs: duration,
      intervals: state.intervals,
    })

    onFinishRef.current?.(result, state.keystrokes)
  }, [state.status])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Zabranjujemo paste
      if (e.key === 'Paste' || (e.ctrlKey && e.key === 'v')) {
        e.preventDefault()
        return
      }

      if (e.key === 'Backspace') {
        e.preventDefault()
        dispatch({ type: 'BACKSPACE', now: Date.now() })
        return
      }

      // Ignorišemo modifier tastere
      if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey) return

      dispatch({ type: 'KEY_PRESS', key: e.key, now: Date.now() })
    },
    [],
  )

  const reset = useCallback(() => {
    dispatch({ type: 'RESET', text, lazyMode })
  }, [text, lazyMode])

  // Statistike za live prikaz tokom testa
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

  return {
    chars: state.chars,
    cursor: state.cursor,
    status: state.status,
    errors: state.errors,
    handleKeyDown,
    reset,
    liveStats,
    keystrokes: state.keystrokes,
  }
}
