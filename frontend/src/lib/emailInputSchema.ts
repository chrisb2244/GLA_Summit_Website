import { z } from 'zod';

/**
 * A user-typed email address, normalised to its canonical, lower-cased form.
 *
 * The trim has to run before the format check (hence `.pipe` rather than a bare
 * `z.email()`, which validates first): mobile autofill often appends a trailing
 * space.
 */
export const EmailInputSchema = z
  .string()
  .trim()
  .min(1, 'Required')
  .pipe(z.email("This email doesn't match the expected pattern"))
  .transform((s) => s.toLowerCase());
