'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const VISITOR_KEY = 'brzokucanje_visitor_id'

function getVisitorId() {
  try {
    const existing = localStorage.getItem(VISITOR_KEY)
    if (existing) return existing

    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

    localStorage.setItem(VISITOR_KEY, id)
    return id
  } catch {
    return null
  }
}

export function VisitTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) return

    const query = searchParams.toString()
    const path = query ? `${pathname}?${query}` : pathname
    const visitorId = getVisitorId()

    const payload = JSON.stringify({
      path,
      visitorId,
      referrer: document.referrer || null,
    })

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon('/api/analytics/visit', blob)
      return
    }

    fetch('/api/analytics/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {})
  }, [pathname, searchParams])

  return null
}
