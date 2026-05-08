'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const consent = localStorage.getItem('cookie_consent')
      if (consent !== '1') {
        setVisible(true)
      }
    } catch {
      // localStorage may be unavailable in some environments
    }
  }, [])

  const handleAccept = () => {
    try {
      localStorage.setItem('cookie_consent', '1')
    } catch {
      // ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Obaveštenje o kolačićima"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-lg"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">
          Ovaj sajt koristi nužne kolačiće za autentikaciju. Nastavkom korišćenja prihvataš našu{' '}
          <Link
            href="/politika-privatnosti"
            className="text-[var(--accent)] hover:opacity-80 transition-opacity underline underline-offset-2"
          >
            Politiku privatnosti
          </Link>
          .
        </p>
        <button
          onClick={handleAccept}
          className="shrink-0 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90 transition-opacity"
        >
          Razumem
        </button>
      </div>
    </div>
  )
}
