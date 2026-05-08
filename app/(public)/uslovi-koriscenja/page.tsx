import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Uslovi korišćenja',
  description: 'Uslovi korišćenja servisa Brzokucanje.rs — pravila, zabranjena ponašanja i anti-cheat politika.',
}

export default function UsloviKoriscenjaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold text-[var(--foreground)]">Uslovi korišćenja</h1>
      <p className="mb-10 text-sm text-[var(--muted-foreground)]">Poslednje ažuriranje: 2026-05-08</p>

      <div className="space-y-10 text-sm leading-relaxed text-[var(--foreground)]">

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">1. Opis usluge</h2>
          <p className="text-[var(--muted-foreground)]">
            <strong className="text-[var(--foreground)]">Brzokucanje.rs</strong> je besplatni online servis za testiranje
            i vežbanje brzine kucanja na srpskom jeziku — ćiriličnim i latiničnim pismom. Servis omogućava merenje brzine
            (WPM), tačnosti i konzistentnosti kucanja, kao i takmičenje na rang listi.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">2. Prihvatanje uslova</h2>
          <p className="text-[var(--muted-foreground)]">
            Korišćenjem ovog sajta prihvatate ove uslove korišćenja u celosti. Ako se ne slažete sa bilo kojim delom
            uslova, molimo vas da prestanete sa korišćenjem servisa. Kreiranje naloga i/ili korišćenje takmičarskog
            moda (RANK) podrazumeva eksplicitno prihvatanje ovih uslova.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">3. Korisnički nalog</h2>
          <ul className="space-y-2 text-[var(--muted-foreground)]">
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>Vi ste isključivo odgovorni za bezbednost vaše lozinke i sve aktivnosti koje se odvijaju pod vašim nalogom.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>Korisničko ime mora biti prikladno — zabranjeno je korišćenje uvredljivih, diskriminatornih ili obmanjujućih korisničkih imena.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>Kreiranje više naloga radi manipulacije rang listom je zabranjeno.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>Odmah nas obavestite o neovlašćenom pristupu vašem nalogu na{' '}
                <a href="mailto:privacy@brzokucanje.rs" className="text-[var(--accent)] hover:opacity-80 transition-opacity">
                  privacy@brzokucanje.rs
                </a>.
              </span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">4. Zabranjena ponašanja</h2>
          <p className="mb-3 text-[var(--muted-foreground)]">Strogo je zabranjeno:</p>
          <ul className="space-y-2 text-[var(--muted-foreground)]">
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>Korišćenje botova, skripti, makroa ili bilo kojih automatizovanih alata za generisanje rezultata.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>Manipulacija rang listom bilo kojim tehničkim ili netehničkim sredstvima.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>Pokušaj zaobilaženja, onemogućavanja ili ometanja anti-cheat sistema.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>Slanje lažnih podataka putem API poziva ili modifikovanjem klijentskog koda.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>Pokušaj neovlašćenog pristupa tuđim nalozima ili admin panelu.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>Prekomerno opterećivanje servera (DoS/DDoS napadi ili agresivno scraping-ovanje).</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">5. Anti-cheat pravila i sankcije</h2>
          <p className="mb-3 text-[var(--muted-foreground)]">
            Servis koristi automatizovani anti-cheat sistem koji analizira keystroke obrasce i statističke anomalije
            u rezultatima.
          </p>
          <ul className="space-y-2 text-[var(--muted-foreground)]">
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>Rezultati označeni kao sumnjivi podležu manuelnom pregledu od strane administratora.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>U slučaju utvrđene prevare, nalog može biti trajno banovan bez prethodnog upozorenja.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span><strong className="text-[var(--foreground)]">Automatski ban je konačan i nema prava žalbe.</strong> Administratori mogu po nahođenju razmotriti slučaj, ali nisu obavezni.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>Banovanim korisnicima su zabranjeni novi nalozi. Zaobilaženje bana (novi nalog, VPN itd.) predstavlja dodatno kršenje uslova.</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">6. Sadržaj i intelektualna svojina</h2>
          <p className="mb-3 text-[var(--muted-foreground)]">
            Tekstovi koji se koriste u testovima kucanja preuzeti su iz izvora u javnom domenu:
          </p>
          <ul className="space-y-2 text-[var(--muted-foreground)]">
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>Vikiizvor (Wikisource) — dela srpske književnosti autora čija su prava istekla.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">—</span>
              <span>Citati umrlih autora čija dela su u javnom domenu prema srpskom autorskom pravu.</span>
            </li>
          </ul>
          <p className="mt-3 text-[var(--muted-foreground)]">
            Kod, dizajn i svi ostali elementi sajta su vlasništvo Brzokucanje.rs i zaštićeni su autorskim pravom.
            Nije dozvoljena reprodukcija bez pisanog odobrenja.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">7. Odricanje od odgovornosti</h2>
          <p className="text-[var(--muted-foreground)]">
            Servis se pruža &ldquo;as is&rdquo; (kakav jeste), bez ikakvih garancija o neprekidnoj dostupnosti, tačnosti
            rezultata ili pogodnosti za određenu svrhu. Ne odgovaramo za štetu nastalu usled prekida usluge, gubitka
            podataka ili tehničkih grešaka. Pravo na korišćenje servisa može biti ograničeno ili ukinuto u bilo kom
            trenutku.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">8. Izmene uslova</h2>
          <p className="text-[var(--muted-foreground)]">
            Zadržavamo pravo da izmenimo ove uslove u bilo kom trenutku. O svim bitnim izmenama obavestićemo korisnike
            sa registrovanim nalogom najmanje <strong className="text-[var(--foreground)]">7 dana unapred</strong> putem
            email obaveštenja ili istaknutog obaveštenja na sajtu. Nastavak korišćenja servisa nakon stupanja izmena na
            snagu podrazumeva prihvatanje novih uslova.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">9. Merodavno pravo</h2>
          <p className="text-[var(--muted-foreground)]">
            Na ove uslove primenjuje se pravo <strong className="text-[var(--foreground)]">Republike Srbije</strong>.
            Sve sporove koji nastanu iz korišćenja ovog servisa rešavaće nadležni sud u Republici Srbiji.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">10. Kontakt</h2>
          <p className="text-[var(--muted-foreground)]">
            Za sva pitanja u vezi sa ovim uslovima:{' '}
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
