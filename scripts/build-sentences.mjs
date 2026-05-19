// Gradi rečenice za tekst mod iz književnih dela
// Pokretanje: node scripts/build-sentences.mjs

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PDF_TEXTS_DIR = path.join(__dirname, 'pdf-texts')
const WORDS_DIR = path.join(__dirname, '..', 'lib', 'words')

// ── Transliteracija ───────────────────────────────────────────────────────────

function cyrToLat(text) {
  const map = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','ђ':'đ','е':'e','ж':'ž','з':'z',
    'и':'i','ј':'j','к':'k','л':'l','љ':'lj','м':'m','н':'n','њ':'nj','о':'o',
    'п':'p','р':'r','с':'s','т':'t','ћ':'ć','у':'u','ф':'f','х':'h','ц':'c',
    'ч':'č','џ':'dž','ш':'š',
    'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Ђ':'Đ','Е':'E','Ж':'Ž','З':'Z',
    'И':'I','Ј':'J','К':'K','Л':'L','Љ':'Lj','М':'M','Н':'N','Њ':'Nj','О':'O',
    'П':'P','Р':'R','С':'S','Т':'T','Ћ':'Ć','У':'U','Ф':'F','Х':'H','Ц':'C',
    'Ч':'Č','Џ':'Dž','Ш':'Š',
  }
  return text.split('').map(c => map[c] ?? c).join('')
}

function latToCyr(text) {
  return text
    .replace(/lj/g,'љ').replace(/nj/g,'њ').replace(/dž/g,'џ')
    .replace(/Lj/g,'Љ').replace(/Nj/g,'Њ').replace(/Dž/g,'Џ')
    .replace(/a/g,'а').replace(/b/g,'б').replace(/v/g,'в').replace(/g/g,'г')
    .replace(/d/g,'д').replace(/đ/g,'ђ').replace(/e/g,'е').replace(/ž/g,'ж')
    .replace(/z/g,'з').replace(/i/g,'и').replace(/j/g,'ј').replace(/k/g,'к')
    .replace(/l/g,'л').replace(/m/g,'м').replace(/n/g,'н').replace(/o/g,'о')
    .replace(/p/g,'п').replace(/r/g,'р').replace(/s/g,'с').replace(/t/g,'т')
    .replace(/ć/g,'ћ').replace(/u/g,'у').replace(/f/g,'ф').replace(/h/g,'х')
    .replace(/c/g,'ц').replace(/č/g,'ч').replace(/š/g,'ш')
    .replace(/A/g,'А').replace(/B/g,'Б').replace(/V/g,'В').replace(/G/g,'Г')
    .replace(/D/g,'Д').replace(/Đ/g,'Ђ').replace(/E/g,'Е').replace(/Ž/g,'Ж')
    .replace(/Z/g,'З').replace(/I/g,'И').replace(/J/g,'Ј').replace(/K/g,'К')
    .replace(/L/g,'Л').replace(/M/g,'М').replace(/N/g,'Н').replace(/O/g,'О')
    .replace(/P/g,'П').replace(/R/g,'Р').replace(/S/g,'С').replace(/T/g,'Т')
    .replace(/Ć/g,'Ћ').replace(/U/g,'У').replace(/F/g,'Ф').replace(/H/g,'Х')
    .replace(/C/g,'Ц').replace(/Č/g,'Ч').replace(/Š/g,'Ш')
}

function latToEasy(text) {
  return text
    .replace(/š/g,'s').replace(/Š/g,'S')
    .replace(/đ/g,'dj').replace(/Đ/g,'Dj')
    .replace(/č/g,'c').replace(/Č/g,'C')
    .replace(/ć/g,'c').replace(/Ć/g,'C')
    .replace(/ž/g,'z').replace(/Ž/g,'Z')
}

// ── Detekcija pisma ────────────────────────────────────────────────────────────

