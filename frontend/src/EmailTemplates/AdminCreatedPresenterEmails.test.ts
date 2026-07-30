import { describe, expect, it } from 'vitest';
import { AdminCreatedAccountEmailFn } from './AdminCreatedAccountEmail';
import {
  OnBehalfSubmissionEmailFn,
  OrganizerSubmissionNotificationEmailFn
} from './FormSubmissionEmail';

const formData = {
  title: 'Engines Of Analysis',
  abstract: 'An abstract about engines.',
  learningPoints: 'How engines analyse.',
  presentationType: '15 minutes',
  otherPresenters: [],
  submitter: {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com'
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe('AdminCreatedAccountEmailFn', () => {
  const { body, bodyPlain } = AdminCreatedAccountEmailFn(
    'Ada Lovelace',
    'Chris Organizer',
    '654321',
    '/auth/validateLogin?email=ada%40example.com'
  );

  it('names the organizer who created the account', () => {
    expect(body).toContain('Chris Organizer');
    expect(bodyPlain).toContain('Chris Organizer');
  });

  it('explains why the account exists rather than assuming the reader asked', () => {
    expect(body).toContain('has created an account for you');
    expect(body).toContain('on your behalf');
  });

  it('carries both ways to verify: the link and the passcode', () => {
    expect(body).toContain(
      'https://glasummit.org/auth/validateLogin?email=ada%40example.com'
    );
    expect(body).toContain('654321');
    expect(bodyPlain).toContain('654321');
  });

  it('offers a route to reject the account', () => {
    expect(body).toContain('web@glasummit.org');
    expect(bodyPlain).toContain('we will remove the account');
  });

  it('escapes HTML in caller-supplied names', () => {
    const { body: escaped } = AdminCreatedAccountEmailFn(
      '<script>alert(1)</script>',
      'Chris & Co',
      '111111',
      '/auth/validateLogin'
    );
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
    expect(escaped).toContain('Chris &amp; Co');
  });
});

describe('OnBehalfSubmissionEmailFn', () => {
  const { body, bodyPlain } = OnBehalfSubmissionEmailFn(
    formData,
    'Ada Lovelace',
    'Chris Organizer'
  );

  it('makes clear the recipient did not submit it themselves', () => {
    expect(body).toContain('on your behalf');
    expect(body).toContain('Chris Organizer');
    expect(bodyPlain).toContain('on your behalf');
  });

  it('still reports the submitted details, like the normal receipt', () => {
    expect(body).toContain('Engines Of Analysis');
    expect(body).toContain('An abstract about engines.');
    expect(body).toContain('How engines analyse.');
    expect(body).toContain('Short Length (15 minutes)');
  });

  it('labels the recipient as the presenter and names who submitted', () => {
    expect(body).toContain('Presenter Name');
    expect(body).toContain('Presenter Email');
    expect(body).toContain('Submitted by');
    expect(body).toContain('ada@example.com');
  });

  it('says the presentation is now under review', () => {
    expect(body).toContain('for review');
    expect(bodyPlain).toContain('for review');
  });

  it('invites a correction if the details are wrong', () => {
    expect(body).toContain('web@glasummit.org');
    expect(bodyPlain).toContain('If any of these details are wrong');
  });

  it('escapes HTML in the submitted values', () => {
    const { body: escaped } = OnBehalfSubmissionEmailFn(
      { ...formData, title: '<b>bold</b>' },
      'Ada Lovelace',
      'Chris Organizer'
    );
    expect(escaped).not.toContain('<b>bold</b>');
    expect(escaped).toContain('&lt;b&gt;bold&lt;/b&gt;');
  });
});

describe('OrganizerSubmissionNotificationEmailFn on-behalf line', () => {
  it('names the submitting organizer when the submission was made for someone', () => {
    const { body, bodyPlain } = OrganizerSubmissionNotificationEmailFn(
      'Engines Of Analysis',
      '15 minutes',
      'Ada Lovelace',
      'ada@example.com',
      'Chris Organizer'
    );
    expect(body).toContain('Submitted by');
    expect(body).toContain('Chris Organizer (on behalf of the presenter)');
    expect(bodyPlain).toContain(
      'Chris Organizer (on behalf of the presenter)'
    );
  });

  it('is unchanged for an ordinary self-submission', () => {
    const { body, bodyPlain } = OrganizerSubmissionNotificationEmailFn(
      'Engines Of Analysis',
      '15 minutes',
      'Ada Lovelace',
      'ada@example.com'
    );
    expect(body).not.toContain('Submitted by');
    expect(bodyPlain).not.toContain('on behalf of the presenter');
  });
});
