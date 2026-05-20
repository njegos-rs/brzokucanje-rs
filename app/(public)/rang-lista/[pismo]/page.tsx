import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { LeaderboardContent } from './LeaderboardContent'
import { getSiteUrl } from '@/lib/site'

type PublicScript = 'latinica' | 'cirilica' | 'easy' | 'latinica-bez-kvacica'
type Script = 'latinica' | 'cirilica' | 'latinica-bez-kvacica'
const VALID_SCRIPTS: PublicScript[] = ['latinica', 'cirilica', 'easy', 'latinica-bez-kvacica']

const SCRIPT_LABELS: Record<PublicScript, string> = {
  latinica: 'Latinica',
  cirilica: 'Ćirilica',
  easy: 'Latinica bez kvačica',
  'latinica-bez-kvacica': 'Latinica bez kvačica',
}

function normalizeScript(pismo: string): Script | null {
  if (pismo === 'latinica' || pismo === 'cirilica' || pismo === 'latinica-bez-kvacica') return pismo
  if (pismo === 'easy') return 'latinica-bez-kvacica'
  return null
}

interface Props {
  params: Promise<{ pismo: string }>
}

const base = getSiteUrl()

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pismo } = await params
  if (!VALID_SCRIPTS.includes(pismo as PublicScript)) return {}
  const script = pismo as PublicScript
  const canonicalScript = script === 'latinica-bez-kvacica' ? 'easy' : script
  return {
    title: `Rank lista — ${SCRIPT_LABELS[script]}`,
    description: `Dnevna, nedeljna i mesečna rank lista za ${SCRIPT_LABELS[script]} na brzokucanje.rs`,
    alternates: {
      canonical: `${base}/rang-lista/${canonicalScript}`,
      languages: {
        'sr-Latn': `${base}/rang-lista/latinica`,
        'sr-Cyrl': `${base}/rang-lista/cirilica`,
      },
    },
    openGraph: {
      title: `Rank lista — ${SCRIPT_LABELS[script]} | Brzokucanje.rs`,
      description: `Top rezultati u RANK modu za ${SCRIPT_LABELS[script]}.`,
      url: `${base}/rang-lista/${canonicalScript}`,
    },
  }
}

export default async function RangListaPage({ params }: Props) {
  const { pismo } = await params
  const script = normalizeScript(pismo)
  if (!script) notFound()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-[var(--foreground)]">Rank lista</h1>
      <p className="mb-8 text-sm text-[var(--muted-foreground)]">Top rezultati u RANK modu.</p>
      <Suspense fallback={<div className="py-16 text-center text-sm text-[var(--muted-foreground)]">Učitavam…</div>}>
        <LeaderboardContent script={script} />
      </Suspense>
    </div>
  )
}
