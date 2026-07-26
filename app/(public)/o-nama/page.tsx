import type { Metadata } from 'next'
import Link from 'next/link'
import { Award, Keyboard, ShieldCheck, Sparkles, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'O nama | brzokucanje.rs',
  description:
    'brzokucanje.rs je prva srpska platforma za merenje i vežbanje brzine kucanja na ćirilici, latinici i latinici bez kvačica sa anti-cheat sistemom.',
  alternates: {
    canonical: 'https://brzokucanje.rs/o-nama',
  },
}

export default function ONamaPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl text-[var(--foreground)]">
          O platformi <span className="text-[var(--accent)]">brzokucanje.rs</span>
        </h1>
        <p className="mt-4 text-base text-[var(--muted-foreground)] md:text-lg">
          Prva domaća platforma posvećena modernom vežbanju i takmičenju u brzom kucanju na tri srpska pisma.
        </p>
      </div>

      <div className="space-y-12 text-[var(--foreground)]">
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 md:p-8">
          <h2 className="flex items-center gap-3 text-xl font-bold md:text-2xl">
            <Zap className="h-6 w-6 text-[var(--accent)]" /> Naša misija
          </h2>
          <p className="mt-3 leading-relaxed text-[var(--muted-foreground)]">
            Cilj projekta je pružiti domaći alat svetskog ranga (inspirisan platformama poput Monkeytype-a), ali prilagođen specifičnostima našeg jezika i pisma. Bilo da kucate na ćirilici, srpskoj latinici sa kvačicama (č, ć, š, ž, đ) ili standardnoj tastaturi, brzokucanje.rs vam omogućava preciznu analizu i napredak.
          </p>
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <Keyboard className="h-8 w-8 text-[var(--accent)] mb-3" />
            <h3 className="font-bold text-lg">Tri pisma</h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Podrška za ćirilicu, latinicu i lako kucanje (bez kvačica) omogućava vežbanje u svim uslovima.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <ShieldCheck className="h-8 w-8 text-[var(--accent)] mb-3" />
            <h3 className="font-bold text-lg">Anti-cheat validacija</h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Višeslojna serverska verifikacija pritisaka tastera osigurava da su sve pozicije na rang listi 100% poštene.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <Award className="h-8 w-8 text-[var(--accent)] mb-3" />
            <h3 className="font-bold text-lg">Dnevna takmičenja</h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              RANK mod nudi fer takmičenje sa jednim zvaničnim dnevnim pokušajem po kategoriji i pismu.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 md:p-8">
          <h2 className="flex items-center gap-3 text-xl font-bold md:text-2xl">
            <Sparkles className="h-6 w-6 text-[var(--accent)]" /> Kome je namenjeno?
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[var(--muted-foreground)]">
            <li>Programerima i IT profesionalcima koji žele povećati svoju efikasnost svakodnevnog rada.</li>
            <li>Učenicima i studentima koji pišu radove i eseje na srpskom jeziku.</li>
            <li>Svima koji žele poboljšati fokus, tačnost i koordinaciju prstiju.</li>
          </ul>
        </section>

        <div className="text-center pt-6">
          <Link
            href="/vezbaj/latinica"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
          >
            Isprobaj besplatno odmah
          </Link>
        </div>
      </div>
    </div>
  )
}
