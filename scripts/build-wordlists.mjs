// Gradi word pool JSON fajlove iz srpskih knjiÅ¾evnih tekstova
// Pokretanje: node scripts/build-wordlists.mjs

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const PDF_TEXTS_DIR = path.join(__dirname, 'pdf-texts')
const WORDS_DIR = path.join(ROOT, 'lib', 'words')
let seedWords = new Set()

// â”€â”€ Transliteracija Ä‡irilica â†’ latinica â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const CYR_TO_LAT = {
  'Ð°':'a','Ð±':'b','Ð²':'v','Ð³':'g','Ð´':'d','Ñ’':'Ä‘','Ðµ':'e','Ð¶':'Å¾','Ð·':'z',
  'Ð¸':'i','Ñ˜':'j','Ðº':'k','Ð»':'l','Ñ™':'lj','Ð¼':'m','Ð½':'n','Ñš':'nj','Ð¾':'o',
  'Ð¿':'p','Ñ€':'r','Ñ':'s','Ñ‚':'t','Ñ›':'Ä‡','Ñƒ':'u','Ñ„':'f','Ñ…':'h','Ñ†':'c',
  'Ñ‡':'Ä','ÑŸ':'dÅ¾','Ñˆ':'Å¡',
  'Ð':'a','Ð‘':'b','Ð’':'v','Ð“':'g','Ð”':'d','Ð‚':'Ä‘','Ð•':'e','Ð–':'Å¾','Ð—':'z',
  'Ð˜':'i','Ðˆ':'j','Ðš':'k','Ð›':'l','Ð‰':'lj','Ðœ':'m','Ð':'n','ÐŠ':'nj','Ðž':'o',
  'ÐŸ':'p','Ð ':'r','Ð¡':'s','Ð¢':'t','Ð‹':'Ä‡','Ð£':'u','Ð¤':'f','Ð¥':'h','Ð¦':'c',
  'Ð§':'Ä','Ð':'dÅ¾','Ð¨':'Å¡',
}

function cyrToLat(word) {
  let result = ''
  for (const ch of word) {
    result += CYR_TO_LAT[ch] ?? ch
  }
  return result
}

// â”€â”€ Tokenizacija i ÄiÅ¡Ä‡enje â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// ReÄi koje treba iskljuÄiti (najÄeÅ¡Ä‡e gramatiÄke reÄi, predlozi, veznici)
// ZadrÅ¾avamo ih u reÄenicama ali ih ne stavljamo u word pool za veÅ¾banje
const STOP_WORDS = new Set([
  'i','a','u','s','sa','na','o','od','do','za','iz','po','pri','pro',
  'se','si','su','je','sam','smo','ste','su','bi','bio','bila','bilo','bili',
  'Ä‡e','Ä‡u','Ä‡eÅ¡','Ä‡emo','Ä‡ete','da','ne','ni','no','ali','ili','pa','te',
  'taj','ta','to','ti','te','tog','tom','tu','toj','im','ih','ga','mu',
  'Å¡to','koji','koja','koje','kojÐ¸','kojih','kojima',
  'ovaj','ova','ovo','ovog','ovom','ovÐ´Ðµ',
  'onaj','ona','ono','onog','onom',
  'sve','svi','svÐ°','svog','svom','svaki','svaka',
  'veÄ‡','joÅ¡','kao','kad','jer','ako','dok','tek','sve',
  'moÅ¾e','mogu','moÄ‡i','treba','mora','hoÄ‡e','hoÄ‡u',
  'nij','nije','nema','ima','imÐ°',
  'the','and','of','to','in','is','it','for','on','are',  // strane reÄi
])

