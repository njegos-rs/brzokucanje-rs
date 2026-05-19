const fs = require('fs');
const path = require('path');

const ROOT = path.join(process.cwd(), 'lib', 'words');

const PAIRS = [
  { lat: 'base.json', cyr: 'cyr-base.json' },
  { lat: 'medium.json', cyr: 'cyr-medium.json' },
  { lat: 'expert.json', cyr: 'cyr-expert.json' },
];

const KEEP_SHORT = new Set([
  'a', 'i', 'u', 'o',
  'da', 'je', 'su', 'se', 'na', 'za', 'od', 'do', 'po', 'iz', 'sa', 'to',
  'ko', 'pa', 'ne', 'ni', 'mi', 'te', 'li',
]);

const ALLOW_NO_VOWELS = new Set(['smrt', 'krv', 'prst', 'vrh', 'brk', 'hrt', 'srp', 'brz', 'krst', 'tvrd']);

const BANNED_EXACT = new Set([
  'puegbo', 'kotes', 'gdej', 'tzv', 'http', 'www', 'org', 'com', 'net',
  'vodka', 'viski', 'tekila', 'mejl', 'sajt', 'karate', 'notne',
  'gvelfi', 'nadbi', 'hajkom', 'zeki', 'zilavi', 'grofe', 'azu',
  'covjek', 'covjeka', 'mjesta', 'mjestu', 'mjesec', 'njegos', 'svatko', 'nitko', 'netko',
]);

const BASE_EXTRA_BANNED = new Set([
  'hose', 'hosea', 'joe', 'camila', 'sancha', 'paris', 'poiret', 'tibalt', 'pjetro', 'krespi',
  'grifon', 'samsa', 'kafka', 'jones', 'luis', 'alisi', 'zoilom', 'ramiz', 'hamid', 'avdage',
  'mehaga', 'mujaga', 'hafiz', 'jusuf', 'lotika', 'rebeka', 'aska', 'hasan',
  'donde', 'flata', 'somnus', 'imago', 'mortis', 'minime', 'notus', 'comp', 'buenos', 'pulsat',
  'fanege', 'hebreo', 'leone', 'ebreo', 'isidro', 'michel', 'versos', 'cabo', 'roto', 'salir',
  'calzas', 'rojasu', 'fanega', 'diaz', 'armas', 'leonor', 'puerto', 'camas', 'merced', 'dormir',
  'velar', 'sano', 'percha', 'vieja', 'triani', 'arenal', 'viaje', 'azogue', 'forum', 'algo',
  'tag', 'media', 'sobre', 'iii', 'iiii', 'viii', 'kviii', 'mmiiim', 'ooooo', 'ooooj'
]);

const BANNED_SUBSTR = [
  'q', 'w', 'x',
  'http', 'html', 'javascript',
];

const ARCHAIC_PATTERNS = [
  /doh$/i, /ste$/i, /jasmo$/i, /jaste$/i, /jahu$/i, /ijah$/i, /ijahu$/i,
  /^imadoh$/i, /^bijahu$/i, /^htjede$/i, /^ostade$/i,
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(path.join(ROOT, file), JSON.stringify(value));
}

function latinizeCyr(text) {
  const map = [
    ['љ', 'lj'], ['њ', 'nj'], ['џ', 'dz'],
    ['а', 'a'], ['б', 'b'], ['в', 'v'], ['г', 'g'], ['д', 'd'], ['ђ', 'dj'],
    ['е', 'e'], ['ж', 'z'], ['з', 'z'], ['и', 'i'], ['ј', 'j'], ['к', 'k'],
    ['л', 'l'], ['м', 'm'], ['н', 'n'], ['о', 'o'], ['п', 'p'], ['р', 'r'],
    ['с', 's'], ['т', 't'], ['ћ', 'c'], ['у', 'u'], ['ф', 'f'], ['х', 'h'],
    ['ц', 'c'], ['ч', 'c'], ['ш', 's'],
  ];
  let out = text.toLowerCase();
  for (const [from, to] of map) out = out.split(from).join(to);
  return out;
}

function hasVowel(word) {
  return /[aeiou]/.test(word);
}

function isLikelyIjekavian(word, latinSet) {
  if (!/(ije|je)/.test(word)) return false;
  const ek1 = word.replace(/ije/g, 'e').replace(/je/g, 'e');
  const ek2 = word.replace(/ije/g, 'i').replace(/je/g, 'e');
  return latinSet.has(ek1) || latinSet.has(ek2);
}

function shouldDrop(word, latinSet) {
  const w = word.toLowerCase().trim();
  if (!w) return true;
  if (BANNED_EXACT.has(w)) return true;
  if (w.length < 2 && !KEEP_SHORT.has(w)) return true;
  if (w.length < 3 && !KEEP_SHORT.has(w)) return true;
  if (!/^[a-z]+$/.test(w)) return true;
  if (BANNED_SUBSTR.some((s) => w.includes(s))) return true;
  if (ARCHAIC_PATTERNS.some((rx) => rx.test(w))) return true;
  if (!hasVowel(w) && w.length >= 4 && !ALLOW_NO_VOWELS.has(w)) return true;
  if (/^[bcdfghjklmnpqrstvwxyz]{4,}$/.test(w) && !ALLOW_NO_VOWELS.has(w)) return true;
  if (isLikelyIjekavian(w, latinSet)) return true;
  return false;
}

function shouldDropForFile(word, latinSet, latFile) {
  if (shouldDrop(word, latinSet)) return true;
  if (latFile === 'base.json' && BASE_EXTRA_BANNED.has(word)) return true;
  return false;
}

function cleanPair(pair) {
  const lat = readJson(pair.lat);
  const cyr = readJson(pair.cyr);
  const latinSet = new Set(lat.map((w) => String(w).toLowerCase()));

  const keepIndexes = [];
  for (let i = 0; i < lat.length; i++) {
    const w = String(lat[i]).toLowerCase();
    if (!shouldDropForFile(w, latinSet, pair.lat)) keepIndexes.push(i);
  }

  const cleanedLat = keepIndexes.map((i) => String(lat[i]).toLowerCase());
  const cleanedCyr = keepIndexes.map((i) => String(cyr[i]));

  // final pass for cyr fragments by transliteration
  const finalLat = [];
  const finalCyr = [];
  for (let i = 0; i < cleanedCyr.length; i++) {
    const l = cleanedLat[i];
    const c = cleanedCyr[i];
    const cLat = latinizeCyr(c);
    if (shouldDropForFile(cLat, new Set(cleanedLat), pair.lat)) continue;
    finalLat.push(l);
    finalCyr.push(c);
  }

  writeJson(pair.lat, Array.from(new Set(finalLat)));
  writeJson(pair.cyr, Array.from(new Set(finalCyr)));

  return {
    pair,
    before: lat.length,
    afterLat: Array.from(new Set(finalLat)).length,
    afterCyr: Array.from(new Set(finalCyr)).length,
  };
}

function run() {
  const report = PAIRS.map(cleanPair);
  console.log(JSON.stringify(report, null, 2));
}

run();
