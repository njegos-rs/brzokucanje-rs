'use client'

import { useEffect, useRef, useCallback, useState, type FormEvent } from 'react'
import { cn } from '@/lib/utils'
import type { CharEntry } from '@/lib/typing/engine'

interface Props {
  chars: CharEntry[]
  cursor: number
  status: 'idle' | 'running' | 'finished'
  onKeyDown: (e: KeyboardEvent) => void
  timeLeft?: number
  mode?: 'reci' | 'vreme' | 'tekst'
  spaceBlocked?: boolean
  mobileImmersive?: boolean
  onFocusChange?: (focused: boolean) => void
}

interface WordGroup {
  chars: { entry: CharEntry; globalIndex: number }[]
  isSpace: boolean
}

function groupIntoWords(chars: CharEntry[]): WordGroup[] {
  const groups: WordGroup[] = []
  let current: WordGroup | null = null

  for (let i = 0; i < chars.length; i++) {
    const entry = chars[i]
    if (entry.char === ' ') {
      if (current) { groups.push(current); current = null }
      groups.push({ chars: [{ entry, globalIndex: i }], isSpace: true })
    } else {
      if (!current) current = { chars: [], isSpace: false }
      current.chars.push({ entry, globalIndex: i })
    }
  }
  if (current) groups.push(current)
  return groups
}

// Visina jednog reda u px — mora da odgovara line-height u CSS-u
const LINE_HEIGHT_PX = 52

