// Generiše ćirilica/ i easy/ fajlove iz latinica/ JSON-ova
// Pokretanje: npx tsx scripts/generate-word-scripts.ts

import fs from 'fs'
import path from 'path'
import { latToCyr, latToEasy } from '../lib/transliteration'

const DIFFICULTIES = ['lake', 'srednje', 'teske'] as const
const BASE = path.join(process.cwd(), 'lib/words')

for (const diff of DIFFICULTIES) {
  const latFile = path.join(BASE, 'latinica', `${diff}.json`)
  if (!fs.existsSync(latFile)) {
    console.warn(`Preskačem ${diff} — fajl ne postoji`)
    continue
  }

  const words: string[] = JSON.parse(fs.readFileSync(latFile, 'utf-8'))

  const cyrWords = words.map(latToCyr)
  const easyWords = words.map(latToEasy)

  fs.mkdirSync(path.join(BASE, 'cirilica'), { recursive: true })
  fs.mkdirSync(path.join(BASE, 'easy'), { recursive: true })

  fs.writeFileSync(path.join(BASE, 'cirilica', `${diff}.json`), JSON.stringify(cyrWords, null, 0))
  fs.writeFileSync(path.join(BASE, 'easy', `${diff}.json`), JSON.stringify(easyWords, null, 0))

  console.log(`✓ ${diff}: ${words.length} reči → cirilica + easy`)
}
