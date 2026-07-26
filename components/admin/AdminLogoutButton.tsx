'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onLoggedOut?: () => void
  className?: string
  buttonClassName?: string
}

export function AdminLogoutButton({ onLoggedOut, className, buttonClassName }: Props) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(result?.error ?? 'Odjava nije uspela.')
      }

      onLoggedOut?.()
      router.replace('/admin')
      router.refresh()
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'Odjava nije uspela.')
      setIsLoggingOut(false)
    }
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-[var(--incorrect)] transition-colors hover:bg-[var(--incorrect)]/10 disabled:cursor-not-allowed disabled:opacity-60',
          buttonClassName,
        )}
      >
        {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
        {isLoggingOut ? 'Odjavljujem...' : 'Odjavi se'}
      </button>
      {error && <p className="px-3 text-xs text-[var(--incorrect)]">{error}</p>}
    </div>
  )
}