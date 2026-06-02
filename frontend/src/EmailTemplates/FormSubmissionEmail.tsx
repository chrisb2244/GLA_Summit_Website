import { EmailProps } from '@/Components/Form/Person';
import type { PresentationSubmissionFormData } from '@/Components/PresentationSubmissions/PresentationSubmissionFormSchema';
import { LogoImg, UnexpectedPresentationEmail } from './emailComponents';
import { PresentationType } from '@/lib/databaseModels';
import {
  submissionsForYear,
  COPRESENTER_INVITE_WORKFLOW
} from '@/app/configConstants';

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

type SubmissionFormData = Omit<
  PresentationSubmissionFormData,
  'otherPresenters'
> & {
  otherPresenters: EmailProps[];
};

const DearPerson = (nameString: string) => {
  if (nameString.trim().length === 0) {
    return '';
  }
  return `<p style="font-size:14px;line-height:24px;margin:16px 0">Dear ${escapeHtml(nameString)},</p>`;
};

const OtherPresenterRowsFn = (presenters: EmailProps[], tdStyle: string) => {
  const nRows = presenters.length;
  if (nRows === 0) {
    return `<tr>
    <td style="padding:8px 8px 8px 0;vertical-align:middle;font-size:10px;text-transform:uppercase;width:100px" rowSpan="${nRows}">Other Presenters</td>
    <td style="${tdStyle}">None</td>
    </tr>
    `;
  }
  const otherRows = presenters.slice(1);
  return `
      <tr>
        <td style="padding:8px 8px 8px 0;vertical-align:middle;font-size:10px;text-transform:uppercase;width:100px" rowSpan="${nRows}">Other Presenters</td>
        <td style="${tdStyle}">${escapeHtml(presenters[0].email)}</td>
      </tr>
      ${otherRows.map(({ email }) => {
        return `<tr>
            <td style="${tdStyle}">${escapeHtml(email)}</td>
          </tr>
          `;
      })}
    `;
};

const PresentationTypeToString = (presentationType: PresentationType) => {
  let typeText = '';
  switch (presentationType) {
    case '7x7': {
      typeText = '7x7 (7 minutes)';
      break;
    }
    case '15 minutes': {
      typeText = 'Short Length (15 minutes)';
      break;
    }
    case 'full length': {
      typeText = 'Full Length (45 minutes)';
      break;
    }
    case 'panel': {
      typeText = 'Panel Discussion';
      break;
    }
  }
  return typeText;
};

export const FormSubmissionEmailFn = (
  formData: SubmissionFormData,
  nameString: string
) => {
  const {
    title,
    abstract,
    presentationType,
    learningPoints,
    otherPresenters,
    submitter: { firstName, lastName, email }
  } = formData;
  const submitterName = escapeHtml(`${firstName} ${lastName}`);
  const escapedTitle = escapeHtml(title);
  const escapedEmail = escapeHtml(email);

  const typeText = PresentationTypeToString(presentationType);
  const parsedAbstract = escapeHtml(abstract); // Consider handling line-end chars
  const parsedLearningPoints = escapeHtml(learningPoints); // Consider handling line-end chars
  const tdStyle = 'padding:8px 0px;vertical-align:middle;word-wrap:break-word';
  const labelStyle =
    'padding:8px 8px 8px 0;vertical-align:middle;font-size:10px;text-transform:uppercase;width:100px';

  return {
    body: `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <html lang="en">
    <head></head>
    <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">GLA Summit - Thank you for submitting a presentation</div>

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
                      ${DearPerson(nameString)}
                      <p style="font-size:14px;line-height:24px;margin:16px 0">Thank you for submitting a presentation for GLA Summit ${submissionsForYear}!</p>
                      <p style="font-size:14px;line-height:24px;margin:16px 0">The data that was submitted is shown below.</p>
                      <table style="border-spacing:0px;border-collapse:collapse;color:#444;width:100%;table-layout:fixed">
                        <tr>
                          <td style="${labelStyle}">Type</td>
                          <td style="${tdStyle}">${typeText}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#aaa"></tr>
                        <tr>
                          <td style="${labelStyle}">Title</td>
                          <td style="${tdStyle}">${escapedTitle}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#ddd"></tr>
                        <tr>
                          <td style="${labelStyle}">Abstract</td>
                          <td style="${tdStyle}">${parsedAbstract}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#ddd"></tr>
                        <tr>
                          <td style="${labelStyle}">Learning points</td>
                          <td style="${tdStyle}">${parsedLearningPoints}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#aaa"></tr>
                        <tr>
                          <td style="${labelStyle}">Submitter Name</td>
                          <td style="${tdStyle}">${submitterName}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#ddd"></tr>
                        <tr>
                          <td style="${labelStyle}">Submitter Email</td>
                          <td style="${tdStyle}">${escapedEmail}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#aaa"></tr>
                        ${OtherPresenterRowsFn(otherPresenters, tdStyle)}
                      </table>
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
  `,
    bodyPlain: `Dear ${nameString},\r\n
    Thank you for submitting a presentation titled "${title}".\r\n
    More details can be found in an HTML copy of this email - if you would like more detail in our plain-text emails, please contact web@glasummit.org\r\n
    From the GLA Summit Organizers`
  };
};

