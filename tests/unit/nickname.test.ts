import { describe, expect, it } from 'vitest'
import { nicknameSchema } from '@/lib/validators/auth'
import { isValidNickname, normalizeNickname } from '@/lib/validators/nickname'

describe('nickname validation', () => {
  it.each([
    'Ana Marija Ivić',
    '@brzi_kucac!',
    'M.P.-96',
    `O'Konor`,
    'Mika, Pera',
  ])('accepts %s', (nickname) => {
    expect(isValidNickname(nickname)).toBe(true)
    expect(nicknameSchema.safeParse({ nickname }).success).toBe(true)
  })

  it('allows more than one separated space and normalizes whitespace runs', () => {
    expect(isValidNickname('Ana Marija Ivić')).toBe(true)
    expect(normalizeNickname('  Ana   Marija\tIvić  ')).toBe('Ana Marija Ivić')
  })

  it.each([
    'ab',
    '1234567890123456',
    '!!!',
    'ime/putanja',
    'ime?upit',
    'ime#fragment',
    'ime%20',
  ])('rejects %s', (nickname) => {
    expect(isValidNickname(nickname)).toBe(false)
    expect(nicknameSchema.safeParse({ nickname }).success).toBe(false)
  })
})
