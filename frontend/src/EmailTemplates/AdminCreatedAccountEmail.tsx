import { escapeHtml, LogoImg } from './emailComponents';
import { submissionsForYear } from '@/app/configConstants';

/**
 * Welcome email for a presenter whose account was created for them by an
 * organizer through the admin panel (/admin/create-presenter).
 *
 * Styled after RegistrationEmailFn — same logo/heading/OTP block — but the copy
 * has to do more work: the recipient never asked for this account, so the email
 * says who created it, why, and exactly how to take it over. The one-time
 * passcode comes from the same Supabase signup link used for new co-presenters,
 * so verifying is the recipient's first sign-in.
 *
 * NOTE for local testing: the verify link hard-codes https://glasummit.org, as
 * every template in this directory does. Clicking it while testing against a
 * local stack opens PRODUCTION, where a locally-issued passcode can never
 * validate. Enter the code at the local /auth/validateLogin instead — and note
 * that route redirects a signed-in visitor away, so sign out of the admin
 * account first.
 */
export const AdminCreatedAccountEmailFn = (
  nameString: string,
  createdByName: string,
  otpValue: string,
  validateLoginUrl: string
) => {
  const escapedName = escapeHtml(nameString);
  const escapedCreatedBy = escapeHtml(createdByName);
  const escapedOtp = escapeHtml(otpValue);
  const escapedValidateUrl = escapeHtml(
    `https://glasummit.org${validateLoginUrl}`
  );

  return {
    body: `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <title>GLA Summit ${submissionsForYear} - Welcome</title>
  <html lang="en">
    <head></head>
    <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">GLA Summit - An account has been created for you</div>

    <body style="background-color:#ffffff;font-family:Roboto,Arial,sans-serif">
      <table align="center" width="100%" role="presentation" cellSpacing="0" cellPadding="0" border="0" style="max-width:37.5em;background-color:#ffffff;border:1px solid #eee;border-radius:5px;box-shadow:0 5px 10px rgba(20,50,70,.2);margin-top:20px;width:400px;margin:0 auto;padding:12px 0 36px">
        <tbody>
          <tr style="width:100%">
            <td>${LogoImg}
              <h1 style="color:#5837b9;font-size:32px;font-weight:700;text-align:center">GLA Summit ${submissionsForYear}</h1>
              <table align="center" width="100%" role="presentation" cellSpacing="0" cellPadding="0" border="0" style="max-width:37.5em;color:#333;padding:0 48px 24px 48px">
                <tbody>
                  <tr style="width:100%">
                    <td>
                      <p style="font-size:14px;line-height:24px;margin:16px 0">Dear ${escapedName},</p>
                      <p style="font-size:14px;line-height:24px;margin:16px 0">Welcome to GLA Summit ${submissionsForYear}! ${escapedCreatedBy} has created an account for you on the GLA Summit website so that a presentation could be submitted on your behalf.</p>
                      <p style="font-size:14px;line-height:24px;margin:16px 0">If you would like to edit or review your profile biography or photo, or check your submission, you can use the code below to login.</p>
                      <p style="font-size:14px;line-height:24px;margin:16px 0;text-align:center"><a href="${escapedValidateUrl}" target="_blank" style="background-color:#a25bcd;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block">Login to your account</a></p>
                      <p style="font-size:14px;line-height:24px;margin:16px 0">If the button does not work, go to <a href="https://glasummit.org/auth/validateLogin" target="_blank" style="color:#a25bcd;text-decoration:underline">glasummit.org/auth/validateLogin</a> and enter the one-time passcode below:</p>
                      <table align="center" width="100%" style="background:rgba(0,0,0,.05);border-radius:4px;margin:16px auto 14px;vertical-align:middle;width:220px" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                        <tbody>
                          <tr>
                            <td>
                              <p style="font-size:32px;line-height:40px;margin:0 auto;color:#000;display:inline-block;font-family:HelveticaNeue-Bold;font-weight:700;letter-spacing:6px;padding-bottom:8px;padding-top:8px;width:100%;text-align:center">${escapedOtp}</p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <p style="font-size:14px;line-height:24px;margin:16px 0">A separate email describes the presentation that was submitted for you. If this was unexpected, please contact <a href="mailto:web@glasummit.org" target="_blank" style="color:#a25bcd;text-decoration:underline">web@glasummit.org</a> and we will remove the account.</p>
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
    bodyPlain: `Dear ${nameString},\r\n
    Welcome to GLA Summit ${submissionsForYear}! ${createdByName} has created an account for you on the GLA Summit website so that a presentation could be submitted on your behalf.\r\n
    To login and review your profile biography, image or presentation, visit: https://glasummit.org${validateLoginUrl}\r\n
    If that link doesn't work, go to https://glasummit.org/auth/validateLogin and enter the one-time passcode: ${otpValue}\r\n
    A separate email describes the presentation that was submitted for you. If this was unexpected, please contact web@glasummit.org and we will remove the account.\r\n
    From the GLA Summit Organizers`
  };
};
