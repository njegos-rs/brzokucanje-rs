import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini, removeAccents, sleep } from '@/lib/gemini'

type Script = 'latinica' | 'cirilica' | 'latinica-bez-kvacica'
type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'

const PROMPTS: Record<Script, Record<Difficulty, string>> = {
  latinica: {
    easy: `Generiši 2500 različitih srpskih reči za vežbanje kucanja na tastaturi.

PISMO: Latinica sa dijakritičkim znacima (š đ č ć ž dozvoljeni i poželjni)
TEŽINA: Easy

Pravila:
- Isključivo mala slova
- Bez velikih slova, bez interpunkcije, bez brojeva
- Svakodnevne srpske reči: imenice, glagoli, pridevi, prilozi
- Dužina reči: 3-9 slova
- Bez vlastitih imena, bez stranih reči
- Maksimalna raznolikost, ne ponavljaj reči

Vrati SAMO JSON niz stringova, bez ikakvog teksta pre ili posle.
Primer: ["kuća","voda","drvo","nebo","zemlja"]`,

    medium: `Generiši 2500 različitih srpskih reči za vežbanje kucanja na tastaturi.

PISMO: Latinica sa dijakritičkim znacima (š đ č ć ž dozvoljeni)
TEŽINA: Medium

Pravila:
- Mešavina malih i velikih slova
- Vlastita imena i gradovi velikim početnim slovom (Marko, Beograd, Novi Sad)
- Interpunkcija na kraju nekih reči: tačka, zarez, uzvičnik, upitnik
- Dužina reči: 3-12 slova
- Raznolikost: imenice, glagoli, pridevi, vlastita imena, gradovi
- Ne ponavljaj reči

Vrati SAMO JSON niz stringova, bez ikakvog teksta pre ili posle.
Primer: ["kuća","Marko","voda,","nebo!","Beograd"]`,

    hard: `Generiši 2500 različitih stavki za vežbanje kucanja na tastaturi.

PISMO: Latinica sa dijakritičkim znacima (š đ č ć ž dozvoljeni)
TEŽINA: Hard

Pravila:
- CamelCase reči (SrpskaReč, noviSad, MašinskoUčenje, JavaSkript)
- Mešavina velikih i malih slova unutar reči
- Interpunkcija: dvotačka, zagrade, navodnici, crta, procenat
- Brojevi uz neke stavke (test2, verzija5, reč3)
- Dužina: 3-15 karaktera
- Ne ponavljaj stavke

Vrati SAMO JSON niz stringova, bez ikakvog teksta pre ili posle.
Primer: ["SrpskaReč","noviSad","test2","(zagrade)","47%"]`,

    expert: `Generiši 2500 različitih stavki za ekstremno vežbanje kucanja — haos mod.

PISMO: Latinica sa dijakritičkim znacima
TEŽINA: Expert

Pravila:
- Slobodno mešaj slova, brojeve i specijalne znakove
- Transformacije: Marko→M@rk0, kuća→ku<ća>, voda→v0d@, test→T3$T
- Koristiti znake: @ # $ % & * ( ) < > _ - + = / \\
- Neke stavke mogu biti apsurdne — cilj je pokriti sve tastere
- Dužina: 3-15 karaktera
- Ne ponavljaj stavke

Vrati SAMO JSON niz stringova, bez ikakvog teksta pre ili posle.
Primer: ["M@rk0","v0d@","T3$T","ku<ća>","#srpski"]`,
  },

  cirilica: {
    easy: `Генериши 2500 различитих српских речи за вежбање куцања на тастатури.

ПИСМО: Ћирилица
ТЕЖИНА: Easy

Правила:
- Искључиво мала ћириличка слова
- Без великих слова, без интерпункције, без бројева
- Свакодневне српске речи: именице, глаголи, придеви, прилози
- Дужина речи: 3-9 слова
- Без властитих имена, без страних речи
- Максимална разноликост, не понављај речи

Врати САМО JSON низ стрингова, без икаквог текста пре или после.
Пример: ["кућа","вода","дрво","небо","земља"]`,

    medium: `Генериши 2500 различитих српских речи за вежбање куцања на тастатури.

ПИСМО: Ћирилица
ТЕЖИНА: Medium

Правила:
- Мешавина малих и великих слова
- Властита имена и градови великим почетним словом (Марко, Београд, Нови Сад)
- Интерпункција на крају неких речи: тачка, зарез, узвичник, упитник
- Дужина речи: 3-12 слова
- Не понављај речи

Врати САМО JSON низ стрингова, без икаквог текста пре или после.
Пример: ["кућа","Марко","вода,","небо!","Београд"]`,

    hard: `Генериши 2500 различитих ставки за вежбање куцања на тастатури.

ПИСМО: Ћирилица
ТЕЖИНА: Hard

Правила:
- CamelCase речи ћирилицом (СрпскаРеч, НовиСад, МашинскоУчење)
- Мешавина великих и малих слова унутар речи
- Интерпункција: двотачка, заграде, наводници, цртица, проценат
- Бројеви уз неке ставке (тест2, верзија5)
- Дужина: 3-15 карактера
- Не понављај ставке

Врати САМО JSON низ стрингова, без икаквог текста пре или после.
Пример: ["СрпскаРеч","НовиСад","тест2","(заграде)","47%"]`,

    expert: `Генериши 2500 различитих ставки за екстремно вежбање куцања — хаос мод.

ПИСМО: Ћирилица са специјалним знаковима
ТЕЖИНА: Expert

Правила:
- Слободно мешај ћириличка слова са бројевима и специјалним знаковима
- Трансформације: Марко→М@рк0, кућа→ку<ћа>, вода→в0д@
- Знаци: @ # $ % & * ( ) < > _ - + = / \\
- Дужина: 3-15 карактера
- Не понављај ставке

Врати САМО JSON низ стрингова, без икаквог текста пре или после.
Пример: ["М@рк0","в0д@","Т3$Т","ку<ћа>","#српски"]`,
  },

  'latinica-bez-kvacica': {
    easy: `Generiši 2500 različitih srpskih reči za vežbanje kucanja na tastaturi.

PISMO: Latinica BEZ dijakritika — strogo zabranjena slova: š č ć đ ž
Pravilo zamene: š→s, č→c, ć→c, đ→dj, ž→z
TEŽINA: Easy

Pravila:
- Isključivo mala slova
- Nijedno slovo sa kvačicom
- Svakodnevne srpske reči adaptirane bez kvačica
- Dužina reči: 3-9 slova
- Ne ponavljaj reči

Vrati SAMO JSON niz stringova, bez ikakvog teksta pre ili posle.
Primer: ["kuca","voda","drvo","nebo","zemlja"]`,

    medium: `Generiši 2500 različitih srpskih reči za vežbanje kucanja na tastaturi.

PISMO: Latinica BEZ dijakritika — strogo zabranjena slova: š č ć đ ž
Pravilo zamene: š→s, č→c, ć→c, đ→dj, ž→z
TEŽINA: Medium

Pravila:
- Mešavina malih i velikih slova
- Vlastita imena velikim početnim slovom bez kvačica (Marko, Beograd, Novi Sad)
- Interpunkcija na kraju nekih reči: tačka, zarez, uzvičnik, upitnik
- Dužina reči: 3-12 slova
- Ne ponavljaj reči

Vrati SAMO JSON niz stringova, bez ikakvog teksta pre ili posle.
Primer: ["kuca","Marko","voda,","nebo!","Beograd"]`,

    hard: `Generiši 2500 različitih stavki za vežbanje kucanja na tastaturi.

PISMO: Latinica BEZ dijakritika — strogo zabranjena slova: š č ć đ ž
Pravilo zamene: š→s, č→c, ć→c, đ→dj, ž→z
TEŽINA: Hard

Pravila:
- CamelCase (SrpskaRec, NoviSad, MasinkoUcenje)
- Mešavina velikih i malih slova unutar reči
- Interpunkcija: dvotačka, zagrade, procenat, crta
- Brojevi uz neke stavke
- Dužina: 3-15 karaktera
- Ne ponavljaj stavke

Vrati SAMO JSON niz stringova, bez ikakvog teksta pre ili posle.
Primer: ["SrpskaRec","NoviSad","test2","(zagrade)","47%"]`,

    expert: `Generiši 2500 različitih stavki za ekstremno vežbanje kucanja — haos mod.

PISMO: Latinica BEZ dijakritika — strogo zabranjena slova: š č ć đ ž
TEŽINA: Expert

Pravila:
- Slobodno mešaj slova, brojeve i specijalne znakove
- Transformacije: Marko→M@rk0, voda→v0d@, test→T3$T
- Znaci: @ # $ % & * ( ) < > _ - + = / \\
- Dužina: 3-15 karaktera
- Ne ponavljaj stavke

Vrati SAMO JSON niz stringova, bez ikakvog teksta pre ili posle.
Primer: ["M@rk0","v0d@","T3$T","#srpski","(test)"]`,
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

  // Obriši stare ai_vezba reči
  await supabase.from('text_pool').delete().eq('source', 'ai_vezba').eq('category', 'reci')

  const scripts: Script[] = ['latinica', 'cirilica', 'latinica-bez-kvacica']
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert']
  const results: { combo: string; inserted: number; error?: string }[] = []

  for (const script of scripts) {
    for (const difficulty of difficulties) {
      const combo = `${script}/${difficulty}`
      try {
        const prompt = PROMPTS[script][difficulty]
        const words = await callGemini(prompt)

        const filtered = words
          .map(w => script === 'latinica-bez-kvacica' ? removeAccents(w) : w)
          .filter(w => w.length >= 2 && w.length <= 30)

        const rows = filtered.map(word => ({
          content_lat: script === 'latinica' ? word : '',
          content_cyr: script === 'cirilica' ? word : '',
          content_easy: script === 'latinica-bez-kvacica' ? word : removeAccents(word),
          category: 'reci',
          difficulty,
          script,
          pool_mode: 'vezba',
          source: 'ai_vezba',
          is_active: true,
          word_count: 1,
          char_count: word.length,
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
