import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { LeaderboardContent } from './LeaderboardContent'
import { getSiteUrl } from '@/lib/site'

type Script = 'latinica' | 'cirilica' | 'latinica-bez-kvacica'
const VALID_SCRIPTS: Script[] = ['latinica', 'cirilica', 'latinica-bez-kvacica']

const SCRIPT_LABELS: Record<Script, string> = {
  latinica: 'Latinica',
  cirilica: 'Ćirilica',
  'latinica-bez-kvacica': 'Latinica bez kvačica',
}

interface Props {
  params: Promise<{ pismo: string }>
}

const base = getSiteUrl()

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pismo } = await params
  if (!VALID_SCRIPTS.includes(pismo as Script)) return {}
  const script = pismo as Script
  return {
    title: `Rank lista — ${SCRIPT_LABELS[script]}`,
    description: `Dnevna, nedeljna i mesečna rank lista za ${SCRIPT_LABELS[script]} na brzokucanje.rs`,
    alternates: {
      canonical: `${base}/rang-lista/${pismo}`,
      languages: {
        'sr-Latn': `${base}/rang-lista/latinica`,
        'sr-Cyrl': `${base}/rang-lista/cirilica`,
      },
    },
    openGraph: {
      title: `Rank lista — ${SCRIPT_LABELS[script]} | Brzokucanje.rs`,
      description: `Top rezultati u RANK modu za ${SCRIPT_LABELS[script]}.`,
      url: `${base}/rang-lista/${pismo}`,
    },
  }
}

export default async function RangListaPage({ params }: Props) {
  const { pismo } = await params
  if (!VALID_SCRIPTS.includes(pismo as Script)) notFound()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-[var(--foreground)]">Rank lista</h1>
      <p className="mb-8 text-sm text-[var(--muted-foreground)]">Top rezultati u RANK modu.</p>
      <Suspense fallback={<div className="py-16 text-center text-sm text-[var(--muted-foreground)]">Učitavam…</div>}>
        <LeaderboardContent script={pismo as Script} />
      </Suspense>
    </div>
  )
}
