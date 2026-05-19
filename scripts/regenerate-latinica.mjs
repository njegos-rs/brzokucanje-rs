import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const WORDS_DIR = path.join(ROOT, 'lib', 'words')

// Transliteracija ćirilica → latinica
const CYR_TO_LAT = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','ђ':'đ','е':'e','ж':'ž','з':'z',
  'и':'i','ј':'j','к':'k','л':'l','љ':'lj','м':'m','н':'n','њ':'nj','о':'o',
  'п':'p','р':'r','с':'s','т':'t','ћ':'ć','у':'u','ф':'f','х':'h','ц':'c',
  'ч':'č','џ':'dž','ш':'š',
  'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Ђ':'Đ','Е':'E','Ж':'Ž','З':'Z',
  'И':'I','Ј':'J','К':'K','Л':'L','Љ':'Lj','М':'M','Н':'N','Њ':'Nj','О':'O',
  'П':'P','Р':'R','С':'S','Т':'T','Ћ':'Ć','У':'U','Ф':'F','Х':'H','Ц':'C',
  'Ч':'Č','Џ':'Dž','Ш':'Š',
}

function cyrToLat(text) {
  let result = ''
  for (const ch of text) {
    result += CYR_TO_LAT[ch] ?? ch
  }
  return result
}

function regenerateFile(cyrFile, latFile) {
  const cyrPath = path.join(WORDS_DIR, cyrFile)
  const latPath = path.join(WORDS_DIR, latFile)

  if (!fs.existsSync(cyrPath)) {
    console.log(`❌ ${cyrFile} ne postoji`)
    return
  }

  const cyrData = JSON.parse(fs.readFileSync(cyrPath, 'utf8'))
  const latData = cyrData.map(cyrToLat)

  fs.writeFileSync(latPath, JSON.stringify(latData, null, 2))
  console.log(`✓ ${latFile}: ${latData.length} rečenica`)
}

console.log('Regenerisanje latiničnih verzija iz čiste ćiriličke...\n')

regenerateFile('cirilica/text-easy.json', 'latinica/text-easy.json')
regenerateFile('cirilica/text-medium.json', 'latinica/text-medium.json')
regenerateFile('cirilica/text-hard.json', 'latinica/text-hard.json')
regenerateFile('cirilica/text-expert.json', 'latinica/text-expert.json')

console.log('\n✓ Gotovo!')
