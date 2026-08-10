import { z } from 'zod'
import {
  NICKNAME_FORMAT_MESSAGE,
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  NICKNAME_PATTERN,
  normalizeNickname,
} from '@/lib/validators/nickname'

// Admin login — zadržan za admin pristup
export const loginSchema = z.object({
  email: z.string().email('Unesite ispravnu email adresu'),
  password: z.string().min(1, 'Unesite lozinku'),
})

// Nickname validacija — za anonimne korisnike
export const nicknameSchema = z.object({
  nickname: z
    .string()
    .refine((value) => normalizeNickname(value).length >= NICKNAME_MIN_LENGTH, 'Ime mora imati najmanje 3 karaktera')
    .refine((value) => normalizeNickname(value).length <= NICKNAME_MAX_LENGTH, 'Ime može imati najviše 15 karaktera')
    .refine((value) => NICKNAME_PATTERN.test(normalizeNickname(value)), NICKNAME_FORMAT_MESSAGE),
})

export type LoginInput = z.infer<typeof loginSchema>
export type NicknameInput = z.infer<typeof nicknameSchema>
