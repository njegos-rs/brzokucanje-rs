// Redosled je kritičan — digrafi MORAJU biti pre jednoslovnih mapiranja

const LAT_TO_CYR_MAP: [string, string][] = [
  ['lj', 'љ'], ['nj', 'њ'], ['dž', 'џ'], ['Lj', 'Љ'], ['Nj', 'Њ'], ['Dž', 'Џ'],
  ['LJ', 'ЉЈ'], ['NJ', 'ЊЈ'], ['DŽ', 'Џ'],
  ['a', 'а'], ['b', 'б'], ['c', 'ц'], ['č', 'ч'], ['ć', 'ћ'],
  ['d', 'д'], ['đ', 'ђ'], ['e', 'е'], ['f', 'ф'], ['g', 'г'],
  ['h', 'х'], ['i', 'и'], ['j', 'ј'], ['k', 'к'], ['l', 'л'],
  ['m', 'м'], ['n', 'н'], ['o', 'о'], ['p', 'п'], ['r', 'р'],
  ['s', 'с'], ['š', 'ш'], ['t', 'т'], ['u', 'у'], ['v', 'в'],
  ['z', 'з'], ['ž', 'ж'],
  ['A', 'А'], ['B', 'Б'], ['C', 'Ц'], ['Č', 'Ч'], ['Ć', 'Ћ'],
  ['D', 'Д'], ['Đ', 'Ђ'], ['E', 'Е'], ['F', 'Ф'], ['G', 'Г'],
  ['H', 'Х'], ['I', 'И'], ['J', 'Ј'], ['K', 'К'], ['L', 'Л'],
  ['M', 'М'], ['N', 'Н'], ['O', 'О'], ['P', 'П'], ['R', 'Р'],
  ['S', 'С'], ['Š', 'Ш'], ['T', 'Т'], ['U', 'У'], ['V', 'В'],
  ['Z', 'З'], ['Ž', 'Ж'],
]

const EASY_MAP: [string, string][] = [
  ['č', 'c'], ['ć', 'c'], ['š', 's'], ['ž', 'z'], ['đ', 'dj'],
  ['Č', 'C'], ['Ć', 'C'], ['Š', 'S'], ['Ž', 'Z'], ['Đ', 'Dj'],
]

export function latToCyr(text: string): string {
  let result = text
  for (const [lat, cyr] of LAT_TO_CYR_MAP) {
    result = result.split(lat).join(cyr)
  }
  return result
}

export function latToEasy(text: string): string {
  let result = text
  for (const [from, to] of EASY_MAP) {
    result = result.split(from).join(to)
  }
  return result
}

// Koristi se kada korisnik unosi ćirilicu a test je latinica
export function cyrToLat(text: string): string {
  const CYR_TO_LAT_MAP: [string, string][] = [
    ['љ', 'lj'], ['њ', 'nj'], ['џ', 'dž'],
    ['Љ', 'Lj'], ['Њ', 'Nj'], ['Џ', 'Dž'],
    ['а', 'a'], ['б', 'b'], ['ц', 'c'], ['ч', 'č'], ['ћ', 'ć'],
    ['д', 'd'], ['ђ', 'đ'], ['е', 'e'], ['ф', 'f'], ['г', 'g'],
    ['х', 'h'], ['и', 'i'], ['ј', 'j'], ['к', 'k'], ['л', 'l'],
    ['м', 'm'], ['н', 'n'], ['о', 'o'], ['п', 'p'], ['р', 'r'],
    ['с', 's'], ['ш', 'š'], ['т', 't'], ['у', 'u'], ['в', 'v'],
    ['з', 'z'], ['ж', 'ž'],
    ['А', 'A'], ['Б', 'B'], ['Ц', 'C'], ['Ч', 'Č'], ['Ћ', 'Ć'],
    ['Д', 'D'], ['Ђ', 'Đ'], ['Е', 'E'], ['Ф', 'F'], ['Г', 'G'],
    ['Х', 'H'], ['И', 'I'], ['Ј', 'J'], ['К', 'K'], ['Л', 'L'],
    ['М', 'M'], ['Н', 'N'], ['О', 'O'], ['П', 'P'], ['Р', 'R'],
    ['С', 'S'], ['Ш', 'Š'], ['Т', 'T'], ['У', 'U'], ['В', 'V'],
    ['З', 'Z'], ['Ж', 'Ž'],
  ]
  let result = text
  for (const [cyr, lat] of CYR_TO_LAT_MAP) {
    result = result.split(cyr).join(lat)
  }
  return result
}

// Vraća verziju teksta za zadano pismo
export function getScriptVersion(
  textLat: string,
  script: 'latinica' | 'cirilica' | 'easy',
): string {
  if (script === 'cirilica') return latToCyr(textLat)
  if (script === 'easy') return latToEasy(textLat)
  return textLat
}