// Regex koji hvata ijekavske korene â€” generiÄki + specifiÄni oblici
const IJEKAVIZAM_RE = /ije[a-zÅ¡Ä‘ÄÄ‡Å¾]|ije$|prije|poslije|uvijek|nikad(?:a)|ranije|kasnije|dvije|svijet|nijedan|negdje|ovdje|nigdje|svugdje|gdje|djec|djevo|dijete|djelo|rjeÄ|rjeÅ¡|cvijet|mlijeko|bijel|snijeg|pijesak|vjetar|vjera|vjeruj|tjera|tjeskob|bjeÅ¾/

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
  'servido', 'lanzarote', 'bretaÃ±a', 'rocino', 'ganado', 'perdido',
  'desamor', 'dorado', 'cuando', 'alquife', 'miraflores', 'villadiego',
  'vargas', 'buzcorona', 'alvarez', 'soria', 'dominga', 'guzman', 'leon',
  'valencia', 'latino',
])

function isRejectedWord(word) {
  return REJECT_WORDS.has(word)
}

function stripQuotedSpans(text) {
  return text
    .replace(/[Â»Â«][^Â»Â«]{0,500}[Â»Â«]/g, ' ')
    .replace(/[â€œâ€][^â€œâ€]{0,500}[â€œâ€]/g, ' ')
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

function tokenizeV2(text) {
  const result = []
  const lines = text
    .replace(/\f/g, '\n')
    .replace(/\r/g, '\n')
    .split(/\n+/)

  for (const line of lines) {
    const cleaned = stripQuotedSpans(line)
      .replace(/[0-9]+/g, ' ')
      .replace(/[Â«Â»â€ž""\[\](){}<>\/\\|@#$%^&*+=~`]/g, ' ')
      .replace(/[.,:;!?â€”â€“\-_'"]/g, ' ')

    const tokens = cleaned.split(/\s+/)
    const lineWords = []
    let anchorCount = 0

    for (const raw of tokens) {
      const w = raw.trim().toLowerCase()
      if (!w || !isCleanToken(w)) continue

      const lat = cyrToLat(w)
      if (!/^[a-zÅ¡Ä‘ÄÄ‡Å¾lj]+$/.test(lat)) continue

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

// Biblija fajl â€” dominira frekvencijom, arhaiÄni jezik, iskljuÄujemo iz word poola
// (identifikujemo po veliÄini â€” Biblija je ~4MB, svi ostali su manji od 1.5MB)
const BIBLIJA_SIZE_THRESHOLD = 3_000_000

// â”€â”€ UÄitaj sve tekstove â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

console.log('UÄitavam tekstove...')

let allWords = []

// PDF tekstovi
if (fs.existsSync(PDF_TEXTS_DIR)) {
  const files = fs.readdirSync(PDF_TEXTS_DIR).filter(f => f.endsWith('.txt'))
  for (const f of files) {
    const fp = path.join(PDF_TEXTS_DIR, f)
    const stat = fs.statSync(fp)
    if (stat.size > BIBLIJA_SIZE_THRESHOLD) {
      console.log(`  PRESKAÄŒEM (Biblija/preveliki fajl): ${f} (${(stat.size/1024/1024).toFixed(1)}MB)`)
      continue
    }
    const text = fs.readFileSync(fp, 'utf8')
    const words = tokenizeV2(text)
    for (const w of words) allWords.push(w)
    console.log(`  ${f}: ${words.length} tokena`)
  }
}

// PostojeÄ‡i kvalitetni seed (srpske-reci fajl koji si dao)
const seedFile = path.join(WORDS_DIR, 'seed-manual.json')
if (fs.existsSync(seedFile)) {
  const seed = JSON.parse(fs.readFileSync(seedFile, 'utf8'))
  seedWords = new Set(seed.map(w => cyrToLat(w.toLowerCase())))
  for (const w of seed) allWords.push(cyrToLat(w.toLowerCase()))
  console.log(`  seed-manual.json: ${seed.length} reÄi`)
}

console.log(`\nUkupno tokena: ${allWords.length}`)

// â”€â”€ Frekvencijska analiza â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const freq = {}
for (const w of allWords) {
  freq[w] = (freq[w] || 0) + 1
}

// Sortirano po frekvenciji
const sorted = Object.entries(freq)
  .sort((a, b) => b[1] - a[1])
  .map(([word]) => word)

console.log(`Jedinstvenih reÄi: ${sorted.length}`)
console.log(`Top 30: ${sorted.slice(0, 30).join(', ')}`)

// â”€â”€ Podela po pool-ovima â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const hasKvacica = w => /[Å¡Ä‘ÄÄ‡Å¾]/.test(w)

// base (easy): bez kvaÄica, kratke Äeste reÄi 3-6 slova â€” top po frekvenciji
const allBase = sorted.filter(w => !hasKvacica(w))
const base = allBase.filter(w => w.length >= 3 && w.length <= 6)
console.log(`\nbase/easy (3-6 slova, bez kvaÄica): ${base.length}`)

// kvacice: sa kvaÄicama, kratke 3-6 slova
const kvacice = sorted.filter(w => hasKvacica(w) && w.length >= 3 && w.length <= 6)
console.log(`kvacice easy (3-6 slova): ${kvacice.length}`)

// medium: bez kvaÄica, srednja duÅ¾ina 5-8 slova
const medium = allBase.filter(w => w.length >= 5 && w.length <= 8)
console.log(`medium (5-8 slova, bez kvaÄica): ${medium.length}`)

// expert: bez kvaÄica, duge reÄi 8-12 slova
const expert = allBase.filter(w => w.length >= 8 && w.length <= 12)
console.log(`expert (8-12 slova, bez kvaÄica): ${expert.length}`)

// kvacice-medium: sa kvaÄicama, srednja duÅ¾ina 5-8
const kvaciceMedium = sorted.filter(w => hasKvacica(w) && w.length >= 5 && w.length <= 8)
console.log(`kvacice-medium: ${kvaciceMedium.length}`)

// kvacice-expert: sa kvaÄicama, duge 8-12
const kvaciceExpert = sorted.filter(w => hasKvacica(w) && w.length >= 8 && w.length <= 12)
console.log(`kvacice-expert: ${kvaciceExpert.length}`)

// â”€â”€ Ä†irilica pool-ovi (transliteracija latinice u Ä‡irilicu) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function latToCyr(word) {
  // Redosled: dvoslovi pre jednoslova
  let s = word
    .replace(/lj/g, 'Ñ™')
    .replace(/nj/g, 'Ñš')
    .replace(/dÅ¾/g, 'ÑŸ')
    .replace(/a/g,'Ð°').replace(/b/g,'Ð±').replace(/v/g,'Ð²').replace(/g/g,'Ð³')
    .replace(/d/g,'Ð´').replace(/Ä‘/g,'Ñ’').replace(/e/g,'Ðµ').replace(/Å¾/g,'Ð¶')
    .replace(/z/g,'Ð·').replace(/i/g,'Ð¸').replace(/j/g,'Ñ˜').replace(/k/g,'Ðº')
    .replace(/l/g,'Ð»').replace(/m/g,'Ð¼').replace(/n/g,'Ð½').replace(/o/g,'Ð¾')
    .replace(/p/g,'Ð¿').replace(/r/g,'Ñ€').replace(/s/g,'Ñ').replace(/t/g,'Ñ‚')
    .replace(/Ä‡/g,'Ñ›').replace(/u/g,'Ñƒ').replace(/f/g,'Ñ„').replace(/h/g,'Ñ…')
    .replace(/c/g,'Ñ†').replace(/Ä/g,'Ñ‡').replace(/Å¡/g,'Ñˆ')
  return s
}

const cyrBase = allBase.filter(w => w.length >= 3 && w.length <= 6).map(latToCyr)
const cyrMedium = medium.map(latToCyr)
const cyrExpert = expert.map(latToCyr)
const gamePool = allBase.filter(w => /^[a-z]+$/.test(w)).slice(0, 10000)

// â”€â”€ SaÄuvaj fajlove â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function save(filename, data) {
  const fp = path.join(WORDS_DIR, filename)
  fs.writeFileSync(fp, JSON.stringify(data))
  console.log(`âœ“ ${filename}: ${data.length} reÄi`)
}

console.log('\nSaÄuvavam pool-ove...')
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

console.log('\nâœ“ Gotovo!')

