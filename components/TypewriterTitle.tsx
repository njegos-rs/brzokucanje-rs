'use client'

import { useEffect, useState } from 'react'

const FULL_TEXT = 'brzokucanje.rs'
const TYPING_SPEED = 80 // ms po slovu

export function TypewriterTitle() {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (displayed.length >= FULL_TEXT.length) {
      setDone(true)
      return
    }
    const t = setTimeout(() => {
      setDisplayed(FULL_TEXT.slice(0, displayed.length + 1))
    }, TYPING_SPEED)
    return () => clearTimeout(t)
  }, [displayed])

  const accent = displayed.slice(0, Math.min(displayed.length, 12))   // 'brzokucanje'
  const rest   = displayed.slice(12)                                    // '.rs'

  return (
    <h1 className="font-mono text-3xl font-bold tracking-tight sm:text-5xl">
      <span className="text-[var(--accent)]">{accent}</span>
      <span className="text-[var(--foreground)]">{rest}</span>
      {/* Treptuci kursor dok traje animacija, nestaje kad završi */}
      {!done && (
        <span className="inline-block w-[3px] h-[0.85em] bg-[var(--accent)] ml-[1px] align-middle animate-pulse rounded-sm" />
      )}
    </h1>
  )
}