function isCyrillic(text) {
  const cyrCount = (text.match(/[а-шА-Ш]/g) || []).length
  const latCount = (text.match(/[a-zA-Z]/g) || []).length
  return cyrCount > latCount
}

// ── Ekstrakcija rečenica ────────────────────────────────────────────────────────

function isIjekavizam(s) {
  const lower = s.toLowerCase()
  // Regex koji hvata ijekavske korene — ie+konsonant, ije, gdje, ovdje, itd.
  const patterns = [
    /\bgdje\b/, /\bovdje\b/, /\bnigdje\b/, /\bsvugdje\b/, /\bodakle\b/,
    /\bdječ/, /\bdjevoj/, /\bdijete\b/, /\bdjeci\b/, /\bdjelo\b/,
    /\brječ/, /\brješen/, /\brješav/,
    /\bcvijet/, /\bcvijec/, /\bcvijeć/,
    /\bmlijeko\b/, /\bmlijeka\b/,
    /\bbijel/, /\bliječ/, /\blijepo\b/, /\blijepa\b/, /\blijepi\b/, /\blijepe\b/,
    /\bsnijeg/, /\bpijesak\b/, /\bpijevac\b/,
    /\bvjetar/, /\bvjetre\b/, /\bvjera\b/, /\bvjeruj/, /\bvjeran\b/,
    /\btjera/, /\btjesk/,
    /\bbjež/, /\bsjed/,
    /\bdjed\b/, /\bdjedu\b/,
    /\bnijedan\b/, /\bnijedno\b/,
    /\bprijekor\b/, /\bprijekl/, /\bprijevod/, /\bprijelaz/,
    /\bsvijet\b/, /\bsvijeta\b/, /\bsvijetu\b/,
    /\bzvijer\b/, /\bzvijeri\b/,
    /ije[a-zšđčćž]{1}/, // generički ijekavski koren: "ije" + konsonant
  ]
  return patterns.some(p => p.test(lower))
}

