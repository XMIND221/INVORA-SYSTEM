import { z } from 'zod';
import { USER_ROLES } from '@/lib/constants';

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const signUpSchema = signInSchema.extend({
  fullName: z.string().min(2).optional(),
  primaryRole: z.enum(USER_ROLES).default('participant'),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
