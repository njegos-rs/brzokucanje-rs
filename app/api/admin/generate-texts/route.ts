import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini, removeAccents, sleep } from '@/lib/gemini'

type Script = 'latinica' | 'cirilica' | 'latinica-bez-kvacica'
type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'

const PROMPTS: Record<Script, Record<Difficulty, string>> = {
  latinica: {
    easy: `Generiši 50 različitih srpskih tekstova za vežbanje kucanja na tastaturi.

PISMO: Latinica sa dijakritičkim znacima (š đ č ć ž dozvoljeni i poželjni)
TEŽINA: Easy

Pravila za sadržaj:
- Isključivo mala slova, bez ijednog velikog slova
- Bez interpunkcije osim tačke na samom kraju teksta
- Smislene rečenice, prirodan srpski jezik
- Teme: svakodnevni život, priroda, porodica, hrana, prijatelji, godišnja doba
- Maksimalna raznolikost tema između tekstova

Pravila za dužinu:
- Svaki tekst između 30 i 80 reči
- Dužina potpuno nasumična — ne smeju svi biti slične dužine

Vrati SAMO JSON niz stringova, bez ikakvog teksta pre ili posle.
Primer: ["tekst jedan...", "tekst dva..."]`,

    medium: `Generiši 50 različitih srpskih tekstova za vežbanje kucanja na tastaturi.

PISMO: Latinica sa dijakritičkim znacima (š đ č ć ž obavezni)
TEŽINA: Medium

Pravila za sadržaj:
- Normalna srpska gramatika i pravopis
- Velika slova na početku rečenice i za vlastita imena
- Interpunkcija: tačka, zarez, uzvičnik, upitnik, tačka-zarez
- Teme: kultura, sport, nauka, putovanja, istorija Srbije, tehnologija
- Maksimalna raznolikost tema između tekstova

Pravila za dužinu:
- Svaki tekst između 30 i 80 reči
- Dužina potpuno nasumična

Vrati SAMO JSON niz stringova, bez ikakvog teksta pre ili posle.
Primer: ["Tekst jedan...", "Tekst dva..."]`,

    hard: `Generiši 50 različitih srpskih tekstova za vežbanje kucanja na tastaturi.

PISMO: Latinica sa dijakritičkim znacima
TEŽINA: Hard

Pravila za sadržaj:
- Kompleksna interpunkcija: dvotačke, zagrade, navodnici „ovako", crte —, tačka-zarezi
- CamelCase termini prirodno utkani u tekst (JavaSkript, MašinskoUčenje, VeštačkaInteligencija)
- Brojevi integrisani u tekst ("3 od 5 učenika", "povećanje od 47%", "verzija 2.0")
- Teme: tehnologija, ekonomija, medicina, nauka, pravo
- Maksimalna raznolikost tema između tekstova

Pravila za dužinu:
- Svaki tekst između 30 i 80 reči
- Dužina potpuno nasumična

Vrati SAMO JSON niz stringova, bez ikakvog teksta pre ili posle.
Primer: ["Tekst jedan...", "Tekst dva..."]`,

    expert: `Generiši 50 različitih srpskih tekstova za ekstremno vežbanje kucanja.

PISMO: Latinica sa dijakritičkim znacima
TEŽINA: Expert

Pravila za sadržaj:
- Normalan srpski tekst sa umetnutim haos elementima
- Vlastita imena transformisana: "M@rko", "N0viS@d"
- Email adrese (korisnik@domen.rs), URL-ovi (www.primer.rs/stranica)
- Isečci koda ili izrazi (x = (a + b) * 2; ili if (x > 0) {)
- Svi specijalni znaci prirodno utkani: @ # $ % & * ( ) < > _ - + = / \\
- Maksimalna raznolikost između tekstova

Pravila za dužinu:
- Svaki tekst između 30 i 80 reči
- Dužina potpuno nasumična

Vrati SAMO JSON niz stringova, bez ikakvog teksta pre ili posle.
Primer: ["Tekst jedan...", "Tekst dva..."]`,
  },

  cirilica: {
    easy: `Генериши 50 различитих српских текстова за вежбање куцања на тастатури.

ПИСМО: Ћирилица — искључиво ћириличко писмо, без латинице
ТЕЖИНА: Easy

Правила за садржај:
- Искључиво мала слова, без иједног великог слова
- Без интерпункције осим тачке на самом крају текста
- Смислене реченице, природан српски језик
- Теме: свакодневни живот, природа, породица, храна, пријатељи, годишња доба
- Максимална разноликост тема између текстова

Правила за дужину:
- Сваки текст између 30 и 80 речи
- Дужина потпуно насумична

Врати САМО JSON низ стрингова, без икаквог текста пре или после.
Пример: ["текст један...", "текст два..."]`,

    medium: `Генериши 50 различитих српских текстова за вежбање куцања на тастатури.

ПИСМО: Ћирилица — искључиво ћириличко писмо
ТЕЖИНА: Medium

Правила за садржај:
- Нормална српска граматика и правопис
- Велика слова на почетку реченице и за властита имена
- Интерпункција: тачка, зарез, узвичник, упитник, тачка-зарез
- Теме: култура, спорт, наука, путовања, историја Србије
- Максимална разноликост тема

Правила за дужину:
- Сваки текст између 30 и 80 речи
- Дужина потпуно насумична

Врати САМО JSON низ стрингова, без икаквог текста пре или после.
Пример: ["Текст један...", "Текст два..."]`,

    hard: `Генериши 50 различитих српских текстова за вежбање куцања на тастатури.

ПИСМО: Ћирилица — искључиво ћириличко писмо
ТЕЖИНА: Hard

Правила за садржај:
- Комплексна интерпункција: двотачке, заграде, наводници „овако", цртице —
- CamelCase термини ћирилицом (СрпскаРеч, МашинскоУчење, ВештачкаИнтелигенција)
- Бројеви интегрисани у текст ("3 од 5 ученика", "повећање од 47%")
- Теме: технологија, економија, медицина, наука
- Максимална разноликост тема

Правила за дужину:
- Сваки текст између 30 и 80 речи
- Дужина потпуно насумична

Врати САМО JSON низ стрингова, без икаквог текста пре или после.
Пример: ["Текст један...", "Текст два..."]`,

    expert: `Генериши 50 различитих српских текстова за екстремно вежбање куцања.

ПИСМО: Ћирилица са специјалним знаковима
ТЕЖИНА: Expert

Правила за садржај:
- Нормалан српски текст са уметнутим хаос елементима
- Властита имена трансформисана: "М@рк0", "Н0виС@д"
- Имејл адресе, URL-ови, исечци кода
- Специјални знаци: @ # $ % & * ( ) < > _ - + = / \\
- Максимална разноликост

Правила за дужину:
- Сваки текст између 30 и 80 речи
- Дужина потпуно насумична

Врати САМО JSON низ стрингова, без икаквог текста пре или после.
Пример: ["Текст један...", "Текст два..."]`,
  },

  'latinica-bez-kvacica': {
    easy: `Generiši 50 različitih srpskih tekstova za vežbanje kucanja na tastaturi.

PISMO: Latinica BEZ dijakritika — strogo zabranjena slova: š č ć đ ž
Pravilo: š→s, č→c, ć→c, đ→dj, ž→z
TEŽINA: Easy

Pravila za sadržaj:
- Isključivo mala slova, bez ijednog velikog slova
- Bez interpunkcije osim tačke na kraju
- Smislene rečenice bez ijednog dijakritičkog znaka
- Teme: svakodnevni život, priroda, porodica, hrana
- Maksimalna raznolikost tema

Pravila za dužinu:
- Svaki tekst između 30 i 80 reči
- Dužina potpuno nasumična

Vrati SAMO JSON niz stringova, bez ikakvog teksta pre ili posle.
Primer: ["tekst jedan...", "tekst dva..."]`,

    medium: `Generiši 50 različitih srpskih tekstova za vežbanje kucanja na tastaturi.

PISMO: Latinica BEZ dijakritika — strogo zabranjena slova: š č ć đ ž
Pravilo: š→s, č→c, ć→c, đ→dj, ž→z
TEŽINA: Medium

Pravila za sadržaj:
- Normalna gramatika, velika slova na početku rečenice
- Interpunkcija: tačka, zarez, uzvičnik, upitnik
- Vlastita imena bez kvačica (Marko, Beograd)
- Teme: kultura, sport, nauka, putovanja
- Maksimalna raznolikost tema

Pravila za dužinu:
- Svaki tekst između 30 i 80 reči
- Dužina potpuno nasumična

Vrati SAMO JSON niz stringova, bez ikakvog teksta pre ili posle.
Primer: ["Tekst jedan...", "Tekst dva..."]`,

    hard: `Generiši 50 različitih srpskih tekstova za vežbanje kucanja na tastaturi.

PISMO: Latinica BEZ dijakritika — strogo zabranjena slova: š č ć đ ž
Pravilo: š→s, č→c, ć→c, đ→dj, ž→z
TEŽINA: Hard

Pravila za sadržaj:
- Kompleksna interpunkcija: dvotačke, zagrade, procenat, crta
- CamelCase termini bez kvačica (SrpskaRec, NoviSad, MasinkoUcenje)
- Brojevi integrisani u tekst
- Teme: tehnologija, ekonomija, nauka
- Maksimalna raznolikost tema

Pravila za dužinu:
- Svaki tekst između 30 i 80 reči
- Dužina potpuno nasumična

Vrati SAMO JSON niz stringova, bez ikakvog teksta pre ili posle.
Primer: ["Tekst jedan...", "Tekst dva..."]`,

    expert: `Generiši 50 različitih srpskih tekstova za ekstremno vežbanje kucanja.

PISMO: Latinica BEZ dijakritika — strogo zabranjena slova: š č ć đ ž
TEŽINA: Expert

Pravila za sadržaj:
- Normalan tekst sa haos elementima
- Transformacije: Marko→M@rk0, voda→v0d@
- Email adrese, URL-ovi, isečci koda
- Znaci: @ # $ % & * ( ) < > _ - + = / \\
- Maksimalna raznolikost

Pravila za dužinu:
- Svaki tekst između 30 i 80 reči
- Dužina potpuno nasumična

Vrati SAMO JSON niz stringova, bez ikakvog teksta pre ili posle.
Primer: ["Tekst jedan...", "Tekst dva..."]`,
  },
}

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers.get('authorization') === `Bearer ${cronSecret}`) return true
  return false
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!isAuthorized(req)) {
    if (!user) return NextResponse.json({ error: 'Nemate pristup' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Nemate pristup' }, { status: 403 })
  }

  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: 'GEMINI_API_KEY nije konfigurisan' }, { status: 500 })

  // Obriši stare ai_vezba tekstove
  await supabase.from('text_pool').delete().eq('source', 'ai_vezba').eq('category', 'tekst')

  const scripts: Script[] = ['latinica', 'cirilica', 'latinica-bez-kvacica']
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert']
  const results: { combo: string; inserted: number; error?: string }[] = []

  for (const script of scripts) {
    for (const difficulty of difficulties) {
      const combo = `${script}/${difficulty}`
      try {
        const prompt = PROMPTS[script][difficulty]
        const texts = await callGemini(prompt)

        const filtered = texts
          .map(t => script === 'latinica-bez-kvacica' ? removeAccents(t) : t)
          .filter(t => {
            const wordCount = t.trim().split(/\s+/).length
            return wordCount >= 20 && wordCount <= 150
          })

        const rows = filtered.map(tekst => ({
          content_lat: script === 'latinica' ? tekst : '',
          content_cyr: script === 'cirilica' ? tekst : '',
          content_easy: script === 'latinica-bez-kvacica' ? tekst : removeAccents(tekst),
          category: 'tekst',
          difficulty,
          script,
          pool_mode: 'vezba',
          source: 'ai_vezba',
          is_active: true,
          word_count: tekst.trim().split(/\s+/).length,
          char_count: tekst.length,
        }))

        if (rows.length > 0) {
          const { error } = await supabase.from('text_pool').insert(rows)
          if (error) throw new Error(error.message)
        }

        results.push({ combo, inserted: rows.length })
      } catch (err) {
        results.push({ combo, inserted: 0, error: err instanceof Error ? err.message : String(err) })
      }

      await sleep(4000) // 15 RPM = 1 poziv / 4s
    }
  }

  const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0)
  return NextResponse.json({ success: true, totalInserted, results })
}
