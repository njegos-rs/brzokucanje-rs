import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, CheckCircle, Target, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Kako kucati brzo na tastaturi | Vodič i saveti | brzokucanje.rs',
  description:
    'Naučite tehniku slepog kucanja (touch typing) na srpskom jeziku. Povećajte WPM brzinu i tačnost uz praktične savete i svakodnevno vežbanje.',
  alternates: {
    canonical: 'https://brzokucanje.rs/kako-kucati-brzo',
  },
}

export default function KakoKucatiBrzoPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl text-[var(--foreground)]">
          Kako kucati brzo na tastaturi? <span className="text-[var(--accent)]">Vodič za slepo kucanje</span>
        </h1>
        <p className="mt-4 text-base text-[var(--muted-foreground)] md:text-lg">
          Kompletan vodič za povećanje brzine (WPM) i tačnosti kucanja bez gledanja u tastaturu na srpskom pismu.
        </p>
      </div>

      <div className="space-y-10 text-[var(--foreground)]">
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 md:p-8">
          <h2 className="flex items-center gap-3 text-xl font-bold md:text-2xl">
            <Target className="h-6 w-6 text-[var(--accent)]" /> 1. Pravilan početni položaj prstiju (Početni red)
          </h2>
          <p className="mt-3 leading-relaxed text-[var(--muted-foreground)]">
            Ključ uspeha u slepom kucanju jeste vraćanje prstiju na osnovni red (home row). Na svakoj tastaturi tasteri <strong>F</strong> i <strong>J</strong> imaju male izbočine:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[var(--muted-foreground)]">
            <li><strong>Leva ruka:</strong> Prsti stoje na tasterima <strong>A, S, D, F</strong> (kažiprst na F).</li>
            <li><strong>Desna ruka:</strong> Prsti stoje na tasterima <strong>J, K, L, Č</strong> (ili <strong>J, K, L, ;</strong> na US rasporedu).</li>
            <li><strong>Palčevi:</strong> Stoje iznad razmaknice (spacebar).</li>
          </ul>
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 md:p-8">
          <h2 className="flex items-center gap-3 text-xl font-bold md:text-2xl">
            <CheckCircle className="h-6 w-6 text-[var(--accent)]" /> 2. Zlatna pravila za napredak
          </h2>
          <div className="mt-4 space-y-4 text-[var(--muted-foreground)]">
            <div className="border-l-4 border-[var(--accent)] pl-4">
              <h3 className="font-bold text-[var(--foreground)]">Tačnost je važnija od brzine</h3>
              <p className="text-sm mt-1">Brzina dolazi prirodno kroz mišićnu memoriju. Kada pravite greške, usporavate ritam jer morate brisati slova.</p>
            </div>
            <div className="border-l-4 border-[var(--accent)] pl-4">
              <h3 className="font-bold text-[var(--foreground)]">Ne gledajte u tastaturu</h3>
              <p className="text-sm mt-1">Neka vaš mozak poveže osećaj dodira tastera sa slovom na ekranu. U početku će ići sporije, ali dugoročno donosi drastičan skok brzine.</p>
            </div>
            <div className="border-l-4 border-[var(--accent)] pl-4">
              <h3 className="font-bold text-[var(--foreground)]">Održavajte ravnomeran ritam (Consistency)</h3>
              <p className="text-sm mt-1">Kucajte stabilnim tempom. Ravnomeran ritam smanjuje zamor i povećava ukupan WPM skor.</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 md:p-8">
          <h2 className="flex items-center gap-3 text-xl font-bold md:text-2xl">
            <Zap className="h-6 w-6 text-[var(--accent)]" /> 3. Vežbanje srpskih dijakritika (Č, Ć, Š, Ž, Đ) i Ćirilice
          </h2>
          <p className="mt-3 leading-relaxed text-[var(--muted-foreground)]">
            Poseban izazov za domaće kucače jeste korišćenje dijakritika na QWERTZ/QWERTY rasporedima i prebacivanje na ćiriličku tastaturu. Vežbanjem na <strong>brzokucanje.rs</strong> gradite mišićnu memoriju za specifične srpske reči i dijakritičke tastere bez gubitka brzine.
          </p>
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 md:p-8">
          <h2 className="flex items-center gap-3 text-xl font-bold md:text-2xl">
            <BookOpen className="h-6 w-6 text-[var(--accent)]" /> 4. Dnevna rutina od 10 minuta
          </h2>
          <p className="mt-3 leading-relaxed text-[var(--muted-foreground)]">
            Istraživanja pokazuju da je 10 minuta svakodnevnog fokusiranog kucanja efikasnije od jednog sata vežbanja vikendom. Započnite dan jednom brzom sesijom na našem sajtu i pratite svoj dnevni napredak na profilu!
          </p>
        </section>

        <div className="text-center pt-6">
          <Link
            href="/vezbaj/latinica"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
          >
            Započni vežbanje odmah
          </Link>
        </div>
      </div>
    </div>
  )
}
