import { describe, test, expect } from 'vitest';
import { PresentationSubmissionFormSchema } from './PresentationSubmissionFormSchema';

describe('PresentationSubmissionFormSchema', () => {
  const basicData = {
    title: 'My Presentation',
    abstract: 'This is a presentation'.repeat(10),
    learningPoints: 'You will learn things'.repeat(5),
    presentationType: 'full length',
    'submitter.firstName': 'Test',
    'submitter.lastName': 'User',
    'submitter.email': 'test.email@blah.com',
    isFinal: 'true',
    otherPresenters: []
  };

  test('parses valid simple data', () => {
    const result = PresentationSubmissionFormSchema.safeParse(basicData);
    expect(result.success).toBe(true);
    expect(result.data?.otherPresenters).toEqual([]);
    expect(result.data?.submitter).toEqual({
      firstName: 'Test',
      lastName: 'User',
      email: 'test.email@blah.com'
    });
  });

  test('parses valid data with other presenters', () => {
    const data = {
      ...basicData,
      'otherPresenters.0.email': 'other.one@test.com',
      'otherPresenters.1.email': 'other.two@test.com'
    };

    const result = PresentationSubmissionFormSchema.safeParse(data);
    expect(result.success).toBe(true);
    expect(result.data?.otherPresenters).toEqual([
      'other.one@test.com',
      'other.two@test.com'
    ]);
  });

  test('parses valid data with other presenters as a list', () => {
    const data = {
      ...basicData,
      otherPresentersList: 'other.one@test.com;other.two@test.com'
    };
    const result = PresentationSubmissionFormSchema.safeParse(data);
    expect(result.success).toBe(true);
    expect(result.data?.otherPresenters).toEqual([
      'other.one@test.com',
      'other.two@test.com'
    ]);
  });

  test('parses valid data with other presenters as a list and entries', () => {
    const data = {
      ...basicData,
      otherPresentersList: 'other.one@test.com;other.two@test.com',
      'otherPresenters.0.email': 'other.three@test.com',
      'otherPresenters.1.email': 'other.four@test.com'
    };

    const result = PresentationSubmissionFormSchema.safeParse(data);
    expect(result.success).toBe(true);
    const otherPresentersAsSet = new Set(result.data?.otherPresenters);
    expect(otherPresentersAsSet.size).toBe(4);
    const expectedSet = new Set([
      'other.one@test.com',
      'other.two@test.com',
      'other.three@test.com',
      'other.four@test.com'
    ]);
    expect(otherPresentersAsSet).toEqual(expectedSet);
  });

  test('fails to parse a list with invalid emails', () => {
    const data = {
      ...basicData,
      otherPresentersList: 'blah;other@email.com'
    };

    const result = PresentationSubmissionFormSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.errors.length).toBe(1);
    const error = result.error?.errors[0];
    expect(error?.message).toBe('Invalid email');
    expect(error?.path).toEqual(['otherPresentersList']);
  });
});
