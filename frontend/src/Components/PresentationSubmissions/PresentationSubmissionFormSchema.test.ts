import { describe, it, expect } from 'vitest';
import { PresentationSubmissionFormSchema } from './PresentationSubmissionFormSchema';

const baseValidInput = {
  'submitter.firstName': 'Alice',
  'submitter.lastName': 'Smith',
  'submitter.email': 'alice@example.com',
  submitIntent: 'submit',
  speakerAgreement: 'on',
  title: 'My Presentation',
  abstract: 'A'.repeat(150),
  learningPoints: 'Key points'.repeat(10),
  presentationType: 'full length'
};

describe('PresentationSubmissionFormSchema', () => {
  it('parses a valid submission', () => {
    const result = PresentationSubmissionFormSchema.safeParse(baseValidInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('My Presentation');
      expect(result.data.submitIntent).toBe('submit');
      expect(result.data.speakerAgreement).toBe(true);
      expect(result.data.skipDuplicateCheck).toBe(false);
      expect(result.data.otherPresenters).toEqual([]);
    }
  });

  it('defaults missing submitIntent to submit', () => {
    const input = { ...baseValidInput };
    const { submitIntent: _, ...withoutSubmitIntent } = input;
    const result =
      PresentationSubmissionFormSchema.safeParse(withoutSubmitIntent);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.submitIntent).toBe('submit');
    }
  });

  it('parses submitIntent=saveDraft when present', () => {
    const input = { ...baseValidInput, submitIntent: 'saveDraft' };
    const result = PresentationSubmissionFormSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.submitIntent).toBe('saveDraft');
    }
  });

  it('treats missing speakerAgreement as false', () => {
    const input = { ...baseValidInput };
    const { speakerAgreement: _, ...withoutAgreement } = input;
    const result = PresentationSubmissionFormSchema.safeParse(withoutAgreement);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['speakerAgreement']);
    }
  });

  it('parses skipDuplicateCheck=true when present', () => {
    const input = { ...baseValidInput, skipDuplicateCheck: 'true' };
    const result = PresentationSubmissionFormSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skipDuplicateCheck).toBe(true);
    }
  });

  it('collects co-presenter emails from indexed keys', () => {
    const input = {
      ...baseValidInput,
      'otherPresenters.0.email': 'bob@example.com',
      'otherPresenters.1.email': 'carol@example.com'
    };
    const result = PresentationSubmissionFormSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.otherPresenters).toEqual([
        'bob@example.com',
        'carol@example.com'
      ]);
    }
  });

  it('fails when a co-presenter email is invalid', () => {
    const input = {
      ...baseValidInput,
      'otherPresenters.0.email': 'not-an-email'
    };
    const result = PresentationSubmissionFormSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('normalises co-presenter emails to lowercase', () => {
    const input = {
      ...baseValidInput,
      'otherPresenters.0.email': 'Bob@Example.COM',
      'otherPresenters.1.email': 'CAROL@EXAMPLE.COM'
    };
    const result = PresentationSubmissionFormSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.otherPresenters).toEqual([
        'bob@example.com',
        'carol@example.com'
      ]);
    }
  });

  it('normalises the submitter email to lowercase', () => {
    const input = {
      ...baseValidInput,
      'submitter.email': 'Alice@Example.COM'
    };
    const result = PresentationSubmissionFormSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.submitter.email).toBe('alice@example.com');
    }
  });

  it('strips an unknown extra key', () => {
    const input = { ...baseValidInput, unexpectedField: 'not-an-email' };
    const result = PresentationSubmissionFormSchema.safeParse(input);
    expect(result.success).toBe(true); // The parser is designed to always succeed, but also strips unknown keys
    if (result.success) {
      expect(result.data).not.toHaveProperty('unexpectedField');
    }
  });
});
