'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react'

interface TrophyStatCardProps {
  daily: number
  weekly: number
  monthly: number
  yearly: number
}

const TROPHY_SLIDES = [
  {
    key: 'daily',
    label: 'Dnevni',
    accentClassName: 'text-yellow-500',
    description: 'Broj završenih dana u kojima si ostao prvi na dnevnoj rank listi.',
  },
  {
    key: 'weekly',
    label: 'Nedeljni',
    accentClassName: 'text-[var(--foreground)]',
    description: 'Broj završenih nedelja u kojima si ostao prvi na rank listi.',
  },
  {
    key: 'monthly',
    label: 'Mesečni',
    accentClassName: 'text-[var(--foreground)]',
    description: 'Broj završenih meseci u kojima si ostao prvi na rank listi.',
  },
  {
    key: 'yearly',
    label: 'Godišnji',
    accentClassName: 'text-[var(--foreground)]',
    description: 'Broj završenih godina u kojima si ostao prvi na rank listi.',
  },
] as const

export function TrophyStatCard({ daily, weekly, monthly, yearly }: TrophyStatCardProps) {
  const [index, setIndex] = useState(0)
  const values = { daily, weekly, monthly, yearly }
  const current = TROPHY_SLIDES[index]
  const currentValue = values[current.key]

  const goPrev = () => setIndex((prev) => (prev === 0 ? TROPHY_SLIDES.length - 1 : prev - 1))
  const goNext = () => setIndex((prev) => (prev === TROPHY_SLIDES.length - 1 ? 0 : prev + 1))

  return (
    <div
      title={`${current.description} Nedeljni, mesečni i godišnji se dodeljuju tek po isteku kompletnog perioda.`}
      className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center"
    >
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Prethodni pehar"
          className="rounded-full border border-[var(--border)] p-1 text-[var(--muted-foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <Trophy className={`h-5 w-5 ${current.accentClassName}`} />
        <button
          type="button"
          onClick={goNext}
          aria-label="Sledeći pehar"
          className="rounded-full border border-[var(--border)] p-1 text-[var(--muted-foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className={`font-mono text-2xl font-bold ${current.accentClassName}`}>{currentValue}</p>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
        {current.label}
      </p>
      <div className="mt-3 flex justify-center gap-1.5">
        {TROPHY_SLIDES.map((slide, slideIndex) => (
          <span
            key={slide.key}
            className={`h-1.5 rounded-full transition-all ${
              slideIndex === index ? 'w-4 bg-[var(--accent)]' : 'w-1.5 bg-[var(--border)]'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
