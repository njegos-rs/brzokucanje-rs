import { z } from 'zod'

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Korisničko ime mora imati najmanje 3 karaktera')
      .max(20, 'Korisničko ime može imati najviše 20 karaktera')
      .regex(
        /^[a-zA-Z0-9_\-\.]+$/,
        'Korisničko ime može sadržati samo slova, brojeve, _, - i .',
      ),
    email: z.string().email('Unesite ispravnu email adresu'),
    password: z
      .string()
      .min(8, 'Lozinka mora imati najmanje 8 karaktera')
      .max(72, 'Lozinka može imati najviše 72 karaktera'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Lozinke se ne poklapaju',
    path: ['confirmPassword'],
  })

export const loginSchema = z.object({
  email: z.string().email('Unesite ispravnu email adresu'),
  password: z.string().min(1, 'Unesite lozinku'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Unesite ispravnu email adresu'),
})

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Lozinka mora imati najmanje 8 karaktera')
      .max(72, 'Lozinka može imati najviše 72 karaktera'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Lozinke se ne poklapaju',
    path: ['confirmPassword'],
  })

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
