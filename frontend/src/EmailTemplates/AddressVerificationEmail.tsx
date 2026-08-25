import { escapeHtml, LogoImg, UnexpectedEmail } from './emailComponents';
import { submissionsForYear } from '@/app/configConstants';

const shell = (title: string, inner: string) => `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>GLA Summit ${submissionsForYear} - ${title}</title>
    <html lang="en">
    <head>
    </head>
    <body>
      <table align="center" width="100%" role="presentation" cellSpacing="0" cellPadding="0" border="0" style="max-width:37.5em;background-color:#ffffff;border:1px solid #eee;border-radius:5px;box-shadow:0 5px 10px rgba(20,50,70,.2);margin-top:20px;width:400px;margin:0 auto;padding:12px 0 36px">
        <tbody>
          <tr style="width:100%">
            <td>${LogoImg}
              <h1 style="color:#5837b9;font-size:32px;font-weight:700;text-align:center">GLA Summit ${submissionsForYear}</h1>
              <table align="center" width="100%" role="presentation" cellSpacing="0" cellPadding="0" border="0" style="max-width:37.5em;color:#333;padding:0 48px 24px 48px">
                <tbody>
                  <tr style="width:100%">
                    <td>
${inner}
                    </td>
                  </tr>
                </tbody>
              </table>
              ${UnexpectedEmail}
            </td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
`;

/**
 * Sent to the address being added, to prove the person adding it can read it.
 *
 * The recipient's identity is exactly what has not been established yet, so
 * this template names nobody: it greets the address itself (which also shows
 * the reader which alias is being claimed) and attributes the request to
 * "someone". The account holder's name is deliberately withheld — it would be
 * disclosed to an address we cannot yet tie to the account, and since it is
 * free text the requester chose, attributing the request to it would let a
 * mail from our domain carry their wording. The owner learns who did what from
 * `AddressAddedNoticeEmailFn`, which only goes to an already-verified address.
 */
export const AddressVerificationEmailFn = (
  emailAddress: string,
  otpValue: string
) =>
  shell(
    'Confirm your email address',
    `                      <p style="font-size:14px;line-height:24px;margin:16px 0">Dear ${escapeHtml(emailAddress)},</p>
                      <p style="font-size:14px;line-height:24px;margin:16px 0">Someone asked to add this address to a GLA Summit account, so that it can be used to sign in. Your confirmation code is:</p>
                      <table align="center" width="100%" style="background:rgba(0,0,0,.05);border-radius:4px;margin:16px auto 14px;vertical-align:middle;width:220px" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                        <tbody>
                          <tr>
                            <td>
                              <p style="font-size:32px;line-height:40px;margin:0 auto;color:#000;display:inline-block;font-family:HelveticaNeue-Bold;font-weight:700;letter-spacing:6px;padding-bottom:8px;padding-top:8px;width:100%;text-align:center">${otpValue}</p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <p style="font-size:14px;line-height:24px;margin:16px 0">The code expires in 15 minutes. If you did not request this, no action is needed — the address will not be added.</p>`
  );

export const addressVerificationEmailText = (
  emailAddress: string,
  otpValue: string
) =>
  [
    `Dear ${emailAddress},\r\n`,
    'Someone asked to add this address to a GLA Summit account so it can be used to sign in.\r\n',
    `Your confirmation code is ${otpValue}\r\n`,
    'The code expires in 15 minutes. If you did not request this, no action is needed - the address will not be added.\r\n',
    'GLA Summit Organizers'
  ].join('\r\n');

/**
 * Sent to the address that is already on the account, so an addition someone
 * else made is visible to the owner rather than silent.
 */
export const AddressAddedNoticeEmailFn = (
  nameString: string,
  addedEmail: string
) =>
  shell(
    'An address was added to your account',
    `                      <p style="font-size:14px;line-height:24px;margin:16px 0">Dear ${escapeHtml(nameString)},</p>
                      <p style="font-size:14px;line-height:24px;margin:16px 0">The address <strong>${escapeHtml(addedEmail)}</strong> was added to your GLA Summit account, and can now be used to sign in.</p>
                      <p style="font-size:14px;line-height:24px;margin:16px 0">If you did not do this, please reply to this email so that we can remove it and secure your account.</p>`
  );

export const addressAddedNoticeEmailText = (
  nameString: string,
  addedEmail: string
) =>
  [
    `Dear ${nameString},\r\n`,
    `The address ${addedEmail} was added to your GLA Summit account, and can now be used to sign in.\r\n`,
    'If you did not do this, please reply to this email so that we can remove it and secure your account.\r\n',
    'GLA Summit Organizers'
  ].join('\r\n');