function extractSentences(text) {
  // Normalizuj tekst
  const normalized = text
    .replace(/\f/g, ' ')
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')

  // Podeli na rečenice
  const raw = normalized.split(/(?<=[.!?])\s+/)

  const result = []
  for (let s of raw) {
    s = s.trim()

    // Minimalna i maksimalna dužina (karakteri)
    if (s.length < 40 || s.length > 300) continue

    // Broj reči: 8-50
    const wordCount = s.split(/\s+/).length
    if (wordCount < 8 || wordCount > 50) continue

    // Ne sme da počinje brojem, crticom, znakom
    if (/^[\d\-—–*•]/.test(s)) continue

    // Ne sme da sadrži URL, email, specijalne znake
    if (/https?:|@|www\.|[<>{}[\]\\|^~`]/.test(s)) continue

    // Ne sme da ima previše brojeva, i ne sme da ima izolovane brojeve (br. stranica)
    if ((s.match(/\d/g) || []).length > 3) continue
    // Izolovani broj (broj koji stoji sam kao token — PDF artefakt broja stranice)
    if (/\s\d{1,4}\s/.test(s) || /\s\d{1,4}$/.test(s) || /^\d{1,4}\s/.test(s)) continue

    // Ne sme da ima previše velikih slova (naslovi, akronimi)
    const words = s.split(/\s+/)
    const capsWords = words.filter(w => w.length > 1 && w === w.toUpperCase()).length
    if (capsWords > 2) continue

    // PDF artefakt: pojedinačna slova unutar rečenice (razmaci unutar reči)
    // npr. "M o lim vas" — više od 3 jednoslovna tokena = loše formatiranje
    const singleLetters = words.filter(w => w.replace(/[^a-zšđčćžа-шА-Ш]/gi, '').length === 1).length
    if (singleLetters > 3) continue

    // PDF artefakt: reč sa naizmeničnim razmacima — slova odvojena razmakom
    // Detektujemo ako ima 2+ uzastopna jednoslovna tokena
    let consecutive = 0, maxConsecutive = 0
    for (const w of words) {
      if (w.replace(/[^a-zšđčćžа-шА-Ш]/gi, '').length === 1) {
        consecutive++
        maxConsecutive = Math.max(maxConsecutive, consecutive)
      } else {
        consecutive = 0
      }
    }
    if (maxConsecutive >= 2) continue

    // Konvertuj u latinicu ako je ćirilica
    const lat = isCyrillic(s) ? cyrToLat(s) : s

    // Isključi ijekavizme
    if (isIjekavizam(lat)) continue

    // Samo srpska slova + interpunkcija
    if (/[^\w\sšđčćžŠĐČĆŽ.,!?;:\-—–'"'']/.test(lat)) continue

    // Mora imati bar jedno malo slovo (nije samo naslov)
    if (!/[a-zšđčćž]/.test(lat)) continue

    result.push(lat.trim())
  }

  return result
}

// ── Klasifikacija po težini ────────────────────────────────────────────────────

function classifySentence(sentence) {
  const words = sentence.split(/\s+/)
  const avgLen = words.reduce((s, w) => s + w.replace(/[^a-zšđčćž]/gi, '').length, 0) / words.length
  const hasKvacice = /[šđčćž]/i.test(sentence)
  const kvaciceCount = (sentence.match(/[šđčćž]/gi) || []).length

  // easy: kratke reči (avg ≤4.5) i bez kvačica
  if (avgLen <= 4.5 && !hasKvacice) return 'easy'
  // medium: kratke/srednje reči i malo kvačica
  if (avgLen <= 5.2 && kvaciceCount <= 2) return 'medium'
  // expert: duge reči (avg >6.5) ili puno kvačica (>8)
  if (avgLen > 6.5 || kvaciceCount > 8) return 'expert'
  // hard: sve između
  return 'hard'
}

// ── Main ────────────────────────────────────────────────────────────────────────

console.log('Ekstraktujem rečenice iz književnih dela...\n')

const byLevel = { easy: [], medium: [], hard: [], expert: [] }
const BIBLIJA_SIZE = 3_000_000

const files = fs.readdirSync(PDF_TEXTS_DIR).filter(f => f.endsWith('.txt'))
for (const f of files) {
  const fp = path.join(PDF_TEXTS_DIR, f)
  const stat = fs.statSync(fp)
  if (stat.size > BIBLIJA_SIZE) {
    console.log(`PRESKAČEM: ${f} (Biblija)`)
    continue
  }
  const text = fs.readFileSync(fp, 'utf8')
  const sentences = extractSentences(text)
  for (const s of sentences) {
    const level = classifySentence(s)
    byLevel[level].push(s)
  }
  console.log(`${f}: ${sentences.length} rečenica`)
}

// Deduplikacija i shuffle
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function dedup(arr) {
  return [...new Map(arr.map(s => [s.slice(0, 60), s])).values()]
}

console.log('\nRezultat po nivoima (latinica):')
for (const [level, sents] of Object.entries(byLevel)) {
  const unique = shuffle(dedup(sents))
  console.log(`  ${level}: ${unique.length} rečenica`)
  byLevel[level] = unique
}

// ── Sačuvaj sve 3 pisma × 4 nivoa = 12 fajlova ──────────────────────────────

const scripts = ['latinica', 'cirilica', 'easy']

for (const script of scripts) {
  const dir = path.join(WORDS_DIR, script)
  fs.mkdirSync(dir, { recursive: true })

  for (const [level, sents] of Object.entries(byLevel)) {
    let converted
    if (script === 'latinica') converted = sents
    else if (script === 'cirilica') converted = sents.map(latToCyr)
    else converted = sents.map(latToEasy)

    const fp = path.join(dir, `text-${level}.json`)
    fs.writeFileSync(fp, JSON.stringify(converted))
    console.log(`✓ ${script}/text-${level}.json: ${converted.length} rečenica`)
  }
}

console.log('\n✓ Gotovo!')
