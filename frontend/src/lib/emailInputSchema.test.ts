import { describe, expect, it } from 'vitest';

import { EmailInputSchema } from './emailInputSchema';

// EmailInputSchema backs the sign-in, registration and add-an-address forms.
describe('EmailInputSchema', () => {
  // Mobile autofill commonly appends a single trailing space. That must be
  // trimmed before the format check, not rejected as an invalid address
  it('accepts an otherwise valid email with a single trailing space', () => {
    const result = EmailInputSchema.safeParse('user@example.com ');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('user@example.com');
    }
  });

  it('trims and lowercases a mixed-case address with a trailing space', () => {
    const result = EmailInputSchema.safeParse('Alice@Example.COM ');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('alice@example.com');
    }
  });

  it('reports only "Required" for whitespace-only input', () => {
    const result = EmailInputSchema.safeParse(' ');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toEqual(['Required']);
    }
  });

  it('rejects a malformed address even after trimming', () => {
    const result = EmailInputSchema.safeParse('not-an-email ');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "This email doesn't match the expected pattern"
      );
    }
  });
});
