import * as z from 'zod';

// Custom email validation that allows formats like admin@naastwinnodes
// (without TLD) which the Twin Node accepts
const emailValidation = z
  .string()
  .min(1, 'Email is required')
  .refine(
    (val) => {
      // Allow standard email format or node-specific format (e.g., admin@naastwinnodes)
      return (
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || // Standard email with TLD
        /^[^\s@]+@[^\s@]+$/.test(val) // Node format without TLD
      );
    },
    { message: 'Invalid email address' }
  );

export const loginSchema = z.object({
  email: emailValidation,
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
