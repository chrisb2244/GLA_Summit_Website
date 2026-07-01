import { LogoImg, UnexpectedPresentationEmail } from './emailComponents';
import { submissionsForYear } from '@/app/configConstants';

/**
 * Emails sent to presenters when a submission reaches an outcome (accept /
 * decline). Both the vote-driven trigger and an organizer-forced early
 * conclusion converge on /api/submission-outcome, which sends these.
 *
 * The human-facing copy lives in the ACCEPTED_COPY / REJECTED_COPY blocks below
 * so it is easy to review and adjust without touching the HTML scaffolding. Keep
 * the plain-text (`*Plain`) variants in sync with the HTML lines.
 *
 */

export const ACCEPTED_EMAIL_SUBJECT = `GLA Summit ${submissionsForYear}: Your presentation has been accepted`;
export const REJECTED_EMAIL_SUBJECT = `GLA Summit ${submissionsForYear}: Your presentation has been declined`;

const ACCEPTED_COPY = {
  heading: 'Congratulations!',
  lines: [
    `We're delighted to let you know that your presentation for GLA Summit ${submissionsForYear} has been accepted.`,
    'The organizers will follow up with scheduling details, including your timeslot, closer to the event. There is nothing you need to do right now.',
    'Thank you for being part of the GLA Summit — we look forward to your session!'
  ]
} as const;

const REJECTED_COPY = {
  heading: 'Thank you for your submission',
  lines: [
    `Thank you for submitting a presentation for GLA Summit ${submissionsForYear}. After review, we're sorry to say that it has not been selected for this year's programme.`,
    'We received many strong submissions and unfortunately cannot accommodate them all. This is not a reflection on the value of your work, and we warmly encourage you to submit again in future years.',
    'Thank you for your interest in the GLA Summit and for being part of the community.'
  ]
} as const;

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const greetingHtml = (recipientName: string) => {
  const name = recipientName.trim();
  if (name.length === 0) {
    return '';
  }
  return `<p style="font-size:14px;line-height:24px;margin:16px 0">Dear ${escapeHtml(name)},</p>`;
};

const paragraphHtml = (text: string) =>
  `<p style="font-size:14px;line-height:24px;margin:16px 0">${escapeHtml(text)}</p>`;

/** Shared HTML scaffolding so both outcomes render identically apart from copy. */
const buildOutcomeEmail = (
  recipientName: string,
  title: string,
  heading: string,
  lines: readonly string[]
) => {
  const escapedTitle = escapeHtml(title);
  const body = `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <html lang="en">
    <head></head>
    <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">${escapeHtml(heading)}</div>

    <body style="background-color:#fff;font-family:Roboto,sans-serif">
      <table align="center" width="100%" role="presentation" cellSpacing="0" cellPadding="0" border="0" style="max-width:37.5em;background-color:#fff;border:1px solid #eee;border-radius:5px;box-shadow:0 5px 10px rgba(20,50,70,.2);margin-top:20px;width:360px;margin:0 auto;padding:68px 0 130px">
        <tbody>
          <tr style="width:100%">
            <td>${LogoImg}
              <h1 style="color:#444;font-size:32px;font-weight:700;text-align:center">GLA Summit ${submissionsForYear}</h1>
              <table align="center" width="100%" role="presentation" cellSpacing="0" cellPadding="0" border="0" style="max-width:37.5em;width:324px">
                <tbody>
                  <tr style="width:100%">
                    <td>
                      ${greetingHtml(recipientName)}
                      <h2 style="color:#444;font-size:20px;font-weight:700;margin:16px 0">${escapeHtml(heading)}</h2>
                      <p style="font-size:14px;line-height:24px;margin:16px 0;font-style:italic">Presentation: ${escapedTitle}</p>
                      ${lines.map(paragraphHtml).join('\n                      ')}
                      <p style="font-size:14px;line-height:24px;margin:24px 0 0">From the GLA Summit Organizers</p>
                    </td>
                  </tr>
                </tbody>
              </table>
              ${UnexpectedPresentationEmail}
            </td>
          </tr>
        </tbody>
      </table>
    </body>
  </html>
  `;

  const greetingPlain =
    recipientName.trim().length > 0 ? `Dear ${recipientName.trim()},\r\n\r\n` : '';
  const bodyPlain = `${greetingPlain}${heading}\r\n\r\nPresentation: ${title}\r\n\r\n${lines.join(
    '\r\n\r\n'
  )}\r\n\r\nFrom the GLA Summit Organizers`;

  return { body, bodyPlain };
};

export const AcceptedPresentationEmailFn = ({
  title,
  recipientName
}: {
  title: string;
  recipientName: string;
}) =>
  buildOutcomeEmail(
    recipientName,
    title,
    ACCEPTED_COPY.heading,
    ACCEPTED_COPY.lines
  );

export const RejectedPresentationEmailFn = ({
  title,
  recipientName
}: {
  title: string;
  recipientName: string;
}) =>
  buildOutcomeEmail(
    recipientName,
    title,
    REJECTED_COPY.heading,
    REJECTED_COPY.lines
  );
