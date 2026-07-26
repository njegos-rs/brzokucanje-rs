import { z } from 'zod'

// Admin login — zadržan za admin pristup
export const loginSchema = z.object({
  email: z.string().email('Unesite ispravnu email adresu'),
  password: z.string().min(1, 'Unesite lozinku'),
})

// Nickname validacija — za anonimne korisnike
export const nicknameSchema = z.object({
  nickname: z
    .string()
    .min(3, 'Ime mora imati najmanje 3 karaktera')
    .max(20, 'Ime može imati najviše 20 karaktera')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Ime može sadržati samo slova, brojeve i _',
    ),
})

export type LoginInput = z.infer<typeof loginSchema>
export type NicknameInput = z.infer<typeof nicknameSchema>