export function TypingArea({ chars, cursor, status, onKeyDown, timeLeft, mode, spaceBlocked, mobileImmersive = false, onFocusChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cursorSpanRef = useRef<HTMLSpanElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const processKeyRef = useRef<(event: KeyboardEvent) => void>(() => {})
  const lastNativeKeyRef = useRef({ key: '', at: 0 })
  const [focused, setFocused] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [currentWord, setCurrentWord] = useState('')
  const [offsetY, setOffsetY] = useState(0)
  const onKeyDownRef = useRef(onKeyDown)
  const spaceBlockedRef = useRef(spaceBlocked)

  useEffect(() => {
    onKeyDownRef.current = onKeyDown
    spaceBlockedRef.current = spaceBlocked
  }, [onKeyDown, spaceBlocked])

  useEffect(() => {
    if (!window.matchMedia('(max-width: 639px)').matches) inputRef.current?.focus()
    setCurrentWord('')
    if (status === 'idle') setOffsetY(0)
  }, [status])

  const processKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Tab') return
    if (event.ctrlKey || event.altKey || event.metaKey) return
    if (event.key === 'Backspace') {
      setCurrentWord((value) => value.slice(0, -1))
    } else if (event.key.length === 1) {
      if (spaceBlockedRef.current) {
        setShaking(false)
        requestAnimationFrame(() => setShaking(true))
      } else if (event.key === ' ') {
        setCurrentWord('')
      } else {
        setCurrentWord((value) => value + event.key)
      }
    }
    onKeyDownRef.current(event)
  }, [])

  useEffect(() => {
    processKeyRef.current = processKey
  }, [processKey])

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    const handler = (event: KeyboardEvent) => {
      lastNativeKeyRef.current = { key: event.key, at: performance.now() }
      processKeyRef.current(event)
    }
    el.addEventListener('keydown', handler)
    return () => el.removeEventListener('keydown', handler)
  }, [])

  const handleBeforeInput = useCallback((event: FormEvent<HTMLInputElement>) => {
    const nativeEvent = event.nativeEvent as InputEvent
    const keys = nativeEvent.inputType === 'deleteContentBackward'
      ? ['Backspace']
      : Array.from(nativeEvent.data ?? '')
    if (keys.length === 0) return

    event.preventDefault()
    const lastNative = lastNativeKeyRef.current
    if (keys.length === 1 && lastNative.key === keys[0] && performance.now() - lastNative.at < 100) return

    keys.forEach((key) => processKeyRef.current(new KeyboardEvent('keydown', { key, bubbles: true })))
  }, [])

  const handleInputFocus = useCallback(() => {
    setFocused(true)
    onFocusChange?.(true)
    if (window.matchMedia('(max-width: 639px)').matches) {
      window.setTimeout(() => containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150)
    }
  }, [onFocusChange])

  useEffect(() => {
    if (!focused || !window.visualViewport) return
    const viewport = window.visualViewport
    const keepTypingAreaVisible = () => {
      window.setTimeout(() => containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60)
    }
    viewport.addEventListener('resize', keepTypingAreaVisible)
    return () => viewport.removeEventListener('resize', keepTypingAreaVisible)
  }, [focused])
  // Aktivni red uvek ostaje u sredini trorednog prikaza.
  // getBoundingClientRect je pouzdaniji od offsetTop za karaktere u flex-wrap redovima.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const cursorEl = cursorSpanRef.current
      const innerEl = innerRef.current
      if (!cursorEl || !innerEl) return

      const innerTop = innerEl.getBoundingClientRect().top
      const cursorTop = cursorEl.getBoundingClientRect().top
      const row = Math.max(0, Math.round((cursorTop - innerTop) / LINE_HEIGHT_PX))
      const targetOffset = Math.max(0, (row - 1) * LINE_HEIGHT_PX)
      setOffsetY((previous) => previous === targetOffset ? previous : targetOffset)
    })

    return () => cancelAnimationFrame(frame)
  }, [cursor, chars.length])

  const handleDisplayClick = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  const progressPct = chars.length > 0 ? Math.round((cursor / chars.length) * 100) : 0
  const wordGroups = groupIntoWords(chars)

  return (
    <div ref={containerRef} className={cn("flex w-full scroll-mb-28 flex-col gap-3", mobileImmersive && "h-[100dvh] items-center justify-center gap-5")}>

      {/* Timer */}
      {mode === 'vreme' && timeLeft !== undefined && (
        <div className="flex items-baseline gap-1">
          <span className={cn(
            'font-mono text-4xl font-bold tabular-nums leading-none transition-colors',
            timeLeft <= 5 ? 'text-[var(--incorrect)]' : 'text-[var(--accent)]'
          )}>
            {timeLeft}
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">s</span>
        </div>
      )}

      {/* Typing display — tačno 3 reda, srednji je aktivan */}
      <div
        onClick={handleDisplayClick}
        className={cn(
          'typing-area relative cursor-text overflow-hidden',
          shaking && 'shake',
          status === 'finished' && 'opacity-30 pointer-events-none',
        )}
        style={{ height: `${LINE_HEIGHT_PX * 3}px` }}
        aria-hidden="true"
      >
        {chars.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-[var(--muted-foreground)]/40">
            Učitavam...
          </div>
        ) : (
          <div
            ref={innerRef}
            className={cn("flex flex-wrap font-mono text-2xl tracking-wide transition-transform duration-150 md:text-3xl", mobileImmersive && "w-full justify-center text-center")}
            style={{
              lineHeight: `${LINE_HEIGHT_PX}px`,
              transform: `translateY(-${offsetY}px)`,
            }}
          >
            {wordGroups.map((group, gi) => {
              if (group.isSpace) {
                const { entry, globalIndex } = group.chars[0]
                const isCursor = globalIndex === cursor
                return (
                  <span
                    key={`sp-${gi}`}
                    ref={isCursor ? cursorSpanRef : undefined}
                    className={cn(
                      'relative whitespace-pre',
                      entry.state === 'correct' && 'text-[var(--correct)]',
                      entry.state === 'incorrect' && 'text-[var(--incorrect)]',
                      entry.state === 'upcoming' && 'text-[var(--upcoming)]',
                      isCursor && focused && 'after:absolute after:left-0 after:top-[4px] after:bottom-[4px] after:w-[2px] after:bg-[var(--accent)] after:animate-pulse after:rounded-full',
                      isCursor && !focused && 'after:absolute after:left-0 after:top-[4px] after:bottom-[4px] after:w-[2px] after:bg-[var(--muted-foreground)]/30 after:rounded-full',
                    )}
                  >{' '}</span>
                )
              }
              return (
                <span key={`w-${gi}`} className="inline-block">
                  {group.chars.map(({ entry, globalIndex }) => {
                    const isCursor = globalIndex === cursor
                    return (
                      <span
                        key={globalIndex}
                        ref={isCursor ? cursorSpanRef : undefined}
                        className={cn(
                          'relative',
                          entry.state === 'correct' && 'text-[var(--correct)]',
                          entry.state === 'incorrect' && 'text-[var(--incorrect)]',
                          entry.state === 'upcoming' && 'text-[var(--upcoming)]',
                          isCursor && focused && 'after:absolute after:left-0 after:top-[4px] after:bottom-[4px] after:w-[2px] after:bg-[var(--accent)] after:animate-pulse after:rounded-full',
                          isCursor && !focused && 'after:absolute after:left-0 after:top-[4px] after:bottom-[4px] after:w-[2px] after:bg-[var(--muted-foreground)]/30 after:rounded-full',
                        )}
                      >{entry.char}</span>
                    )
                  })}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {!mobileImmersive && mode !== 'vreme' && chars.length > 0 && (
        <div className="h-[2px] w-full rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-100',
              progressPct >= 100 ? 'bg-[var(--correct)]' : 'bg-[var(--accent)]'
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* Nevidljivi input — samo za hvatanje tastature */}
      <input
        ref={inputRef}
        type="text"
        value={currentWord}
        onChange={(event) => setCurrentWord(event.target.value)}
        onBeforeInput={handleBeforeInput}
        onFocus={handleInputFocus}
        onBlur={() => { setFocused(false); onFocusChange?.(false) }}
        onPaste={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onAnimationEnd={() => setShaking(false)}
        disabled={status === 'finished'}
        className={cn("font-mono text-base outline-none", mobileImmersive ? "fixed bottom-0 right-0 h-8 w-8 border-0 bg-transparent p-0 opacity-0" : "h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-[var(--foreground)] placeholder:font-sans placeholder:text-sm placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 sm:absolute sm:-left-[9999px] sm:h-px sm:w-px sm:opacity-0")}
        inputMode="text"
        enterKeyHint={mobileImmersive ? "done" : "next"}
        placeholder="Dodirni ovde i kucaj…"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label="Oblast za unos"
      />
    </div>
  )
}

