import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const WORDS_DIR = path.join(ROOT, 'lib', 'words')

// Arhaične i nerazumljive reči
const REJECT_WORDS = new Set([
  'бакраклије', 'цефенке', 'ритмајстер', 'санцхо', 'фолко', 'аурелијано',
  'пилар', 'тернера', 'мефистофелес', 'буцка', 'срета', 'федун',
  'кадија', 'перјаник', 'гомила', 'виров', 'костур', 'скрипави',
  'салтамбанко', 'бачезевић', 'павловић', 'јовановић', 'дос', 'кихот',
  'затвореници', 'саблаз', 'сусрет', 'пренахођење', 'наслутити', 'разбојник'
])

// Ijekavizmi (bosanski/crnogorski, ne srpski)
const IJEKAVIZAM_RE = /ије[а-зшђчћж]|ије$|осјетио|осјећа|свјетлост|хтио|казе(?!м)|вријем|сједе|дјед|sjet|prije|mjesto|nije|vrijeme|dje[cd]/i

// Vlastita imena i strane osobine
const PROPER_NOUN_RE = /\b[А-З][а-зшђчћж]+(?:\s+[А-З][а-зшђчћж]+)*\b/

// PDF artefakti
const PDF_ARTIFACT_RE = /\s{2,}[а-з]\s[а-з]\s[а-з]/i

// Znakovi koji trebaju biti kao š č ž
const BROKEN_CHARS_RE = /[сc]то\b|цезна|цека|цуо|цини|цуе|цалина|цовек|цетај|цаш|цика|цвет|цар|цас|цолова/i

function isCleanSentence(sentence) {
  const lower = sentence.toLowerCase()

  // Preskač rečenice sa PDF artefaktima
  if (PDF_ARTIFACT_RE.test(lower)) return false

  // Preskač rečenice sa ijekavizmima
  if (IJEKAVIZAM_RE.test(lower)) return false

  // Preskač rečenice sa sломљenim znakovima
  if (BROKEN_CHARS_RE.test(lower)) return false

  // Preskač ako ima previše vlastita imena
  const properNouns = sentence.match(PROPER_NOUN_RE) || []
  if (properNouns.length > 1) return false

  // Preskač ako sadrži neznane reči
  for (const word of REJECT_WORDS) {
    if (lower.includes(word)) return false
  }

  // Preskač kratke ili prazne
  if (sentence.trim().length < 10) return false

  // Preskač ako ima samo znakove ili brojeve
  if (!/[а-зшђчћж]/i.test(sentence)) return false

  return true
}

function cleanFile(filename) {
  const filepath = path.join(WORDS_DIR, filename)
  if (!fs.existsSync(filepath)) {
    console.log(`❌ ${filename} ne postoji`)
    return
  }

  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'))
  const before = data.length
  const cleaned = data.filter(isCleanSentence)
  const after = cleaned.length
  const removed = before - after

  fs.writeFileSync(filepath, JSON.stringify(cleaned, null, 2))
  console.log(`✓ ${filename}: ${before} → ${after} (izbačeno ${removed})`)

  if (removed > 0) {
    console.log(`   Primeri izbačenih:`)
    const removedExamples = data.filter(s => !isCleanSentence(s)).slice(0, 3)
    removedExamples.forEach(s => {
      console.log(`   ✗ "${s.substring(0, 80)}..."`)
    })
  }
}

console.log('Čišćenje tekst fajlova...\n')

// Ćirilica
cleanFile('cirilica/text-easy.json')
cleanFile('cirilica/text-medium.json')
cleanFile('cirilica/text-hard.json')
cleanFile('cirilica/text-expert.json')

// Latinica
cleanFile('latinica/text-easy.json')
cleanFile('latinica/text-medium.json')
cleanFile('latinica/text-hard.json')
cleanFile('latinica/text-expert.json')

console.log('\n✓ Gotovo!')
