// Generates all word pool JSON files via Gemini API
// Run: node scripts/generate-wordlists.mjs

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORDS_DIR = path.join(__dirname, '..', 'lib', 'words')

const API_KEYS = [
  // Add Gemini API keys here
]
let keyIndex = 0

async function callGemini(prompt, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const apiKey = API_KEYS[keyIndex % API_KEYS.length]
    keyIndex++
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.9, maxOutputTokens: 8192 },
          }),
        }
      )
      if (!res.ok) {
        const err = await res.text()
        if (res.status === 429) {
          console.log('  Rate limit, sleeping 10s...')
          await sleep(10000)
          attempt--
          continue
        }
        throw new Error(`API ${res.status}: ${err.slice(0, 200)}`)
      }
      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      const match = text.match(/\[[\s\S]*\]/)
      if (!match) throw new Error('No JSON array in response: ' + text.slice(0, 200))
      return JSON.parse(match[0])
    } catch (e) {
      if (attempt === retries) throw e
      console.log(`  Retry ${attempt + 1}/${retries}: ${e.message}`)
      await sleep(5000)
    }
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function writeJson(filename, data) {
  const filepath = path.join(WORDS_DIR, filename)
  fs.writeFileSync(filepath, JSON.stringify(data), 'utf8')
  console.log(`  ✓ Written ${filename}: ${data.length} entries`)
}

function dedup(arr) {
  return [...new Set(arr.map(w => w.trim()).filter(w => w.length >= 2))]
}

// ─── PROMPTS ──────────────────────────────────────────────────────────────────

const PROMPTS = {

  // base.json — srpske reči bez kvačica, nominativ, svakodnevne
  base_batch: (n) => `Generiši tačno ${n} srpskih reči za vežbanje kucanja na tastaturi.

PRAVILA — veoma stroga:
- Isključivo mala slova
- BEZ dijakritika: nijedno od slova š č ć đ ž — zameni: š→s, č→c, ć→c, đ→dj, ž→z
- Samo osnovna forma reči (nominativ jednine): "kuca" NE "kucama", "covek" NE "coveka"
- Samo srpske svakodnevne reči — NE strane reči (ne "selling", ne "typewriter", ne "calais")
- Samo reči između 3 i 9 slova
- NE vlastita imena, NE gradovi, NE prezimena
- Teme: telo, dom, hrana, biljke, zivotinje, posao, skola, sport, priroda, vreme, boje, oblici, emocije, predmeti

Vrati SAMO JSON niz stringova, bez ikakvog teksta pre ili posle.
Primer: ["kuca","voda","drvo","hleb","sunce","reka","dete","brat","sestra","zima"]`,

  // kvacice.json — srpske reči SA kvačicama
  kvacice_batch: (n) => `Generiši tačno ${n} srpskih reči za vežbanje kucanja na tastaturi.

PRAVILA — veoma stroga:
- Isključivo mala slova
- OBAVEZNO koristiti dijakritike: š č ć đ ž — veoma poželjni
- Samo osnovna forma reči (nominativ jednine): "kuća" NE "kućama"
- Samo srpske svakodnevne reči — bez stranih reči
- Reči između 3 i 9 slova
- NE vlastita imena
- Svaka reč treba da ima bar jedno slovo sa kvačicom (š č ć đ ž)
- Teme: telo, dom, hrana, biljke, životinje, posao, škola, sport, priroda, vreme, boje, predmeti

Vrati SAMO JSON niz stringova, bez ikakvog teksta pre ili posle.
Primer: ["kuća","šuma","čovek","žena","đak","mišić","svećnjak","nož","češalj","šešir"]`,

  // kvacice-medium.json — vlastita imena sa kvačicama
  kvacice_medium_batch: (n) => `Generiši tačno ${n} srpskih vlastitih imena za vežbanje kucanja.

PRAVILA:
- Srpska vlastita imena sa dijakritičkim znacima (š č ć đ ž obavezni)
- Mešavina: srpska muška i ženska imena (Nikola, Dragan, Jelena, Milica, Đorđe...)
- Srpski gradovi i mesta (Niš, Čačak, Šabac, Vranje, Kruševac, Užice...)
- Srpske reke i planine (Drina, Šara, Kopaonik, Đerdap...)
- Počinje velikim slovom
- Dužina 3-12 slova
- SAMO srpska/balkanska vlastita imena — bez stranih (ne "Paris", ne "London")

Vrati SAMO JSON niz stringova, bez ikakvog teksta pre ili posle.
Primer: ["Nikola","Jelena","Đorđe","Niš","Čačak","Šabac","Drina","Šara","Milica","Kruševac"]`,

  // cyr-base.json — ćirilica, svakodnevne reči
  cyr_base_batch: (n) => `Генериши тачно ${n} српских речи за вежбање куцања на тастатури.

ПРАВИЛА — веома строга:
- Искључиво мала ћириличка слова
- Само основна форма речи (номинативједнине): "кућа" НЕ "кућама"
- Само српске свакодневне речи — БЕЗ страних речи
- Речи између 3 и 9 слова
- НЕ властита имена, НЕ градови, НЕ презимена
- Теме: тело, дом, храна, биљке, животиње, посао, школа, спорт, природа, боје, предмети

Врати САМО JSON низ стрингова, без икаквог текста пре или после.
Пример: ["кућа","вода","дрво","хлеб","сунце","река","дете","брат","сестра","зима"]`,

  // cyr-medium.json — ćirilica vlastita imena
  cyr_medium_batch: (n) => `Генериши тачно ${n} српских властитих имена ћирилицом за вежбање куцања.

ПРАВИЛА:
- Ћириличко писмо, почиње великим словом
- Српска мушка и женска имена (Никола, Драган, Јелена, Милица, Ђорђе...)
- Српски градови (Ниш, Чачак, Шабац, Врање, Крушевац, Ужице...)
- Српске реке и планине (Дрина, Шара, Копаоник, Ђердап...)
- Дужина 3-12 слова
- САМО српска/балканска властита имена

Врати САМО JSON низ стрингова, без икаквог текста пре или после.
Пример: ["Никола","Јелена","Ђорђе","Ниш","Чачак","Шабац","Дрина","Шара","Милица"]`,
}

