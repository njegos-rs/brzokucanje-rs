export const NICKNAME_MIN_LENGTH = 3
export const NICKNAME_MAX_LENGTH = 15
export const NICKNAME_PATTERN = /^(?=.*[\p{L}\p{N}])[\p{L}\p{N} .,!_@()\x27\u2019-]+$/u
export const NICKNAME_FORMAT_MESSAGE = `Dozvoljeni su slova, brojevi, razmaci i znakovi . , ! - _ @ ' ( )`

export function normalizeNickname(value: string): string {
  return value.trim().replace(/\s+/gu, ' ')
}

export function isValidNickname(value: string): boolean {
  const normalized = normalizeNickname(value)
  return normalized.length >= NICKNAME_MIN_LENGTH && normalized.length <= NICKNAME_MAX_LENGTH && NICKNAME_PATTERN.test(normalized)
}