export const NewCopresenterEmailFn = (
  formData: SubmissionFormData,
  nameString: string,
  otpCode: string,
  validateLoginUrl: string
) => {
  const {
    title,
    abstract,
    presentationType,
    learningPoints,
    otherPresenters,
    submitter: { firstName, lastName, email }
  } = formData;
  const submitterName = escapeHtml(`${firstName} ${lastName}`);
  const escapedTitle = escapeHtml(title);
  const escapedEmail = escapeHtml(email);
  const escapedOtp = escapeHtml(otpCode);
  const escapedValidateUrl = escapeHtml(`https://glasummit.org${validateLoginUrl}`);

  const typeText = PresentationTypeToString(presentationType);
  const parsedAbstract = escapeHtml(abstract);
  const parsedLearningPoints = escapeHtml(learningPoints);
  const tdStyle = 'padding:8px 0px;vertical-align:middle;word-wrap:break-word';
  const labelStyle =
    'padding:8px 8px 8px 0;vertical-align:middle;font-size:10px;text-transform:uppercase;width:100px';

  // With the accept/decline workflow on, the verify-account link redirects to the
  // invite page, so the copy invites the recipient to respond. With it off, the
  // co-presenter is implicitly accepted and there is no invite page — the copy must
  // only ask them to verify their new account, not to "accept or decline".
  const introLine = COPRESENTER_INVITE_WORKFLOW
    ? `You have been invited as a co-presenter for a GLA Summit ${submissionsForYear} presentation!`
    : `You have been added as a co-presenter for a GLA Summit ${submissionsForYear} presentation!`;
  const verifyLine = COPRESENTER_INVITE_WORKFLOW
    ? 'An account has been created for you at <a href="https://glasummit.org" target="_blank" style="color:#a25bcd;text-decoration:underline">glasummit.org</a>. Click the link below to verify your account and accept or decline this invitation:'
    : 'An account has been created for you at <a href="https://glasummit.org" target="_blank" style="color:#a25bcd;text-decoration:underline">glasummit.org</a>. Click the link below to verify your account:';
  const ctaLabel = COPRESENTER_INVITE_WORKFLOW
    ? 'Verify account &amp; respond to invitation'
    : 'Verify your account';
  const verifyLinePlain = COPRESENTER_INVITE_WORKFLOW
    ? `To verify your account and respond to the invitation, visit: https://glasummit.org${validateLoginUrl}`
    : `To verify your account, visit: https://glasummit.org${validateLoginUrl}`;

  return {
    body: `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <html lang="en">
    <head></head>
    <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">GLA Summit - ${COPRESENTER_INVITE_WORKFLOW ? 'You have been invited as a co-presenter' : 'You have been added as a co-presenter'}</div>

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
                      ${DearPerson(nameString)}
                      <p style="font-size:14px;line-height:24px;margin:16px 0">${introLine}</p>
                      <p style="font-size:14px;line-height:24px;margin:16px 0">${verifyLine}</p>
                      <p style="font-size:14px;line-height:24px;margin:16px 0;text-align:center"><a href="${escapedValidateUrl}" target="_blank" style="background-color:#a25bcd;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block">${ctaLabel}</a></p>
                      <p style="font-size:12px;line-height:20px;margin:16px 0;color:#666">If the button doesn't work, visit <a href="https://glasummit.org/auth/validateLogin" target="_blank" style="color:#a25bcd;text-decoration:underline">glasummit.org/auth/validateLogin</a> and enter the verification code: <strong>${escapedOtp}</strong></p>
                      <p style="font-size:14px;line-height:24px;margin:16px 0">The presentation details are shown below.</p>
                      <table style="border-spacing:0px;border-collapse:collapse;color:#444;width:100%;table-layout:fixed">
                        <tr>
                          <td style="${labelStyle}">Type</td>
                          <td style="${tdStyle}">${typeText}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#aaa"></tr>
                        <tr>
                          <td style="${labelStyle}">Title</td>
                          <td style="${tdStyle}">${escapedTitle}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#ddd"></tr>
                        <tr>
                          <td style="${labelStyle}">Abstract</td>
                          <td style="${tdStyle}">${parsedAbstract}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#ddd"></tr>
                        <tr>
                          <td style="${labelStyle}">Learning points</td>
                          <td style="${tdStyle}">${parsedLearningPoints}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#aaa"></tr>
                        <tr>
                          <td style="${labelStyle}">Submitter Name</td>
                          <td style="${tdStyle}">${submitterName}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#ddd"></tr>
                        <tr>
                          <td style="${labelStyle}">Submitter Email</td>
                          <td style="${tdStyle}">${escapedEmail}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#aaa"></tr>
                        ${OtherPresenterRowsFn(otherPresenters, tdStyle)}
                      </table>
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
    `,
    bodyPlain: `Dear ${nameString},\r\n
    ${introLine}\r\n
    The presentation is titled "${title}".\r\n
    An account has been created for you at https://glasummit.org\r\n
    ${verifyLinePlain}\r\n
    If that link doesn't work, visit https://glasummit.org/auth/validateLogin and enter the verification code: ${otpCode}\r\n
    More details can be found in an HTML copy of this email - if you would like more detail in our plain-text emails, please contact web@glasummit.org\r\n
    From the GLA Summit Organizers`
  };
};

