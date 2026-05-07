import { describe, it, expect } from 'vitest'
import { latToCyr, latToEasy, cyrToLat, getScriptVersion } from '@/lib/transliteration'

describe('latToCyr', () => {
  it('konvertuje digrafe ispravno', () => {
    expect(latToCyr('nj')).toBe('њ')
    expect(latToCyr('lj')).toBe('љ')
    expect(latToCyr('dž')).toBe('џ')
  })

  it('konvertuje specijalna slova', () => {
    expect(latToCyr('č')).toBe('ч')
    expect(latToCyr('ć')).toBe('ћ')
    expect(latToCyr('š')).toBe('ш')
    expect(latToCyr('ž')).toBe('ж')
    expect(latToCyr('đ')).toBe('ђ')
  })

  it('konvertuje celu rečenicu', () => {
    expect(latToCyr('Lijepa naša domovino')).toBe('Лијепа наша домовино')
  })

  it('čuva digrafe u rečima (ljubav → љубав)', () => {
    expect(latToCyr('ljubav')).toBe('љубав')
    expect(latToCyr('njega')).toBe('њега')
  })

  it('konvertuje velika slova digrafa', () => {
    expect(latToCyr('Ljubav')).toBe('Љубав')
    expect(latToCyr('Njega')).toBe('Њега')
  })

  it('ne menja brojeve i interpunkciju', () => {
    expect(latToCyr('123, test!')).toBe('123, тест!')
  })
})

describe('latToEasy', () => {
  it('uklanja kvačice sa č, ć → c', () => {
    expect(latToEasy('č')).toBe('c')
    expect(latToEasy('ć')).toBe('c')
  })

  it('uklanja kvačice sa š → s, ž → z', () => {
    expect(latToEasy('š')).toBe('s')
    expect(latToEasy('ž')).toBe('z')
  })

  it('konvertuje đ → dj', () => {
    expect(latToEasy('đ')).toBe('dj')
    expect(latToEasy('Đ')).toBe('Dj')
  })

  it('konvertuje rečenicu', () => {
    expect(latToEasy('Šta radiš?')).toBe('Sta radis?')
  })

  it('ne menja slova bez kvačica', () => {
    expect(latToEasy('abc')).toBe('abc')
  })
})

describe('cyrToLat', () => {
  it('konvertuje ćirilicu u latinicu', () => {
    expect(cyrToLat('а')).toBe('a')
    expect(cyrToLat('ш')).toBe('š')
    expect(cyrToLat('ж')).toBe('ž')
  })

  it('konvertuje digrafe (љ → lj, њ → nj)', () => {
    expect(cyrToLat('љубав')).toBe('ljubav')
    expect(cyrToLat('њега')).toBe('njega')
  })

  it('round-trip latinica → ćirilica → latinica', () => {
    const original = 'ljubav prema njoj'
    expect(cyrToLat(latToCyr(original))).toBe(original)
  })
})

describe('getScriptVersion', () => {
  it('vraća latinicu nepromenjenu', () => {
    expect(getScriptVersion('test', 'latinica')).toBe('test')
  })

  it('vraća ćirilicu', () => {
    expect(getScriptVersion('test', 'cirilica')).toBe('тест')
  })

  it('vraća easy verziju', () => {
    expect(getScriptVersion('šta', 'easy')).toBe('sta')
  })
})
