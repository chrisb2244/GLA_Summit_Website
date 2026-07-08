import { describe, expect, it } from 'vitest';
import {
  ACCEPTED_EMAIL_SUBJECT,
  AcceptedPresentationEmailFn,
  REJECTED_EMAIL_SUBJECT,
  RejectedPresentationEmailFn
} from './PresentationOutcomeEmail';

describe('outcome email templates', () => {
  const title = 'Reactive LabVIEW Patterns';

  it('accepted email includes the title, recipient name and accept wording', () => {
    const { body, bodyPlain } = AcceptedPresentationEmailFn({
      title,
      recipientName: 'Ada'
    });
    for (const content of [body, bodyPlain]) {
      expect(content).toContain(title);
      expect(content).toContain('Ada');
      expect(content).toContain('accepted');
    }
    expect(ACCEPTED_EMAIL_SUBJECT).toContain('accepted');
  });

  it('rejected email includes the title and does not congratulate', () => {
    const { body, bodyPlain } = RejectedPresentationEmailFn({
      title,
      recipientName: 'Grace'
    });
    for (const content of [body, bodyPlain]) {
      expect(content).toContain(title);
      expect(content).toContain('Grace');
      expect(content).not.toContain('Congratulations');
    }
    expect(REJECTED_EMAIL_SUBJECT).not.toContain('accepted');
  });

  it('omits the greeting when no recipient name is given', () => {
    const { body, bodyPlain } = AcceptedPresentationEmailFn({
      title,
      recipientName: ''
    });
    expect(body).not.toContain('Dear ');
    expect(bodyPlain).not.toContain('Dear ');
  });

  it('escapes HTML in the title', () => {
    const { body } = AcceptedPresentationEmailFn({
      title: '<script>alert(1)</script>',
      recipientName: 'Ada'
    });
    expect(body).not.toContain('<script>');
    expect(body).toContain('&lt;script&gt;');
  });
});
