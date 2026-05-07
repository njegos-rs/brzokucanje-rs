'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { CharEntry } from '@/lib/typing/engine'

interface Props {
  chars: CharEntry[]
  cursor: number
  status: 'idle' | 'running' | 'finished'
  onKeyDown: (e: KeyboardEvent) => void
}

export function TypingArea({ chars, cursor, status, onKeyDown }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Fokus na container kad se klikne bilo gde na stranici
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.focus()
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    el.addEventListener('keydown', onKeyDown)
    return () => el.removeEventListener('keydown', onKeyDown)
  }, [onKeyDown])

  // Auto-scroll da cursor ostane vidljiv
  useEffect(() => {
    const cursorEl = document.getElementById('typing-cursor')
    cursorEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [cursor])

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={cn(
        'typing-area relative outline-none rounded-lg p-6',
        'font-mono text-xl leading-relaxed tracking-wide',
        'focus:ring-2 focus:ring-[var(--accent)]/30',
        status === 'finished' && 'opacity-60 pointer-events-none',
      )}
      aria-label="Oblast za kucanje"
      aria-live="off"
      onPaste={(e) => e.preventDefault()}
    >
      <div className="flex flex-wrap gap-[1px]">
        {chars.map((entry, i) => (
          <span
            key={i}
            id={i === cursor ? 'typing-cursor' : undefined}
            className={cn(
              'relative',
              entry.state === 'correct' && 'text-[var(--correct)]',
              entry.state === 'incorrect' && 'text-[var(--incorrect)] bg-[var(--incorrect)]/10',
              entry.state === 'upcoming' && 'text-[var(--upcoming)]',
              // Cursor caret
              i === cursor && [
                'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px]',
                'before:bg-[var(--cursor)] before:animate-pulse',
              ],
            )}
          >
            {entry.char === ' ' ? ' ' : entry.char}
          </span>
        ))}
      </div>

      {status === 'idle' && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-[var(--background)]/80 pointer-events-none">
          <p className="text-sm text-[var(--muted-foreground)]">
            Klikni ovde ili počni da kucaš...
          </p>
        </div>
      )}
    </div>
  )
}