export const CopresenterInviteEmailFn = (
  formData: SubmissionFormData,
  nameString: string,
  inviteUrl: string
) => {
  const {
    title,
    abstract,
    presentationType,
    learningPoints,
    otherPresenters,
    submitter: { firstName, lastName, email }
  } = formData;
  const submitterName = escapeHtml(`${firstName} ${lastName}`);
  const escapedTitle = escapeHtml(title);
  const escapedEmail = escapeHtml(email);
  const escapedInviteUrl = escapeHtml(`https://glasummit.org${inviteUrl}`);

  const typeText = PresentationTypeToString(presentationType);
  const parsedAbstract = escapeHtml(abstract);
  const parsedLearningPoints = escapeHtml(learningPoints);
  const tdStyle = 'padding:8px 0px;vertical-align:middle;word-wrap:break-word';
  const labelStyle =
    'padding:8px 8px 8px 0;vertical-align:middle;font-size:10px;text-transform:uppercase;width:100px';

  return {
    body: `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <html lang="en">
    <head></head>
    <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">GLA Summit - Co-presenter invitation</div>

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
                      ${DearPerson(nameString)}
                      <p style="font-size:14px;line-height:24px;margin:16px 0">You have been invited as a co-presenter for a GLA Summit ${submissionsForYear} presentation. Please accept or decline using the link below:</p>
                      <p style="font-size:14px;line-height:24px;margin:16px 0;text-align:center"><a href="${escapedInviteUrl}" target="_blank" style="background-color:#a25bcd;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block">Accept or decline invitation</a></p>
                      <p style="font-size:12px;line-height:20px;margin:16px 0;color:#666">If the button doesn't work, copy this link into your browser: ${escapedInviteUrl}</p>
                      <p style="font-size:14px;line-height:24px;margin:16px 0">The presentation details are shown below.</p>
                      <table style="border-spacing:0px;border-collapse:collapse;color:#444;width:100%;table-layout:fixed">
                        <tr>
                          <td style="${labelStyle}">Type</td>
                          <td style="${tdStyle}">${typeText}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#aaa"></tr>
                        <tr>
                          <td style="${labelStyle}">Title</td>
                          <td style="${tdStyle}">${escapedTitle}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#ddd"></tr>
                        <tr>
                          <td style="${labelStyle}">Abstract</td>
                          <td style="${tdStyle}">${parsedAbstract}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#ddd"></tr>
                        <tr>
                          <td style="${labelStyle}">Learning points</td>
                          <td style="${tdStyle}">${parsedLearningPoints}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#aaa"></tr>
                        <tr>
                          <td style="${labelStyle}">Submitter Name</td>
                          <td style="${tdStyle}">${submitterName}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#ddd"></tr>
                        <tr>
                          <td style="${labelStyle}">Submitter Email</td>
                          <td style="${tdStyle}">${escapedEmail}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#aaa"></tr>
                        ${OtherPresenterRowsFn(otherPresenters, tdStyle)}
                      </table>
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
    `,
    bodyPlain: `Dear ${nameString},\r\n
    You have been invited as a co-presenter for a GLA Summit ${submissionsForYear} presentation titled "${title}".\r\n
    Please accept or decline the invitation at: https://glasummit.org${inviteUrl}\r\n
    More details can be found in an HTML copy of this email - if you would like more detail in our plain-text emails, please contact web@glasummit.org\r\n
    From the GLA Summit Organizers`
  };
};

