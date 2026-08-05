import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, CheckCircle, Target, Zap } from 'lucide-react'
import { TypingHandsDemo } from '@/components/TypingHandsDemo'

export const metadata: Metadata = {
  title: 'Kako kucati brzo na tastaturi — vodič i saveti',
  description:
    'Naučite tehniku slepog kucanja (touch typing) na srpskom jeziku. Povećajte WPM brzinu i tačnost uz praktične savete i svakodnevno vežbanje.',
  alternates: {
    canonical: 'https://www.brzokucanje.rs/kako-kucati-brzo',
  },
}

export default function KakoKucatiBrzoPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Kako pravilno postaviti prste za slepo kucanje?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Leva ruka stoji na tasterima A, S, D, F (kažiprst na F), a desna na J, K, L, Č (kažiprst na J). Palčevi stoje iznad razmaknice. Tasteri F i J imaju male izbočine koje pomažu da pronađete položaj bez gledanja.',
        },
      },
      {
        '@type': 'Question',
        name: 'Da li je tačnost važnija od brzine kucanja?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Da, tačnost je uvek prioritet. Brzina dolazi prirodno kroz mišićnu memoriju. Greške usporavaju ritam jer morate brisati slova, što smanjuje ukupan WPM skor.',
        },
      },
      {
        '@type': 'Question',
        name: 'Koliko minuta dnevno treba vežbati kucanje?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Kratka svakodnevna vežba pomaže da održite fokus i izgradite mišićnu memoriju. Konzistentnost je važnija od povremenih dugih sesija.',
        },
      },
      {
        '@type': 'Question',
        name: 'Kako vežbati kucanje srpskih dijakritika (Č, Ć, Š, Ž, Đ)?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Vežbanjem na brzokucanje.rs gradite mišićnu memoriju za specifične srpske reči i dijakritičke tastere. Platforma podržava ćirilicu, latinicu i latinicu bez kvačica.',
        },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl text-[var(--foreground)]">
          Kako kucati brzo na tastaturi? <span className="text-[var(--accent)]">Vodič za slepo kucanje</span>
        </h1>
        <p className="mt-4 text-base text-[var(--muted-foreground)] md:text-lg">
          Kompletan vodič za povećanje brzine (WPM) i tačnosti kucanja bez gledanja u tastaturu na srpskom pismu.
        </p>
      </div>

      <div className="mb-12">
        <TypingHandsDemo />
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
            Počnite sa 10 do 15 minuta fokusirane vežbe dnevno. Kratka, redovna sesija olakšava održavanje pravilne tehnike i ritma bez zamora. Pratite napredak na profilu i povećajte tempo tek kada zadržite visoku tačnost.
          </p>
        </section>

        <section aria-labelledby="brzi-saveti">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Tips &amp; tricks</p>
            <h2 id="brzi-saveti" className="mt-2 text-2xl font-bold md:text-3xl">Male navike koje prave veliku razliku</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['01', 'Gledaj tekst, ne tastaturu', 'Ako pogre\u0161i\u0161, uspori. Ne spu\u0161taj pogled: tako mozak br\u017ee gradi mapu tastera.'],
              ['02', 'Dr\u017ei ritam', 'Stabilan tempo je vredniji od kratkog naleta brzine. Zamisli metronom dok kuca\u0161.'],
              ['03', 'Ciljaj 97% ta\u010dnosti', 'Pove\u0107avaj brzinu tek kada isti tempo mo\u017ee\u0161 da odr\u017ei\u0161 bez \u010destih ispravki.'],
              ['04', 'Odmori \u0161ake', 'Ramena neka budu opu\u0161tena, zglobovi ravni, a pritisak na tastere lagan.'],
              ['05', 'Ve\u017ebaj problemati\u010dna slova', 'Napravi kratke sesije za \u010d, \u0107, \u0161, \u017e i \u0111 umesto da stalno ponavlja\u0161 lake re\u010di.'],
              ['06', 'Zavr\u0161i dok si fokusiran', 'Deset do petnaest kvalitetnih minuta je bolji trening od duge sesije pune gre\u0161aka.'],
            ].map(([number, heading, copy]) => (
              <article key={number} className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/60 hover:shadow-lg">
                <span className="font-mono text-xs font-bold text-[var(--accent)]">{number}</span>
                <h3 className="mt-3 font-bold text-[var(--foreground)]">{heading}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">{copy}</p>
              </article>
            ))}
          </div>
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
    </>
  )
}
