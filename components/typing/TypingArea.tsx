'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
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

export function TypingArea({ chars, cursor, status, onKeyDown, timeLeft, mode, spaceBlocked }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cursorSpanRef = useRef<HTMLSpanElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [currentWord, setCurrentWord] = useState('')
  const [offsetY, setOffsetY] = useState(0)
  const onKeyDownRef = useRef(onKeyDown)
  onKeyDownRef.current = onKeyDown
  const spaceBlockedRef = useRef(spaceBlocked)
  spaceBlockedRef.current = spaceBlocked

  useEffect(() => {
    inputRef.current?.focus()
    setCurrentWord('')
    setOffsetY(0)
  }, [status, chars])

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Tab') return
      if (e.ctrlKey || e.altKey || e.metaKey) return
      if (e.key === 'Backspace') {
        setCurrentWord((v) => v.slice(0, -1))
      } else if (e.key.length === 1) {
        if (spaceBlockedRef.current) {
          setShaking(false)
          requestAnimationFrame(() => setShaking(true))
        } else if (e.key === ' ') {
          setCurrentWord('')
        } else {
          setCurrentWord((v) => v + e.key)
        }
      }
      onKeyDownRef.current(e)
    }
    el.addEventListener('keydown', handler)
    return () => el.removeEventListener('keydown', handler)
  }, [])

  // Pomeri unutrašnji div tako da aktivan red uvek bude drugi od vrha
  useEffect(() => {
    const cursorEl = cursorSpanRef.current
    const innerEl = innerRef.current
    if (!cursorEl || !innerEl) return

    const cursorTop = cursorEl.offsetTop
    // Ciljana pozicija: kursor treba biti na drugom redu (1 * LINE_HEIGHT_PX od vrha)
    const targetOffset = cursorTop - LINE_HEIGHT_PX
    setOffsetY(Math.max(0, targetOffset))
  }, [cursor])

  const handleDisplayClick = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  const progressPct = chars.length > 0 ? Math.round((cursor / chars.length) * 100) : 0
  const wordGroups = groupIntoWords(chars)

  return (
    <div className="flex flex-col gap-3 w-full">

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
          'relative cursor-text overflow-hidden',
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
            className="font-mono text-2xl md:text-3xl tracking-wide flex flex-wrap transition-transform duration-150"
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
      {mode !== 'vreme' && chars.length > 0 && (
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
        onChange={() => {}}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPaste={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onAnimationEnd={() => setShaking(false)}
        disabled={status === 'finished'}
        className="sr-only"
        placeholder=""
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label="Oblast za unos"
      />
    </div>
  )
}
