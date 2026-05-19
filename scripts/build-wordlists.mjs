// Gradi word pool JSON fajlove iz srpskih književnih tekstova
// Pokretanje: node scripts/build-wordlists.mjs

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const PDF_TEXTS_DIR = path.join(__dirname, 'pdf-texts')
const WORDS_DIR = path.join(ROOT, 'lib', 'words')
let seedWords = new Set()

// ── Transliteracija ćirilica → latinica ──────────────────────────────────────

const CYR_TO_LAT = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','ђ':'đ','е':'e','ж':'ž','з':'z',
  'и':'i','ј':'j','к':'k','л':'l','љ':'lj','м':'m','н':'n','њ':'nj','о':'o',
  'п':'p','р':'r','с':'s','т':'t','ћ':'ć','у':'u','ф':'f','х':'h','ц':'c',
  'ч':'č','џ':'dž','ш':'š',
  'А':'a','Б':'b','В':'v','Г':'g','Д':'d','Ђ':'đ','Е':'e','Ж':'ž','З':'z',
  'И':'i','Ј':'j','К':'k','Л':'l','Љ':'lj','М':'m','Н':'n','Њ':'nj','О':'o',
  'П':'p','Р':'r','С':'s','Т':'t','Ћ':'ć','У':'u','Ф':'f','Х':'h','Ц':'c',
  'Ч':'č','Џ':'dž','Ш':'š',
}

function cyrToLat(word) {
  let result = ''
  for (const ch of word) {
    result += CYR_TO_LAT[ch] ?? ch
  }
  return result
}

// ── Tokenizacija i čišćenje ──────────────────────────────────────────────────

// Reči koje treba isključiti (najčešće gramatičke reči, predlozi, veznici)
// Zadržavamo ih u rečenicama ali ih ne stavljamo u word pool za vežbanje
const STOP_WORDS = new Set([
  'i','a','u','s','sa','na','o','od','do','za','iz','po','pri','pro',
  'se','si','su','je','sam','smo','ste','su','bi','bio','bila','bilo','bili',
  'će','ću','ćeš','ćemo','ćete','da','ne','ni','no','ali','ili','pa','te',
  'taj','ta','to','ti','te','tog','tom','tu','toj','im','ih','ga','mu',
  'što','koji','koja','koje','kojи','kojih','kojima',
  'ovaj','ova','ovo','ovog','ovom','ovде',
  'onaj','ona','ono','onog','onom',
  'sve','svi','svа','svog','svom','svaki','svaka',
  'već','još','kao','kad','jer','ako','dok','tek','sve',
  'može','mogu','moći','treba','mora','hoće','hoću',
  'nij','nije','nema','ima','imа',
  'the','and','of','to','in','is','it','for','on','are',  // strane reči
])

// Regex koji hvata ijekavske korene — generički + specifični oblici
const IJEKAVIZAM_RE = /ije[a-zšđčćž]|ije$|prije|poslije|uvijek|nikad(?:a)|ranije|kasnije|dvije|svijet|nijedan|negdje|ovdje|nigdje|svugdje|gdje|djec|djevo|dijete|djelo|rječ|rješ|cvijet|mlijeko|bijel|snijeg|pijesak|vjetar|vjera|vjeruj|tjera|tjeskob|bjež/

function isIjekavizam(word) {
  return IJEKAVIZAM_RE.test(word.toLowerCase())
}

