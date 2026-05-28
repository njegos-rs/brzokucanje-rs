'use client'

import { useState, Suspense, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'
import { cn } from '@/lib/utils'

const resetSchema = z.object({
  password: z.string().min(8, 'Lozinka mora imati najmanje 8 znakova'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Lozinke se ne poklapaju',
  path: ['confirm'],
})

type ResetInput = z.infer<typeof resetSchema>

function ResetContent() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const sessionRef = useRef<{ access_token: string; refresh_token: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    // Sačuvaj sesiju pa odmah odjavi — token zadržavamo samo za updateUser
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        sessionRef.current = {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }
        supabase.auth.signOut()
      }
    })
  }, [])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetInput>({
    resolver: zodResolver(resetSchema),
  })

  const onSubmit = async (data: ResetInput) => {
    setServerError(null)
    const supabase = createClient()
    if (!sessionRef.current) {
      setServerError('Sesija je istekla. Zatražite novi link za reset.')
      return
    }
    // Ponovo postavi sesiju samo za updateUser
    await supabase.auth.setSession(sessionRef.current)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      setServerError(error.message)
      return
    }
    await supabase.auth.signOut()
    setDone(true)
    setTimeout(() => router.push('/prijava'), 2000)
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-[var(--foreground)]">Nova lozinka</h1>
        <p className="mb-8 text-sm text-[var(--muted-foreground)]">Unesite novu lozinku za vaš nalog.</p>

        {done ? (
          <div className="rounded-md border border-[var(--correct)]/30 bg-[var(--correct)]/10 p-4 text-center">
            <Check className="mx-auto mb-2 h-5 w-5 text-[var(--correct)]" />
            <p className="text-sm text-[var(--foreground)]">Lozinka je uspešno promenjena. Preusmeravamo vas...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Nova lozinka</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Najmanje 8 znakova"
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
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-[var(--incorrect)]">{errors.password.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Potvrdi lozinku</label>
              <div className="relative">
                <input
                  {...register('confirm')}
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Ponovite lozinku"
                  className={cn(
                    'w-full rounded-md border bg-[var(--card)] px-3 py-2.5 pr-10 text-sm text-[var(--foreground)] outline-none transition-colors',
                    'placeholder:text-[var(--muted-foreground)]',
                    'focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30',
                    errors.confirm ? 'border-[var(--incorrect)]' : 'border-[var(--border)]',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirm && <p className="mt-1 text-xs text-[var(--incorrect)]">{errors.confirm.message}</p>}
            </div>

            {serverError && (
              <div className="rounded-md border border-[var(--incorrect)]/30 bg-[var(--incorrect)]/10 px-3 py-2.5">
                <p className="text-sm text-[var(--incorrect)]">{serverError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-[var(--accent)] py-2.5 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Sačuvaj lozinku
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ResetLozinkePage() {
  return (
    <Suspense>
      <ResetContent />
    </Suspense>
  )
}
