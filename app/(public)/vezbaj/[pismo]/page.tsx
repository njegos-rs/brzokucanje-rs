import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { VezbaClient } from './VezbaClient'

type Script = 'latinica' | 'cirilica' | 'easy'

const VALID_SCRIPTS: Script[] = ['latinica', 'cirilica', 'easy']

const SCRIPT_META: Record<Script, { title: string; description: string }> = {
  latinica: {
    title: 'Vežbaj kucanje — Latinica',
    description: 'Testiraj brzinu kucanja na srpskoj latinici. Besplatno, bez registracije.',
  },
  cirilica: {
    title: 'Vežbaj kucanje — Ćirilica',
    description: 'Testiraj brzinu kucanja na srpskoj ćirilici. Besplatno, bez registracije.',
  },
  easy: {
    title: 'Vežbaj kucanje — Easy (bez kvačica)',
    description: 'Testiraj brzinu kucanja bez dijakritičkih znakova. Idealno za početnike.',
  },
}

export async function generateStaticParams() {
  return VALID_SCRIPTS.map((pismo) => ({ pismo }))
}

const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://brzokucanje.rs'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pismo: string }>
}): Promise<Metadata> {
  const { pismo } = await params
  if (!VALID_SCRIPTS.includes(pismo as Script)) return {}
  const meta = SCRIPT_META[pismo as Script]
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `${base}/vezbaj/${pismo}`,
      languages: {
        'sr-Latn': `${base}/vezbaj/latinica`,
        'sr-Cyrl': `${base}/vezbaj/cirilica`,
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${base}/vezbaj/${pismo}`,
    },
  }
}

export default async function VezbaPage({
  params,
}: {
  params: Promise<{ pismo: string }>
}) {
  const { pismo } = await params

  if (!VALID_SCRIPTS.includes(pismo as Script)) {
    notFound()
  }

  const script = pismo as Script

  return <VezbaClient pismo={script} />
}
