'use client'

import { type FormEvent, useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function ResetLozinkeForm() {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Lozinka mora imati najmanje 8 karaktera.')
      return
    }

    if (password !== confirmation) {
      setError('Lozinke se ne podudaraju.')
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setIsSubmitting(false)

    if (updateError) {
      setError(
        updateError.message.toLowerCase().includes('session')
          ? 'Link za promenu lozinke je istekao. Zatražite novi link.'
          : 'Lozinka trenutno nije mogla da se promeni. Pokušajte ponovo.',
      )
      return
    }

    setPassword('')
    setConfirmation('')
    setIsComplete(true)
  }

  if (isComplete) {
    return (
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Lozinka je promenjena</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">Nova lozinka je uspešno sačuvana.</p>
        <Link
          href="/prijava"
          className="mt-6 inline-flex rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-90"
        >
          Nastavi na prijavu
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Postavi novu lozinku</h1>
      <p className="mb-6 mt-1 text-sm text-[var(--muted-foreground)]">
        Unesite novu lozinku za administratorski nalog.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Nova lozinka
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 pr-10 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              aria-label={showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Ponovite lozinku
          </label>
          <input
            id="confirm-password"
            type={showPassword ? 'text' : 'password'}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-[var(--incorrect)]/30 bg-[var(--incorrect)]/10 px-3 py-2.5 text-sm text-[var(--incorrect)]"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--accent)] py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Sačuvaj novu lozinku
        </button>
      </form>
    </div>
  )
}
