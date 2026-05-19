'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Check, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { registerSchema, type RegisterInput } from '@/lib/validators/auth'
import { cn } from '@/lib/utils'

const GOOGLE_ICON = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

function Divider() {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-[var(--border)]" />
      <span className="text-xs text-[var(--muted-foreground)]">ili</span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  )
}

function GoogleButton() {
  const [loading, setLoading] = useState(false)

  const handleGoogle = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={loading}
      className={cn(
        'w-full flex items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)]',
        'hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : GOOGLE_ICON}
      <span>Nastavi sa Google</span>
    </button>
  )
}

function useUsernameAvailability(username: string) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')

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

export default function RegistracijaPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const usernameValue = watch('username', '')
  const usernameStatus = useUsernameAvailability(usernameValue)

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null)
    if (usernameStatus === 'taken') {
      setServerError('Korisničko ime je zauzeto.')
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { username: data.username },
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        setServerError('Ova email adresa je već registrovana.')
      } else {
        setServerError(error.message)
      }
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--correct)]/15">
            <Check className="h-6 w-6 text-[var(--correct)]" />
          </div>
          <h1 className="mb-2 text-xl font-semibold text-[var(--foreground)]">Potvrdi email</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Poslali smo ti link za verifikaciju. Proveri inbox i klikni na link da aktiviraš nalog.
          </p>
          <Link
            href="/prijava"
            className="mt-6 inline-block text-sm text-[var(--accent)] hover:opacity-80 transition-opacity"
          >
            Idi na prijavu →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-[var(--foreground)]">Registracija</h1>
        <p className="mb-8 text-sm text-[var(--muted-foreground)]">
          Već imaš nalog?{' '}
          <Link href="/prijava" className="text-[var(--accent)] hover:opacity-80 transition-opacity">
            Prijavi se
          </Link>
        </p>

        <GoogleButton />

        <Divider />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Username */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              Korisničko ime
            </label>
            <div className="relative">
              <input
                {...register('username')}
                type="text"
                autoComplete="username"
                placeholder="janko123"
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

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="janko@primer.rs"
              className={cn(
                'w-full rounded-md border bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors',
                'placeholder:text-[var(--muted-foreground)]',
                'focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30',
                errors.email ? 'border-[var(--incorrect)]' : 'border-[var(--border)]',
              )}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-[var(--incorrect)]">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              Lozinka
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Najmanje 8 karaktera"
                className={cn(
                  'w-full rounded-md border bg-[var(--card)] px-3 py-2.5 pr-10 text-sm text-[var(--foreground)] outline-none transition-colors',
                  'placeholder:text-[var(--muted-foreground)]',
                  'focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30',
                  errors.password ? 'border-[var(--incorrect)]' : 'border-[var(--border)]',
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                aria-label={showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-[var(--incorrect)]">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              Potvrdi lozinku
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Ponovi lozinku"
                className={cn(
                  'w-full rounded-md border bg-[var(--card)] px-3 py-2.5 pr-10 text-sm text-[var(--foreground)] outline-none transition-colors',
                  'placeholder:text-[var(--muted-foreground)]',
                  'focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30',
                  errors.confirmPassword ? 'border-[var(--incorrect)]' : 'border-[var(--border)]',
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                aria-label={showConfirm ? 'Sakrij lozinku' : 'Prikaži lozinku'}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-[var(--incorrect)]">{errors.confirmPassword.message}</p>
            )}
          </div>

          {serverError && (
            <div className="rounded-md border border-[var(--incorrect)]/30 bg-[var(--incorrect)]/10 px-3 py-2.5">
              <p className="text-sm text-[var(--incorrect)]">{serverError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || usernameStatus === 'taken'}
            className={cn(
              'w-full rounded-md bg-[var(--accent)] py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition-opacity',
              'hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2',
            )}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Registruj se
          </button>
        </form>
      </div>
    </div>
  )
}