const REJECT_WORDS = new Set([
  'clover', 'claire', 'clara', 'clare', 'collin', 'sierra', 'billee', 'pierre',
  'thomas', 'thatcher', 'thornton', 'christophe', 'perrault', 'gulliver',
  'lilliput', 'caballero', 'lazarillo', 'delphine', 'goethe', 'joseph',
  'mollie', 'miller', 'bull', 'agathe', 'agathi', 'berthe', 'huck', 'sancho',
  'ursula', 'alisa', 'faust', 'romeo', 'julija', 'goriot', 'balzac', 'orvel',
  'brajen', 'gregor', 'sonja', 'jelena', 'marta', 'marija', 'nikola', 'jovica',
  'danica', 'gojko', 'helena', 'pilar', 'pavka', 'pablo', 'pedro', 'frida',
  'markes', 'david', 'jovan', 'ivan', 'ana', 'milan', 'petar', 'jakov',
  'samuel', 'mojsije', 'isus', 'sokrat', 'platon', 'dante',
  'himmel', 'erde', 'nieder', 'giorno', 'notte', 'canto', 'phrase', 'thee',
  'phose', 'phu', 'allahu', 'allaha', 'allah', 'llaman', 'llamen', 'huella',
  'perros', 'torres', 'arreis', 'arreos', 'rinaldo', 'martorell', 'cervantes',
  'rancioso', 'marcillac', 'trailles', 'taillefer', 'buenas', 'mundo', 'hombre',
  'mujer', 'fuego', 'bello', 'guerra', 'circle', 'barrel', 'mirror', 'killer',
  'bill', 'reclam', 'gallus', 'tullia', 'sulla', 'all', 'gall', 'galla',
  'gallov', 'clari', 'claru', 'arrasu', 'urrea', 'olalla', 'nulla', 'perro',
  'saclum', 'bellas', 'gullon', 'clef', 'sphoes', 'arrab', 'llena', 'lloras',
  'jezrael', 'jeftaj', 'miha', 'pilkington', 'telekran', 'vinston', 'zlomisao',
  'aqui', 'alme', 'dichoso', 'humilde', 'estado', 'sabio', 'retira', 'mundo',
  'malvado', 'compasa', 'envidiadio', 'envidioso', 'cualquiera', 'tenga',
  'tejado', 'vidrio', 'tirar', 'piedras', 'vecino', 'caballero', 'damas',
  'servido', 'lanzarote', 'bretaña', 'rocino', 'ganado', 'perdido',
  'desamor', 'dorado', 'cuando', 'alquife', 'miraflores', 'villadiego',
  'vargas', 'buzcorona', 'alvarez', 'soria', 'dominga', 'guzman', 'leon',
  'valencia', 'latino',
])

function isRejectedWord(word) {
  return REJECT_WORDS.has(word)
}

function stripQuotedSpans(text) {
  return text
    .replace(/[»«][^»«]{0,500}[»«]/g, ' ')
    .replace(/[“”][^“”]{0,500}[“”]/g, ' ')
    .replace(/"[^"]{0,500}"/g, ' ')
}

function isSerbianAnchor(word) {
  return STOP_WORDS.has(word) || seedWords.has(word)
}

function isCleanToken(word) {
  const lower = word.toLowerCase()
  if (!/^\p{Script=Latin}+$/u.test(lower)) return false
  if (lower.length < 3 || lower.length > 12) return false
  if (/[qwx]/i.test(lower)) return false
  if (isIjekavizam(lower)) return false
  if (isRejectedWord(lower)) return false
  return true
}