// ─── GENERATION PLAN ─────────────────────────────────────────────────────────

async function generatePool(name, promptFn, targetCount, batchSize = 2000) {
  console.log(`\n── Generating ${name} (target: ${targetCount}) ──`)
  const batches = Math.ceil(targetCount / batchSize)
  const allWords = []

  for (let i = 0; i < batches; i++) {
    const remaining = targetCount - allWords.length
    const size = Math.min(batchSize, remaining + 200) // overshoot slightly
    console.log(`  Batch ${i + 1}/${batches} (${size} words)...`)
    try {
      const words = await callGemini(promptFn(size))
      const cleaned = dedup(words)
      allWords.push(...cleaned)
      console.log(`  Got ${cleaned.length} words (total: ${allWords.length})`)
    } catch (e) {
      console.error(`  FAILED batch ${i + 1}:`, e.message)
    }
    if (i < batches - 1) await sleep(4500) // 15 RPM = 4s between calls
  }

  const final = dedup(allWords).slice(0, targetCount)
  console.log(`  Final: ${final.length} unique words`)
  return final
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Starting word pool generation...\n')

  // base.json: 25,000 bez kvačica — 10 batches x 2500
  const base = await generatePool('base.json', PROMPTS.base_batch, 25000, 2500)
  writeJson('base.json', base)
  await sleep(5000)

  // kvacice.json: 5,000 sa kvačicama — 2 batches x 2500
  const kvacice = await generatePool('kvacice.json', PROMPTS.kvacice_batch, 5000, 2500)
  writeJson('kvacice.json', kvacice)
  await sleep(5000)

  // kvacice-medium.json: 3,000 vlastita imena — 2 batches
  const kvaciceMedium = await generatePool('kvacice-medium.json', PROMPTS.kvacice_medium_batch, 3000, 1500)
  writeJson('kvacice-medium.json', kvaciceMedium)
  await sleep(5000)

  // cyr-base.json: 10,000 ćirilica — 4 batches x 2500
  const cyrBase = await generatePool('cyr-base.json', PROMPTS.cyr_base_batch, 10000, 2500)
  writeJson('cyr-base.json', cyrBase)
  await sleep(5000)

  // cyr-medium.json: 3,000 ćirilica vlastita — 2 batches
  const cyrMedium = await generatePool('cyr-medium.json', PROMPTS.cyr_medium_batch, 3000, 1500)
  writeJson('cyr-medium.json', cyrMedium)

  console.log('\n✓ All pools generated!')
  console.log('Note: kvacice-expert.json, expert.json, cyr-expert.json, medium.json, numbers.json not regenerated (already OK)')
}

main().catch(console.error)
