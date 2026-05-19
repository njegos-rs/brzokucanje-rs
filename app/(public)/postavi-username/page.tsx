'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2 } from 'lucide-react'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const usernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Minimum 3 karaktera')
    .max(20, 'Maksimum 20 karaktera')
    .regex(/^[a-zA-Z0-9_]+$/, 'Samo slova, brojevi i _'),
})
type UsernameInput = z.infer<typeof usernameSchema>

function useUsernameAvailability(username: string) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')

  const check = useCallback(async (value: string) => {
    if (value.length < 3) { setStatus('idle'); return }
    setStatus('checking')
    try {
      const res = await fetch(`/api/username-check?username=${encodeURIComponent(value)}`)
      const data = await res.json()
      setStatus(data.available ? 'available' : 'taken')
    } catch {
      setStatus('idle')
    }
  }, [])

  useEffect(() => {
    if (!username || username.length < 3) { setStatus('idle'); return }
    const timer = setTimeout(() => check(username), 400)
    return () => clearTimeout(timer)
  }, [username, check])

  return status
}

export default function PostaviUsernamePage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  // Redirect ako korisnik nije ulogovan
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/prijava')
    })
  }, [router])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UsernameInput>({ resolver: zodResolver(usernameSchema) })

  const usernameValue = watch('username', '')
  const usernameStatus = useUsernameAvailability(usernameValue)

  const onSubmit = async (data: UsernameInput) => {
    if (usernameStatus === 'taken') return
    setServerError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/prijava'); return }

    const { error } = await supabase
      .from('profiles')
      .update({ username: data.username })
      .eq('id', user.id)

    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        setServerError('Ovo korisničko ime je zauzeto.')
      } else {
        setServerError(error.message)
      }
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-[var(--foreground)]">Izaberi korisničko ime</h1>
        <p className="mb-8 text-sm text-[var(--muted-foreground)]">
          Ovo ime će biti prikazano na rank listi i u zaglavlju sajta.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              Korisničko ime
            </label>
            <div className="relative">
              <input
                {...register('username')}
                type="text"
                autoComplete="username"
                autoFocus
                placeholder=""
                className={cn(
                  'w-full rounded-md border bg-[var(--card)] px-3 py-2.5 pr-9 text-sm text-[var(--foreground)] outline-none transition-colors',
                  'placeholder:text-[var(--muted-foreground)]',
                  'focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30',
                  errors.username ? 'border-[var(--incorrect)]' : 'border-[var(--border)]',
                )}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-[var(--muted-foreground)]" />}
                {usernameStatus === 'available' && <Check className="h-4 w-4 text-[var(--correct)]" />}
                {usernameStatus === 'taken' && <X className="h-4 w-4 text-[var(--incorrect)]" />}
              </div>
            </div>
            {errors.username && (
              <p className="mt-1 text-xs text-[var(--incorrect)]">{errors.username.message}</p>
            )}
            {usernameStatus === 'taken' && !errors.username && (
              <p className="mt-1 text-xs text-[var(--incorrect)]">Ovo korisničko ime je zauzeto.</p>
            )}
            {usernameStatus === 'available' && !errors.username && (
              <p className="mt-1 text-xs text-[var(--correct)]">Korisničko ime je slobodno.</p>
            )}
          </div>

          {serverError && (
            <div className="rounded-md border border-[var(--incorrect)]/30 bg-[var(--incorrect)]/10 px-3 py-2.5">
              <p className="text-sm text-[var(--incorrect)]">{serverError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || usernameStatus === 'taken' || usernameStatus === 'checking'}
            className={cn(
              'w-full rounded-md bg-[var(--accent)] py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition-opacity',
              'hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2',
            )}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Potvrdi
          </button>
        </form>
      </div>
    </div>
  )
}