function tokenize(text) {
  // Ukloni PDF artefakte: kratice, brojeve stranica, zaglavlja
  const cleaned = text
    .replace(/\f/g, ' ')                    // form feed
    .replace(/\r/g, ' ')
    .replace(/[0-9]+/g, ' ')               // brojevi
    .replace(/[«»„""\[\](){}<>\/\\|@#$%^&*+=~`]/g, ' ')
    .replace(/[.,:;!?—–\-_'"]/g, ' ')

  const tokens = cleaned.split(/\s+/)

  const result = []
  for (const raw of tokens) {
    const w = raw.trim().toLowerCase()
    if (!w || !isCleanToken(w)) continue

    // Transliteracij ćirilice u latinicu
    const lat = cyrToLat(w)

    // Samo srpska slova (latinica + kvačice)
    if (!/^[a-zšđčćžlj]+$/.test(lat)) continue

    // Isključi stop words
    if (STOP_WORDS.has(lat)) continue

    // Isključi ijekavizme
    if (isIjekavizam(lat)) continue

    // Isključi očigledno strane reči (q, w, x, y)
    if (/[qwxy]/.test(lat)) continue

    result.push(lat)
  }
  return result
}

function tokenizeV2(text) {
  const result = []
  const lines = text
    .replace(/\f/g, '\n')
    .replace(/\r/g, '\n')
    .split(/\n+/)

  for (const line of lines) {
    const cleaned = stripQuotedSpans(line)
      .replace(/[0-9]+/g, ' ')
      .replace(/[«»„""\[\](){}<>\/\\|@#$%^&*+=~`]/g, ' ')
      .replace(/[.,:;!?—–\-_'"]/g, ' ')

    const tokens = cleaned.split(/\s+/)
    const lineWords = []
    let anchorCount = 0

    for (const raw of tokens) {
      const w = raw.trim().toLowerCase()
      if (!w || !isCleanToken(w)) continue

      const lat = cyrToLat(w)
      if (!/^[a-zšđčćžlj]+$/.test(lat)) continue

      if (STOP_WORDS.has(lat)) {
        anchorCount++
        continue
      }
      if (isIjekavizam(lat)) continue
      if (/[qwxy]/.test(lat)) continue

      if (isSerbianAnchor(lat)) anchorCount++
      lineWords.push(lat)
    }

    if (lineWords.length >= 5 && anchorCount === 0) continue
    result.push(...lineWords)
  }

  return result
}

// Biblija fajl — dominira frekvencijom, arhaični jezik, isključujemo iz word poola
// (identifikujemo po veličini — Biblija je ~4MB, svi ostali su manji od 1.5MB)
const BIBLIJA_SIZE_THRESHOLD = 3_000_000

// ── Učitaj sve tekstove ──────────────────────────────────────────────────────

console.log('Učitavam tekstove...')

let allWords = []

// PDF tekstovi
if (fs.existsSync(PDF_TEXTS_DIR)) {
  const files = fs.readdirSync(PDF_TEXTS_DIR).filter(f => f.endsWith('.txt'))
  for (const f of files) {
    const fp = path.join(PDF_TEXTS_DIR, f)
    const stat = fs.statSync(fp)
    if (stat.size > BIBLIJA_SIZE_THRESHOLD) {
      console.log(`  PRESKAČEM (Biblija/preveliki fajl): ${f} (${(stat.size/1024/1024).toFixed(1)}MB)`)
      continue
    }
    const text = fs.readFileSync(fp, 'utf8')
    const words = tokenizeV2(text)
    for (const w of words) allWords.push(w)
    console.log(`  ${f}: ${words.length} tokena`)
  }
}

// Postojeći kvalitetni seed (srpske-reci fajl koji si dao)
const seedFile = path.join(WORDS_DIR, 'seed-manual.json')
if (fs.existsSync(seedFile)) {
  const seed = JSON.parse(fs.readFileSync(seedFile, 'utf8'))
  seedWords = new Set(seed.map(w => cyrToLat(w.toLowerCase())))
  for (const w of seed) allWords.push(cyrToLat(w.toLowerCase()))
  console.log(`  seed-manual.json: ${seed.length} reči`)
}

console.log(`\nUkupno tokena: ${allWords.length}`)

// ── Frekvencijska analiza ────────────────────────────────────────────────────

const freq = {}
for (const w of allWords) {
  freq[w] = (freq[w] || 0) + 1
}

// Sortirano po frekvenciji
const sorted = Object.entries(freq)
  .sort((a, b) => b[1] - a[1])
  .map(([word]) => word)

console.log(`Jedinstvenih reči: ${sorted.length}`)
console.log(`Top 30: ${sorted.slice(0, 30).join(', ')}`)

// ── Podela po pool-ovima ─────────────────────────────────────────────────────

const hasKvacica = w => /[šđčćž]/.test(w)

// base (easy): bez kvačica, kratke česte reči 3-6 slova — top po frekvenciji
const allBase = sorted.filter(w => !hasKvacica(w))
const base = allBase.filter(w => w.length >= 3 && w.length <= 6)
console.log(`\nbase/easy (3-6 slova, bez kvačica): ${base.length}`)

// kvacice: sa kvačicama, kratke 3-6 slova
const kvacice = sorted.filter(w => hasKvacica(w) && w.length >= 3 && w.length <= 6)
console.log(`kvacice easy (3-6 slova): ${kvacice.length}`)

// medium: bez kvačica, srednja dužina 5-8 slova
const medium = allBase.filter(w => w.length >= 5 && w.length <= 8)
console.log(`medium (5-8 slova, bez kvačica): ${medium.length}`)

// expert: bez kvačica, duge reči 8-12 slova
const expert = allBase.filter(w => w.length >= 8 && w.length <= 12)
console.log(`expert (8-12 slova, bez kvačica): ${expert.length}`)

// kvacice-medium: sa kvačicama, srednja dužina 5-8
const kvaciceMedium = sorted.filter(w => hasKvacica(w) && w.length >= 5 && w.length <= 8)
console.log(`kvacice-medium: ${kvaciceMedium.length}`)

// kvacice-expert: sa kvačicama, duge 8-12
const kvaciceExpert = sorted.filter(w => hasKvacica(w) && w.length >= 8 && w.length <= 12)
console.log(`kvacice-expert: ${kvaciceExpert.length}`)

// ── Ćirilica pool-ovi (transliteracija latinice u ćirilicu) ─────────────────

const LAT_TO_CYR = {
  'lj':'љ','nj':'њ','dž':'џ',
  'a':'а','b':'б','v':'в','g':'г','d':'д','đ':'ђ','e':'е','ž':'ž2',
  'z':'з','i':'и','j':'ј','k':'к','l':'л','m':'м','n':'н','o':'о',
  'p':'п','r':'р','s':'с','t':'т','ć':'ћ','u':'у','f':'ф','h':'х',
  'c':'ц','č':'ч','š':'ш',
}
// Posebno za ž jer mora posle lj/nj/dž
const LAT_TO_CYR2 = { 'ž2':'ж' }

function latToCyr(word) {
  // Redosled: dvoslovi pre jednoslova
  let s = word
    .replace(/lj/g, 'љ')
    .replace(/nj/g, 'њ')
    .replace(/dž/g, 'џ')
    .replace(/a/g,'а').replace(/b/g,'б').replace(/v/g,'в').replace(/g/g,'г')
    .replace(/d/g,'д').replace(/đ/g,'ђ').replace(/e/g,'е').replace(/ž/g,'ж')
    .replace(/z/g,'з').replace(/i/g,'и').replace(/j/g,'ј').replace(/k/g,'к')
    .replace(/l/g,'л').replace(/m/g,'м').replace(/n/g,'н').replace(/o/g,'о')
    .replace(/p/g,'п').replace(/r/g,'р').replace(/s/g,'с').replace(/t/g,'т')
    .replace(/ć/g,'ћ').replace(/u/g,'у').replace(/f/g,'ф').replace(/h/g,'х')
    .replace(/c/g,'ц').replace(/č/g,'ч').replace(/š/g,'ш')
  return s
}

const cyrBase = allBase.filter(w => w.length >= 3 && w.length <= 6).map(latToCyr)
const cyrMedium = medium.map(latToCyr)
const cyrExpert = expert.map(latToCyr)
const gamePool = allBase.filter(w => /^[a-z]+$/.test(w)).slice(0, 10000)

// easy (bez kvačica = samo ASCII latinica)
const latToEasy = w => w
  .replace(/š/g,'s').replace(/đ/g,'dj').replace(/č/g,'c')
  .replace(/ć/g,'c').replace(/ž/g,'z')

// ── Sačuvaj fajlove ──────────────────────────────────────────────────────────

function save(filename, data) {
  const fp = path.join(WORDS_DIR, filename)
  fs.writeFileSync(fp, JSON.stringify(data))
  console.log(`✓ ${filename}: ${data.length} reči`)
}

console.log('\nSačuvavam pool-ove...')
save('base.json', base)
save('kvacice.json', kvacice)
save('medium.json', medium)
save('expert.json', expert)
save('kvacice-medium.json', kvaciceMedium)
save('kvacice-expert.json', kvaciceExpert)
save('cyr-base.json', cyrBase)
save('cyr-medium.json', cyrMedium)
save('cyr-expert.json', cyrExpert)
save('game-pool.json', gamePool)

console.log('\n✓ Gotovo!')
