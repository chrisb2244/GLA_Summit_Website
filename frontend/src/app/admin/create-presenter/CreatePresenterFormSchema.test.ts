import { describe, expect, it } from 'vitest';
import z from 'zod/v4';
import {
  CreatePresenterFormParser,
  CreatePresenterFormSchema,
  MAX_PROFILE_IMAGE_BYTES,
  validateProfileImage
} from './CreatePresenterFormSchema';

const validRaw = () => ({
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'Ada.Lovelace@Example.com',
  bio: 'Writes programs.',
  title: 'Analytical Engines',
  abstract: 'A'.repeat(120),
  learningPoints: 'How engines analyse.',
  presentationType: 'full length'
});

describe('CreatePresenterFormParser', () => {
  it('lowercases and trims the email so lookups are case-insensitive', () => {
    const parsed = CreatePresenterFormParser.parse({
      ...validRaw(),
      email: '  Ada.Lovelace@Example.com  '
    });
    expect(parsed.email).toEqual('ada.lovelace@example.com');
  });

  it('coerces the File entry for the profile picture to an empty string', () => {
    // The image never reaches the zod schema — it is validated separately —
    // so the parser must not choke on a File appearing in the FormData.
    const parsed = CreatePresenterFormParser.parse({
      ...validRaw(),
      profileImage: new File(['x'], 'x.png', { type: 'image/png' })
    });
    expect(parsed.title).toEqual('Analytical Engines');
  });

  it('defaults the presentation type when the field is absent', () => {
    const raw = validRaw();
    const { presentationType: _omitted, ...withoutType } = raw;
    const parsed = CreatePresenterFormParser.parse(withoutType);
    expect(parsed.presentationType).toEqual('full length');
  });

  it('preserves entered values so a failed submission can be re-rendered', () => {
    const parsed = CreatePresenterFormParser.parse({
      ...validRaw(),
      abstract: 'too short'
    });
    expect(parsed.abstract).toEqual('too short');
    expect(parsed.firstName).toEqual('Ada');
  });
});

describe('CreatePresenterFormSchema', () => {
  it('accepts a complete presenter and presentation', () => {
    const result = CreatePresenterFormSchema.safeParse(validRaw());
    expect(result.success).toBe(true);
  });

  it('accepts an empty bio and learning points', () => {
    const result = CreatePresenterFormSchema.safeParse({
      ...validRaw(),
      bio: '',
      learningPoints: ''
    });
    expect(result.success).toBe(true);
  });

  it.each([
    ['firstName', ''],
    ['lastName', ''],
    ['email', 'not-an-email'],
    ['title', ''],
    ['abstract', 'far too short']
  ])('rejects an invalid %s', (field, value) => {
    const result = CreatePresenterFormSchema.safeParse({
      ...validRaw(),
      [field]: value
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const tree = z.treeifyError(result.error);
      expect(
        tree.properties?.[field as keyof typeof tree.properties]
      ).toBeDefined();
    }
  });

  it('rejects a title longer than the presenter-facing form allows', () => {
    const result = CreatePresenterFormSchema.safeParse({
      ...validRaw(),
      title: 'T'.repeat(151)
    });
    expect(result.success).toBe(false);
  });

  it('rejects a presentation type that is not submittable', () => {
    const result = CreatePresenterFormSchema.safeParse({
      ...validRaw(),
      presentationType: 'keynote'
    });
    expect(result.success).toBe(false);
  });
});

describe('validateProfileImage', () => {
  it('treats a missing entry as no image', () => {
    expect(validateProfileImage(null)).toEqual({ valid: true, file: null });
  });

  it('treats the empty file of an untouched input as no image', () => {
    const empty = new File([], '', { type: 'application/octet-stream' });
    expect(validateProfileImage(empty)).toEqual({ valid: true, file: null });
  });

  it('accepts a supported image type', () => {
    const file = new File(['abc'], 'face.png', { type: 'image/png' });
    expect(validateProfileImage(file)).toEqual({ valid: true, file });
  });

  it('rejects a non-image upload', () => {
    const file = new File(['abc'], 'talk.pdf', { type: 'application/pdf' });
    const result = validateProfileImage(file);
    expect(result.valid).toBe(false);
  });

  it('rejects an image over the size limit', () => {
    const file = new File(['abc'], 'huge.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', {
      value: MAX_PROFILE_IMAGE_BYTES + 1
    });
    const result = validateProfileImage(file);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.message).toContain('5MB');
    }
  });
});