export const OrganizerSubmissionNotificationEmailFn = (
  title: string,
  presentationType: PresentationType,
  submitterName: string,
  submitterEmail: string
) => {
  const escapedTitle = escapeHtml(title);
  const escapedSubmitterName = escapeHtml(submitterName);
  const escapedSubmitterEmail = escapeHtml(submitterEmail);
  const typeText = PresentationTypeToString(presentationType);
  const tdStyle = 'padding:8px 0px;vertical-align:middle;word-wrap:break-word';
  const labelStyle =
    'padding:8px 8px 8px 0;vertical-align:middle;font-size:10px;text-transform:uppercase;width:100px';

  return {
    body: `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <html lang="en">
    <head></head>
    <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">GLA Summit - New presentation submitted</div>

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
                      <p style="font-size:14px;line-height:24px;margin:16px 0">A new presentation has been submitted for GLA Summit ${submissionsForYear}.</p>
                      <table style="border-spacing:0px;border-collapse:collapse;color:#444;width:100%;table-layout:fixed">
                        <tr>
                          <td style="${labelStyle}">Type</td>
                          <td style="${tdStyle}">${typeText}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#aaa"></tr>
                        <tr>
                          <td style="${labelStyle}">Title</td>
                          <td style="${tdStyle}">${escapedTitle}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#ddd"></tr>
                        <tr>
                          <td style="${labelStyle}">Submitter Name</td>
                          <td style="${tdStyle}">${escapedSubmitterName}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#ddd"></tr>
                        <tr>
                          <td style="${labelStyle}">Submitter Email</td>
                          <td style="${tdStyle}">${escapedSubmitterEmail}</td>
                        </tr>
                      </table>
                      <p style="font-size:14px;line-height:24px;margin:16px 0">
                        <a href="https://glasummit.org/review-submissions" target="_blank" style="color:#a25bcd;text-decoration:underline">View all submissions</a>
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </body>
  </html>
    `,
    bodyPlain: `A new presentation has been submitted for GLA Summit ${submissionsForYear}.\r\n
    Title: "${title}"\r\n
    Type: ${typeText}\r\n
    Submitter: ${submitterName} (${submitterEmail})\r\n
    Review submissions at: https://glasummit.org/review-submissions\r\n
    From the GLA Summit website`
  };
};

