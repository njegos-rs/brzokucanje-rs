'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { nicknameSchema, type NicknameInput } from '@/lib/validators/auth'
import {
  NICKNAME_FORMAT_MESSAGE,
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  isValidNickname,
  normalizeNickname,
} from '@/lib/validators/nickname'

type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'profanity' | 'invalid' | 'error'

function useNicknameAvailability(nickname: string) {
  const [status, setStatus] = useState<AvailabilityStatus>('idle')

  const check = useCallback(async (value: string) => {
    const normalized = normalizeNickname(value)
    if (normalized.length < NICKNAME_MIN_LENGTH) { setStatus('idle'); return }
    if (!isValidNickname(normalized)) {
      setStatus('invalid')
      return
    }

    setStatus('checking')
    try {
      const res = await fetch(`/api/username-check?username=${encodeURIComponent(normalized)}`)
      const data = await res.json()
      if (res.ok && data.available === true) setStatus('available')
      else if (data.reason === 'taken') setStatus('taken')
      else if (data.reason === 'profanity') setStatus('profanity')
      else if (data.reason === 'invalid') setStatus('invalid')
      else setStatus('error')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (!nickname || normalizeNickname(nickname).length < NICKNAME_MIN_LENGTH) { setStatus('idle'); return }
    const timer = setTimeout(() => check(nickname), 250)
    return () => clearTimeout(timer)
  }, [nickname, check])

  return status
}

interface Props {
  onNicknameSet: (nickname: string) => void
}

export function NicknameModal({ onNicknameSet }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Animacija: pojavi se sa delay-em
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300)
    return () => clearTimeout(timer)
  }, [])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NicknameInput>({ resolver: zodResolver(nicknameSchema) })

  const nicknameValue = watch('nickname', '')
  const nicknameStatus = useNicknameAvailability(nicknameValue)

  const onSubmit = async (data: NicknameInput) => {
    if (nicknameStatus === 'taken' || nicknameStatus === 'profanity') return
    setServerError(null)

    try {
      const nickname = normalizeNickname(data.nickname)
      const res = await fetch('/api/nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
      })

      const result = await res.json()

      if (!res.ok) {
        setServerError(result.error ?? 'Greška pri čuvanju imena.')
        return
      }

      onNicknameSet(result.nickname ?? nickname)
    } catch {
      setServerError('Mrežna greška. Pokušaj ponovo.')
    }
  }

  const statusMessage = (() => {
    switch (nicknameStatus) {
      case 'available':
        return <p className="mt-1.5 text-xs font-medium text-[var(--correct)]">Dostupno</p>
      case 'taken':
        return <p className="mt-1.5 text-xs font-medium text-[var(--incorrect)]">Zauzeto</p>
      case 'profanity':
        return <p className="mt-1.5 text-xs font-medium text-[var(--incorrect)]">Nedozvoljeno ime</p>
      case 'invalid':
        return <p className="mt-1.5 text-xs text-[var(--incorrect)]">Neispravan format imena</p>
      case 'error':
        return <p className='mt-1.5 text-xs text-[var(--muted-foreground)]'>Provera trenutno nije dostupna</p>
      case 'checking':
        return (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
            <Loader2 className="h-3 w-3 animate-spin" />
            Proveravam...
          </p>
        )
      default:
        return null
    }
  })()

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div
        className={cn(
          'w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-2xl transition-all duration-300',
          isVisible ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95',
        )}
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/15">
            <span className="text-xl">⌨️</span>
          </div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            Izaberi svoje ime
          </h2>
          <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
            Unesi nadimak koji će se prikazivati na rank listi i profilu.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              IME:
            </label>
            <div className="relative">
              <input
                {...register('nickname')}
                type="text"
                autoComplete="off"
                autoFocus
                maxLength={NICKNAME_MAX_LENGTH}
                placeholder="Tvoje ime"
                className={cn(
                  'w-full rounded-md border bg-[var(--background)] px-3 py-2.5 pr-9 text-sm text-[var(--foreground)] outline-none transition-colors',
                  'placeholder:text-[var(--muted-foreground)]',
                  'focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30',
                  errors.nickname ? 'border-[var(--incorrect)]' : 'border-[var(--border)]',
                )}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {nicknameStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-[var(--muted-foreground)]" />}
                {nicknameStatus === 'available' && <Check className="h-4 w-4 text-[var(--correct)]" />}
                {(nicknameStatus === 'taken' || nicknameStatus === 'profanity') && <X className="h-4 w-4 text-[var(--incorrect)]" />}
              </div>
            </div>
            {errors.nickname && (
              <p className="mt-1.5 text-xs text-[var(--incorrect)]">{errors.nickname.message}</p>
            )}
            {!errors.nickname && statusMessage}
            {!errors.nickname && nicknameStatus === 'idle' && (
              <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
                3–15 karaktera. {NICKNAME_FORMAT_MESSAGE}.
              </p>
            )}
          </div>

          {serverError && (
            <div className="rounded-md border border-[var(--incorrect)]/30 bg-[var(--incorrect)]/10 px-3 py-2.5">
              <p className="text-sm text-[var(--incorrect)]">{serverError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || nicknameStatus === 'taken' || nicknameStatus === 'profanity' || nicknameStatus === 'checking'}
            className={cn(
              'w-full rounded-md bg-[var(--accent)] py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition-opacity',
              'hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2',
            )}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Potvrdi
          </button>

          <p className="text-center text-xs text-[var(--muted-foreground)]">
            Ovo ime je trajno i ne može se promeniti.
          </p>
        </form>
      </div>
    </div>
  )
}

