import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politika privatnosti',
  description: 'Politika privatnosti servisa Brzokucanje.rs — informacije o obradi ličnih podataka u skladu sa GDPR regulativom.',
}

export default function PolitikaPrivatnostiPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold text-[var(--foreground)]">Politika privatnosti</h1>
      <p className="mb-10 text-sm text-[var(--muted-foreground)]">Poslednje ažuriranje: 2026-05-08</p>

      <div className="space-y-10 text-sm leading-relaxed text-[var(--foreground)]">

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">1. Rukovalac podataka</h2>
          <p className="text-[var(--muted-foreground)]">
            Rukovalac ličnih podataka je servis <strong className="text-[var(--foreground)]">Brzokucanje.rs</strong>.
            Za sva pitanja u vezi sa zaštitom privatnosti možete nas kontaktirati na:{' '}
            <a
              href="mailto:privacy@brzokucanje.rs"
              className="text-[var(--accent)] hover:opacity-80 transition-opacity"
            >
              privacy@brzokucanje.rs
            </a>
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">2. Koji podaci se prikupljaju</h2>
          <p className="mb-3 text-[var(--muted-foreground)]">Prikupljamo sledeće kategorije podataka:</p>
          <ul className="space-y-2 text-[var(--muted-foreground)]">
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>
                <strong className="text-[var(--foreground)]">Email adresa</strong> — koristi se za kreiranje naloga,
                autentikaciju i slanje obaveštenja vezanih za nalog.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>
                <strong className="text-[var(--foreground)]">Korisničko ime</strong> — javno prikazano ime na rank listi.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>
                <strong className="text-[var(--foreground)]">IP adresa</strong> — beleži se uz svaki poslati rezultat radi
                anti-cheat zaštite i sprečavanja zloupotrebe.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>
                <strong className="text-[var(--foreground)]">Keystroke log (samo RANK mod)</strong> — anonimizovani
                vremenski podaci o pritiscima tastera (bez sadržaja teksta) beleže se isključivo u takmičarskom modu radi
                detekcije automatizovanih alata i bot-kucanja. Čuvaju se 90 dana, nakon čega se automatski brišu.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>
                <strong className="text-[var(--foreground)]">Podaci o uređaju (User Agent)</strong> — string identifikator
                browser-a i operativnog sistema, koristi se za anti-cheat analizu.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>
                <strong className="text-[var(--foreground)]">Rezultati testova</strong> — WPM, tačnost, trajanje testa,
                kategorija i pismo — čuvaju se dok nalog postoji.
              </span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">3. Svrha obrade podataka</h2>
          <ul className="space-y-2 text-[var(--muted-foreground)]">
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>Pružanje usluge: autentikacija, čuvanje rezultata, prikaz rank liste.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>Anti-cheat zaštita: otkrivanje automatizovanih alata i neregularnih rezultata radi
              očuvanja integriteta takmičenja.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>Poboljšanje servisa: analiza agregatnih (anonimizovanih) podataka o korišćenju.</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">4. Pravni osnov obrade</h2>
          <ul className="space-y-2 text-[var(--muted-foreground)]">
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>
                <strong className="text-[var(--foreground)]">Izvršenje ugovora — čl. 6(1)(b) GDPR:</strong> obrada
                podataka neophodnih za pružanje usluge (email, korisničko ime, rezultati testova).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>
                <strong className="text-[var(--foreground)]">Legitimni interes — čl. 6(1)(f) GDPR:</strong> anti-cheat
                zaštita (IP adresa, keystroke log, user agent). Naš legitimni interes u sprečavanju prevara prevladava
                nad individualnim interesima korisnika, jer se radi o zaštiti fer uslova za sve učesnike.
              </span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">5. Čuvanje podataka</h2>
          <ul className="space-y-2 text-[var(--muted-foreground)]">
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span><strong className="text-[var(--foreground)]">Keystroke log:</strong> 90 dana od datuma testa, zatim se automatski briše.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span><strong className="text-[var(--foreground)]">Ostali podaci naloga</strong> (email, korisničko ime, rezultati): čuvaju se dok nalog postoji.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span><strong className="text-[var(--foreground)]">Po brisanju naloga:</strong> svi lični podaci se trajno brišu u roku od 30 dana.</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">6. Kolačići</h2>
          <p className="text-[var(--muted-foreground)]">
            Koristimo isključivo <strong className="text-[var(--foreground)]">nužne kolačiće</strong> za autentikaciju
            (Supabase auth sesija). Ne koristimo marketinške, analitičke niti kolačiće trećih strana za praćenje.
            Nužni kolačići ne zahtevaju pristanak korisnika jer su neophodni za funkcionisanje usluge.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">7. Vaša prava</h2>
          <p className="mb-3 text-[var(--muted-foreground)]">
            U skladu sa GDPR-om imate sledeća prava:
          </p>
          <ul className="space-y-2 text-[var(--muted-foreground)]">
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span><strong className="text-[var(--foreground)]">Pravo na pristup:</strong> možete zatražiti kopiju svih podataka koje čuvamo o vama.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span><strong className="text-[var(--foreground)]">Pravo na ispravku:</strong> možete zatražiti ispravku netačnih podataka.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span><strong className="text-[var(--foreground)]">Pravo na brisanje (pravo na zaborav):</strong> možete zatražiti brisanje naloga i svih povezanih ličnih podataka slanjem zahteva na{' '}
                <a href="mailto:privacy@brzokucanje.rs" className="text-[var(--accent)] hover:opacity-80 transition-opacity">
                  privacy@brzokucanje.rs
                </a>. Nalog možete obrisati i direktno iz podešavanja profila.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span><strong className="text-[var(--foreground)]">Pravo na prenosivost (izvoz podataka):</strong> na zahtev ćemo vam dostaviti vaše rezultate i podatke naloga u mašinski čitljivom formatu (JSON). Pošaljite zahtev na{' '}
                <a href="mailto:privacy@brzokucanje.rs" className="text-[var(--accent)] hover:opacity-80 transition-opacity">
                  privacy@brzokucanje.rs
                </a>.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span><strong className="text-[var(--foreground)]">Pravo na prigovor:</strong> imate pravo da uložite prigovor na obradu podataka zasnovanu na legitimnom interesu.</span>
            </li>
          </ul>
          <p className="mt-4 text-[var(--muted-foreground)]">
            Na zahteve odgovaramo u roku od 30 dana. Takođe imate pravo da podnesete pritužbu nadležnom nadzornom organu
            (Poverenik za informacije od javnog značaja i zaštitu podataka o ličnosti, Republika Srbija).
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">8. Kontakt</h2>
          <p className="text-[var(--muted-foreground)]">
            Za sva pitanja, zahteve za izvoz ili brisanje podataka:{' '}
            <a
              href="mailto:privacy@brzokucanje.rs"
              className="text-[var(--accent)] hover:opacity-80 transition-opacity"
            >
              privacy@brzokucanje.rs
            </a>
          </p>
        </section>

      </div>
    </div>
  )
}