export const RemovedCopresenterEmailFn = (
  formData: SubmissionFormData,
  nameString: string
) => {
  const {
    title,
    abstract,
    presentationType,
    learningPoints,
    submitter: { firstName, lastName, email }
  } = formData;
  const submitterName = escapeHtml(`${firstName} ${lastName}`);
  const escapedTitle = escapeHtml(title);
  const escapedEmail = escapeHtml(email);

  const typeText = PresentationTypeToString(presentationType);
  const parsedAbstract = escapeHtml(abstract); // Consider handling line-end chars
  const parsedLearningPoints = escapeHtml(learningPoints); // Consider handling line-end chars
  const tdStyle = 'padding:8px 0px;vertical-align:middle;word-wrap:break-word';
  const labelStyle =
    'padding:8px 8px 8px 0;vertical-align:middle;font-size:10px;text-transform:uppercase;width:100px';

  return {
    body: `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <html lang="en">
    <head></head>
    <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">GLA Summit - You have been added as a copresenter</div>

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
                      ${DearPerson(nameString)}
                      <p style="font-size:14px;line-height:24px;margin:16px 0">You have been removed as a copresenter from a presentation for GLA Summit ${submissionsForYear}.</p>
                      <p style="font-size:14px;line-height:24px;margin:16px 0">The presentation from which you were removed is shown below.</p>
                      <table style="border-spacing:0px;border-collapse:collapse;color:#444;width:100%;table-layout:fixed">
                        <tr>
                          <td style="${labelStyle}">Type</td>
                          <td style="${tdStyle}">${typeText}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#aaa"></tr>
                        <tr>
                          <td style="${labelStyle}">Title</td>
                          <td style="${tdStyle}">${escapedTitle}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#ddd"></tr>
                        <tr>
                          <td style="${labelStyle}">Abstract</td>
                          <td style="${tdStyle}">${parsedAbstract}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#ddd"></tr>
                        <tr>
                          <td style="${labelStyle}">Learning points</td>
                          <td style="${tdStyle}">${parsedLearningPoints}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#aaa"></tr>
                        <tr>
                          <td style="${labelStyle}">Submitter Name</td>
                          <td style="${tdStyle}">${submitterName}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#ddd"></tr>
                        <tr>
                          <td style="${labelStyle}">Submitter Email</td>
                          <td style="${tdStyle}">${escapedEmail}</td>
                        </tr>
                      </table>
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
    `,
    bodyPlain: `Dear ${nameString},\r\n
    You have been removed as a copresenter from a GLA Summit presentation titled ${title}.\r\n
    More details can be found in an HTML copy of this email - if you would like more detail in our plain-text emails, please contact web@glasummit.org\r\n
    From the GLA Summit Organizers`
  };
};

export const CopresenterResponseNotificationEmailFn = (
  presentationTitle: string,
  copresenterName: string,
  copresenterEmail: string,
  accepted: boolean,
  editLink: string
) => {
  const escapedTitle = escapeHtml(presentationTitle);
  const escapedName = escapeHtml(copresenterName);
  const escapedCopresenterEmail = escapeHtml(copresenterEmail);
  const escapedEditLink = escapeHtml(`https://glasummit.org${editLink}`);
  const action = accepted ? 'accepted' : 'declined';
  const actionPast = accepted ? 'accepted' : 'declined';

  return {
    body: `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <html lang="en">
    <head></head>
    <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">GLA Summit - Co-presenter ${action} your invitation</div>

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
                      <p style="font-size:14px;line-height:24px;margin:16px 0"><strong>${escapedName}</strong> (${escapedCopresenterEmail}) has <strong>${actionPast}</strong> your co-presenter invitation for the presentation:</p>
                      <p style="font-size:16px;line-height:24px;margin:16px 0;font-style:italic">${escapedTitle}</p>
                      <p style="font-size:14px;line-height:24px;margin:16px 0;text-align:center"><a href="${escapedEditLink}" target="_blank" style="background-color:#a25bcd;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block">View or edit presentation</a></p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </body>
  </html>
    `,
    bodyPlain: `${copresenterName} (${copresenterEmail}) has ${actionPast} your co-presenter invitation for the presentation "${presentationTitle}".\r\n
    You can view or edit the presentation at: https://glasummit.org${editLink}\r\n
    From the GLA Summit website`
  };
};
